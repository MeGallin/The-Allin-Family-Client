# Windows PowerShell; synthetic files only, never connects to a database/server.
$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
. "$PSScriptRoot/deployment.ps1"
$scratch = Join-Path ([IO.Path]::GetTempPath()) ('allin-deploy-modes-' + [Guid]::NewGuid().ToString('N'))
$null = New-Item -ItemType Directory -Path $scratch
$passed = 0
function Assert($Condition, [string] $Message) { if (-not $Condition) { throw $Message } }
function Snapshot([string] $Root) {
    if (-not (Test-Path -LiteralPath $Root)) { return 'MISSING' }
    $rows = @(Get-ChildItem -LiteralPath $Root -Recurse -Force -File | Sort-Object FullName | ForEach-Object {
        $_.FullName.Substring($Root.Length) + ':' + (Get-DeployHash $_.FullName)
    })
    return $rows -join "`n"
}
function Fixture([string] $Mode, [string] $Name) {
    $root = Join-Path $scratch "$Mode-$Name"
    $packageName = Get-FamilyPackageName $Mode
    foreach ($relative in @('client/dist/assets', 'api/src/nested', 'api/.local', 'api/migrations', 'api/tools', 'api/tests')) {
        $null = New-Item -ItemType Directory -Path (Join-Path $root $relative) -Force
    }
    foreach ($relative in @('client/dist/index.html', 'client/dist/.htaccess', 'client/dist/assets/app.js',
        'client/.env', 'api/index.php', 'api/.htaccess', 'api/.env.example', 'api/src/bootstrap.php',
        'api/src/nested/runtime.php', 'api/.env', 'api/.local/database.sql', 'api/migrations/001.sql',
        'api/tools/secret.php', 'api/tests/test.php')) {
        Set-Content -LiteralPath (Join-Path $root $relative) -Value "synthetic $relative" -Encoding ASCII
    }
    foreach ($otherMode in @('All', 'Client', 'Api')) {
        $old = Join-Path $root ('live/' + (Get-FamilyPackageName $otherMode) + '/old')
        $null = New-Item -ItemType Directory -Path $old -Force
        Set-Content -LiteralPath (Join-Path $old '.hidden') -Value "previous $otherMode" -Encoding ASCII
    }
    return @{
        Mode = $Mode; ClientRoot = Join-Path $root 'client'; ApiRoot = Join-Path $root 'api'
        Destination = Join-Path $root "live/$packageName"
        Build = {}; ValidatePhp = { param($file) }
    }
}
function Peers($Options) {
    $parent = Split-Path $Options.Destination -Parent
    return (@(foreach ($mode in @('All', 'Client', 'Api')) {
        if ($mode -ne $Options.Mode) { Snapshot (Join-Path $parent (Get-FamilyPackageName $mode)) }
    }) -join "`n")
}
function Expect-Failure($Options, [string] $Reason) {
    $before = Snapshot $Options.Destination
    $peersBefore = Peers $Options
    $sourceBefore = (Snapshot $Options.ClientRoot) + (Snapshot $Options.ApiRoot)
    $message = ''
    try { Invoke-FamilyDeployment @Options } catch { $message = $_.Exception.Message }
    Assert ($message -match $Reason) "Wrong failure, expected $Reason; got $message"
    Assert ((Snapshot $Options.Destination) -eq $before) 'Failed deployment changed its destination.'
    Assert ((Peers $Options) -eq $peersBefore) 'Failed deployment changed another package.'
    Assert (((Snapshot $Options.ClientRoot) + (Snapshot $Options.ApiRoot)) -eq $sourceBefore) 'Packaging changed source data.'
    $script:passed++
}
try {
    foreach ($mode in @('All', 'Client', 'Api')) {
        $options = Fixture $mode 'success with spaces'
        $before = Snapshot $options.Destination
        $peersBefore = Peers $options
        $sourceBefore = (Snapshot $options.ClientRoot) + (Snapshot $options.ApiRoot)
        $script:built = 0; $script:linted = 0
        $options.Build = { $script:built++ }
        $options.ValidatePhp = { param($file) $script:linted++ }
        Invoke-FamilyDeployment @options
        $expected = @()
        if ($mode -ne 'Api') { $expected += @('.htaccess', 'index.html', 'assets/app.js') }
        if ($mode -ne 'Client') { $expected += @('api/index.php', 'api/.htaccess', 'api/.env.example', 'api/src/bootstrap.php', 'api/src/nested/runtime.php') }
        $actual = @(Get-ChildItem -LiteralPath $options.Destination -Recurse -Force -File | ForEach-Object {
            $_.FullName.Substring($options.Destination.Length + 1).Replace('\', '/')
        })
        Assert ((($actual | Sort-Object) -join ',') -eq (($expected | Sort-Object) -join ',')) "Wrong $mode package contents."
        foreach ($relative in $expected) {
            $source = if ($relative.StartsWith('api/')) { Join-Path $options.ApiRoot $relative.Substring(4) } else { Join-Path $options.ClientRoot "dist/$relative" }
            Assert ((Get-DeployHash $source) -eq (Get-DeployHash (Join-Path $options.Destination $relative))) 'Copied bytes differ.'
        }
        Assert ($script:built -eq [int]($mode -ne 'Api')) 'Wrong build invocation count.'
        $expectedLint = if ($mode -ne 'Client') { 3 } else { 0 }
        Assert ($script:linted -eq $expectedLint) 'Wrong PHP lint invocation count.'
        Assert ((Peers $options) -eq $peersBefore) 'Another mode package changed.'
        Assert (((Snapshot $options.ClientRoot) + (Snapshot $options.ApiRoot)) -eq $sourceBefore) 'Source files changed.'
        $backupRoot = Join-Path (Split-Path $options.Destination -Parent) '.deploy-backups'
        $backups = @(Get-ChildItem -LiteralPath $backupRoot -Directory -Force)
        Assert ($backups.Count -eq 1) 'Expected one backup.'
        Assert ((Snapshot $backups[0].FullName) -eq $before) 'Backup differs from previous package.'
        Assert ((Get-Content -LiteralPath (Join-Path $backupRoot '.htaccess') -Raw).Trim() -eq 'Require all denied') 'Backup access rules missing.'
        $firstPackage = Snapshot $options.Destination
        Invoke-FamilyDeployment @options
        $backups = @(Get-ChildItem -LiteralPath $backupRoot -Directory -Force)
        Assert ($backups.Count -eq 2) 'Repeated packaging overwrote a backup.'
        Assert (@($backups | Where-Object { (Snapshot $_.FullName) -eq $firstPackage }).Count -eq 1) 'Repeated run did not back up the latest package.'
        $script:passed++

        $options = Fixture $mode 'new destination'
        Rename-Item -LiteralPath $options.Destination -NewName 'previous'
        Invoke-FamilyDeployment @options
        Assert (Test-Path -LiteralPath $options.Destination -PathType Container) 'Missing destination not created.'
        $script:passed++

        $options = Fixture $mode 'unused dependency'
        if ($mode -eq 'Api') {
            Rename-Item -LiteralPath (Join-Path $options.ClientRoot 'dist') -NewName 'unused-dist'
            $options.Build = { throw 'API-only called build' }
        } elseif ($mode -eq 'Client') {
            Rename-Item -LiteralPath $options.ApiRoot -NewName 'unused-api'
            $options.ValidatePhp = { throw 'Client-only called PHP' }
        }
        Invoke-FamilyDeployment @options
        $script:passed++

        if ($mode -ne 'Api') {
            $options = Fixture $mode 'build failure'
            $options.Build = { throw 'Simulated build failure' }
            Expect-Failure $options 'Simulated build failure'
            $options = Fixture $mode 'missing dist'
            Rename-Item -LiteralPath (Join-Path $options.ClientRoot 'dist/index.html') -NewName 'missing.html'
            Expect-Failure $options 'Build output missing index.html'
            $options = Fixture $mode 'missing assets'
            Rename-Item -LiteralPath (Join-Path $options.ClientRoot 'dist/assets') -NewName 'missing-assets'
            Expect-Failure $options 'Build assets are missing'
            foreach ($leak in @('.env', 'nested/.git/config', 'bundle.map', 'api/fake.php')) {
                $options = Fixture $mode ('leak-' + $leak.Replace('/', '-'))
                $leakPath = Join-Path $options.ClientRoot "dist/$leak"
                $null = New-Item -ItemType Directory -Path (Split-Path $leakPath -Parent) -Force
                Set-Content -LiteralPath $leakPath -Value 'synthetic forbidden file'
                Expect-Failure $options 'Unexpected development file|must not contain an api'
            }
        }
        if ($mode -ne 'Client') {
            $options = Fixture $mode 'missing api'
            Rename-Item -LiteralPath (Join-Path $options.ApiRoot 'src/bootstrap.php') -NewName 'missing.php'
            Expect-Failure $options 'API source missing'
            $options = Fixture $mode 'unexpected runtime'
            Set-Content -LiteralPath (Join-Path $options.ApiRoot 'src/private.txt') -Value 'synthetic'
            Expect-Failure $options 'Unexpected API runtime file'
            $options = Fixture $mode 'php failure'
            $options.ValidatePhp = { param($file) throw 'Simulated PHP failure' }
            Expect-Failure $options 'Simulated PHP failure'
        }
        $options = Fixture $mode 'copy failure'
        function Copy-Item { throw 'Simulated copy failure' }
        try { Expect-Failure $options 'Simulated copy failure' } finally { Remove-Item Function:Copy-Item }
        $options = Fixture $mode 'hash failure'
        function Copy-Item {
            param($LiteralPath, $Destination, [switch]$Force, $ErrorAction)
            Microsoft.PowerShell.Management\Copy-Item -LiteralPath $LiteralPath -Destination $Destination -Force
            Set-Content -LiteralPath $Destination -Value 'corrupted copy'
        }
        try { Expect-Failure $options 'Copy verification failed' } finally { Remove-Item Function:Copy-Item }
        $options = Fixture $mode 'rollback'
        function Move-Item {
            param($LiteralPath, $Destination, $ErrorAction)
            if ((Split-Path $LiteralPath -Leaf) -like '.*-stage-*') { throw 'Simulated final move failure' }
            Microsoft.PowerShell.Management\Move-Item -LiteralPath $LiteralPath -Destination $Destination -ErrorAction Stop
        }
        try { Expect-Failure $options 'Simulated final move failure' } finally { Remove-Item Function:Move-Item }
        $options = Fixture $mode 'backup failure'
        function Move-Item { throw 'Simulated backup move failure' }
        try { Expect-Failure $options 'Simulated backup move failure' } finally { Remove-Item Function:Move-Item }
        $options = Fixture $mode 'backup permissions failure'
        function Set-Content {
            param($LiteralPath, $Value, $Encoding)
            if ($LiteralPath -like '*\.deploy-backups\.htaccess') { throw 'Simulated backup rules write failure' }
            Microsoft.PowerShell.Management\Set-Content -LiteralPath $LiteralPath -Value $Value -Encoding $Encoding
        }
        try { Expect-Failure $options 'Simulated backup rules write failure' } finally { Remove-Item Function:Set-Content }
        $options = Fixture $mode 'linked backup rules'
        $backupRoot = Join-Path (Split-Path $options.Destination -Parent) '.deploy-backups'
        $null = New-Item -ItemType Directory -Path $backupRoot
        $link = Join-Path $backupRoot '.htaccess'
        $null = New-Item -ItemType Junction -Path $link -Target (Join-Path $options.ApiRoot '.local')
        try { Expect-Failure $options 'junctions' } finally { [IO.Directory]::Delete($link) }
        $options = Fixture $mode 'lock'
        $lockPath = Join-Path (Split-Path $options.Destination -Parent) '.theallinfamily.deploy.lock'
        $handle = [IO.File]::Open($lockPath, [IO.FileMode]::OpenOrCreate, [IO.FileAccess]::ReadWrite, [IO.FileShare]::None)
        try { Expect-Failure $options 'being used|another process|sharing violation' } finally { $handle.Dispose() }
        # A failed attempt must release its lock so another attempt can succeed.
        Invoke-FamilyDeployment @options
        $script:passed++
        $options = Fixture $mode 'source overlap'
        $options.ClientRoot = $options.Destination
        Expect-Failure $options 'must not overlap'
        $options = Fixture $mode 'wrong destination'
        $options.Destination = Join-Path (Split-Path $options.Destination -Parent) 'unrelated'
        Expect-Failure $options 'Destination for'
        $options = Fixture $mode 'invalid mode'
        $options.Mode = 'Unknown'
        Expect-Failure $options 'ValidateSet|does not belong to the set'
        $options = Fixture $mode 'junction'
        $link = Join-Path (Split-Path $options.Destination -Parent) 'linked'
        $null = New-Item -ItemType Junction -Path $link -Target $options.ClientRoot
        $options.Destination = Join-Path $link ('live/' + (Get-FamilyPackageName $mode))
        try { Expect-Failure $options 'junctions' } finally { [IO.Directory]::Delete($link) }
    }
    $options = Fixture 'All' 'cross mode lock'
    $nested = $options.Clone()
    $nested.Mode = 'Client'
    $nested.Destination = Join-Path (Split-Path $options.Destination -Parent) 'theallinfamily-client'
    $options.Build = { Invoke-FamilyDeployment @nested }
    Expect-Failure $options 'being used|another process|sharing violation'
    Write-Host "PASS: $passed mode-specific deployment checks. No real package, live server or database used."
} finally {
    $resolved = [IO.Path]::GetFullPath($scratch)
    $tempRoot = [IO.Path]::GetFullPath([IO.Path]::GetTempPath()).TrimEnd('\') + '\'
    if (-not $resolved.StartsWith($tempRoot, [StringComparison]::OrdinalIgnoreCase) -or
        (Split-Path $resolved -Leaf) -notlike 'allin-deploy-modes-*') { throw 'Refusing unsafe test cleanup.' }
    Remove-Item -LiteralPath $resolved -Recurse -Force
}
