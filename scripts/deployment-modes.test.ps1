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
    foreach ($relative in @('client/dist/assets', 'client/src', 'api/src/nested', 'api/.local', 'api/migrations', 'api/tools', 'api/tests')) {
        $null = New-Item -ItemType Directory -Path (Join-Path $root $relative) -Force
    }
    foreach ($relative in @('client/dist/index.html', 'client/dist/.htaccess', 'client/dist/assets/app.js',
        'client/.env', 'api/index.php', 'api/.htaccess', 'api/.env.example', 'api/src/bootstrap.php',
        'api/src/nested/runtime.php', 'api/.env', 'api/.local/database.sql', 'api/migrations/001.sql',
        'api/tools/secret.php', 'api/tests/test.php')) {
        Set-Content -LiteralPath (Join-Path $root $relative) -Value "synthetic $relative" -Encoding ASCII
    }
    Set-Content -LiteralPath (Join-Path $root 'client/src/app-version.json') -Value '{"version":"0.20"}' -Encoding ASCII
    foreach ($folder in @('theallinfamily', 'unrelated')) {
        $old = Join-Path $root ('live/' + $folder + '/old')
        $null = New-Item -ItemType Directory -Path $old -Force
        Set-Content -LiteralPath (Join-Path $old '.hidden') -Value "previous $folder" -Encoding ASCII
    }
    return @{
        Mode = $Mode; ClientRoot = Join-Path $root 'client'; ApiRoot = Join-Path $root 'api'
        Destination = Join-Path $root "live/$packageName"
        Build = {}; ValidatePhp = { param($file) }
    }
}
function Peers($Options) {
    $parent = Split-Path $Options.Destination -Parent
    return Snapshot (Join-Path $parent 'unrelated')
}
function Expect-Failure($Options, [string] $Reason, [switch] $Locked, [switch] $ReplacementFailed) {
    $before = Snapshot $Options.Destination
    $peersBefore = Peers $Options
    $sourceBefore = (Snapshot $Options.ClientRoot) + (Snapshot $Options.ApiRoot)
    $message = ''
    try { Invoke-FamilyDeployment @Options } catch { $message = $_.Exception.Message }
    Assert ($message -match $Reason) "Wrong failure, expected $Reason; got $message"
    if ($ReplacementFailed) {
        Assert ((Snapshot $Options.Destination) -eq 'MISSING') 'Failed promotion restored or retained a package.'
        Assert ($message -match 'No rollback copy exists') 'Promotion failure omitted the rebuild instruction.'
    } else {
        Assert ((Snapshot $Options.Destination) -eq $before) 'Failed deployment changed its destination.'
    }
    Assert ((Peers $Options) -eq $peersBefore) 'Failed deployment changed an unrelated folder.'
    Assert (((Snapshot $Options.ClientRoot) + (Snapshot $Options.ApiRoot)) -eq $sourceBefore) 'Packaging changed source data.'
    if (Test-Path -LiteralPath (Split-Path $Options.Destination -Parent)) { Assert-CleanLive $Options -Locked:$Locked -MissingDestination:$ReplacementFailed }
    $script:passed++
}
function Assert-CleanLive($Options, [switch] $Locked, [switch] $MissingDestination) {
    $names = @(Get-ChildItem -LiteralPath (Split-Path $Options.Destination -Parent) -Force | ForEach-Object { $_.Name })
    $expected = @('theallinfamily', 'unrelated')
    if ($MissingDestination) { $expected = @($expected | Where-Object { $_ -ne (Get-FamilyPackageName $Options.Mode) }) }
    if ($Locked) { $expected += '.theallinfamily.deploy.lock' }
    Assert ((($names | Sort-Object) -join ',') -eq (($expected | Sort-Object) -join ',')) 'Temporary deployment artifacts remain.'
}
try {
    foreach ($mode in @('All', 'Client', 'Api')) {
        $options = Fixture $mode 'success with spaces'
        $peersBefore = Peers $options
        $sourceBefore = (Snapshot $options.ClientRoot) + (Snapshot $options.ApiRoot)
        $script:built = 0; $script:linted = 0
        $options.Build = { $script:built++ }
        $options.ValidatePhp = { param($file) $script:linted++ }
        Invoke-FamilyDeployment @options
        $expected = @()
        if ($mode -ne 'Api') { $expected += @('.htaccess', 'index.html', 'assets/app.js') }
        if ($mode -ne 'Client') { $expected += @('api/index.php', 'api/.htaccess', 'api/.env.example', 'api/release.json', 'api/src/bootstrap.php', 'api/src/nested/runtime.php') }
        $actual = @(Get-ChildItem -LiteralPath $options.Destination -Recurse -Force -File | ForEach-Object {
            $_.FullName.Substring($options.Destination.Length + 1).Replace('\', '/')
        })
        Assert ((($actual | Sort-Object) -join ',') -eq (($expected | Sort-Object) -join ',')) "Wrong $mode package contents."
        foreach ($relative in $expected) {
            $source = if ($relative -eq 'api/release.json') {
                Join-Path $options.ClientRoot 'src/app-version.json'
            } elseif ($relative.StartsWith('api/')) {
                Join-Path $options.ApiRoot $relative.Substring(4)
            } else {
                Join-Path $options.ClientRoot "dist/$relative"
            }
            Assert ((Get-DeployHash $source) -eq (Get-DeployHash (Join-Path $options.Destination $relative))) 'Copied bytes differ.'
        }
        Assert ($script:built -eq [int]($mode -ne 'Api')) 'Wrong build invocation count.'
        $expectedLint = if ($mode -ne 'Client') { 3 } else { 0 }
        Assert ($script:linted -eq $expectedLint) 'Wrong PHP lint invocation count.'
        Assert ((Peers $options) -eq $peersBefore) 'An unrelated folder changed.'
        Assert (((Snapshot $options.ClientRoot) + (Snapshot $options.ApiRoot)) -eq $sourceBefore) 'Source files changed.'
        Assert-CleanLive $options
        $firstPackage = Snapshot $options.Destination
        Invoke-FamilyDeployment @options
        Assert ((Snapshot $options.Destination) -eq $firstPackage) 'Repeated packaging changed output.'
        Assert-CleanLive $options
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
        $options = Fixture $mode 'promotion failure without rollback'
        function Move-Item {
            param($LiteralPath, $Destination, $ErrorAction)
            if ((Split-Path $LiteralPath -Leaf) -like '.*-stage-*') { throw 'Simulated final move failure' }
            Microsoft.PowerShell.Management\Move-Item -LiteralPath $LiteralPath -Destination $Destination -ErrorAction Stop
        }
        try { Expect-Failure $options 'Simulated final move failure' -ReplacementFailed } finally { Remove-Item Function:Move-Item }
        $options = Fixture $mode 'destination removal failure'
        function Remove-Item {
            param($LiteralPath, [switch] $Recurse, [switch] $Force, $ErrorAction)
            if ($LiteralPath -eq $options.Destination) { throw 'Simulated destination removal failure' }
            Microsoft.PowerShell.Management\Remove-Item -LiteralPath $LiteralPath -Recurse:$Recurse -Force:$Force -ErrorAction Stop
        }
        try { Expect-Failure $options 'Simulated destination removal failure' } finally { Microsoft.PowerShell.Management\Remove-Item Function:Remove-Item }
        $options = Fixture $mode 'work permissions failure'
        function Set-Content {
            param($LiteralPath, $Value, $Encoding)
            if ($LiteralPath -like '*\.theallinfamily-work-*\.htaccess') { throw 'Simulated work rules write failure' }
            Microsoft.PowerShell.Management\Set-Content -LiteralPath $LiteralPath -Value $Value -Encoding $Encoding
        }
        try { Expect-Failure $options 'Simulated work rules write failure' } finally { Remove-Item Function:Set-Content }
        $options = Fixture $mode 'legacy backups untouched'
        $backupRoot = Join-Path (Split-Path $options.Destination -Parent) '.deploy-backups'
        $null = New-Item -ItemType Directory -Path $backupRoot
        Set-Content -LiteralPath (Join-Path $backupRoot 'old.txt') -Value 'existing backup'
        $legacyBefore = Snapshot $backupRoot
        Invoke-FamilyDeployment @options
        Assert ((Snapshot $backupRoot) -eq $legacyBefore) 'Existing backups were changed.'
        Assert (@(Get-ChildItem -LiteralPath (Split-Path $options.Destination -Parent) -Force).Count -eq 3) 'Unexpected deployment files remain.'
        $script:passed++
        $options = Fixture $mode 'lock'
        $lockPath = Join-Path (Split-Path $options.Destination -Parent) '.theallinfamily.deploy.lock'
        $handle = [IO.File]::Open($lockPath, [IO.FileMode]::OpenOrCreate, [IO.FileAccess]::ReadWrite, [IO.FileShare]::None)
        try { Expect-Failure $options 'being used|another process|sharing violation' -Locked } finally { $handle.Dispose() }
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
    $options = Fixture 'All' 'cleanup failure'
    Set-Content -LiteralPath (Join-Path $options.ClientRoot 'dist/retained.txt') -Value 'locked new staging payload' -Encoding ASCII
    $options.ValidatePhp = { param($file) throw 'Simulated PHP failure before promotion' }
    $destinationBefore = Snapshot $options.Destination
    $parent = Split-Path $options.Destination -Parent
    $legacy = Join-Path $parent '.deploy-backups'
    $null = New-Item -ItemType Directory -Path $legacy
    Set-Content -LiteralPath (Join-Path $legacy 'existing.txt') -Value 'legacy backup' -Encoding ASCII
    $legacyBefore = Snapshot $legacy
    $peersBefore = Peers $options
    $sourceBefore = (Snapshot $options.ClientRoot) + (Snapshot $options.ApiRoot)
    $script:cleanupDeleted = 0
    function Remove-Item {
        param($LiteralPath, [switch] $Recurse, [switch] $Force, $ErrorAction)
        # Model partial recursive deletion: some files disappear before a locked
        # payload fails. Including the root rule here catches the old root-delete bug.
        foreach ($file in Get-ChildItem -LiteralPath $LiteralPath -Recurse -Force -File | Sort-Object FullName) {
            if ($file.Name -eq 'retained.txt') { throw 'Simulated cleanup failure' }
            Microsoft.PowerShell.Management\Remove-Item -LiteralPath $file.FullName -Force -ErrorAction Stop
            $script:cleanupDeleted++
        }
        Microsoft.PowerShell.Management\Remove-Item -LiteralPath $LiteralPath -Recurse:$Recurse -Force:$Force -ErrorAction Stop
    }
    $message = ''
    try { Invoke-FamilyDeployment @options } catch { $message = $_.Exception.Message }
    finally { Microsoft.PowerShell.Management\Remove-Item Function:Remove-Item }
    Assert ($message -match 'Simulated PHP failure before promotion') 'Cleanup failure replaced the original validation error.'
    Assert ((Snapshot $options.Destination) -eq $destinationBefore) 'Failed validation changed the current package.'
    $parent = Split-Path $options.Destination -Parent
    Assert (-not (Test-Path -LiteralPath (Join-Path $parent '.theallinfamily.deploy.lock'))) 'Cleanup failure left the lock.'
    $work = @(Get-ChildItem -LiteralPath $parent -Directory -Force -Filter '.theallinfamily-work-*')
    Assert ($work.Count -eq 1) 'Cleanup failure did not retain the work directory.'
    Assert ($script:cleanupDeleted -gt 0) 'Cleanup failed before any partial deletion.'
    $stage = @(Get-ChildItem -LiteralPath $work[0].FullName -Directory -Force -Filter '.*-stage-*')
    Assert ($stage.Count -eq 1) 'Partial cleanup lost the new staging directory.'
    Assert (Test-Path -LiteralPath (Join-Path $stage[0].FullName 'retained.txt')) 'Partial cleanup lost the new staging payload.'
    $expectedRules = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("Require all denied`r`n"))
    $actualRules = [Convert]::ToBase64String([IO.File]::ReadAllBytes((Join-Path $work[0].FullName '.htaccess')))
    Assert ($actualRules -eq $expectedRules) 'Partial cleanup lost or changed the work access rule.'
    Assert ((Snapshot $legacy) -eq $legacyBefore) 'Partial cleanup changed legacy backups.'
    Assert ((Peers $options) -eq $peersBefore) 'Partial cleanup changed another package.'
    Assert (((Snapshot $options.ClientRoot) + (Snapshot $options.ApiRoot)) -eq $sourceBefore) 'Partial cleanup changed source files.'
    Remove-DeployWork $work[0].FullName $parent
    Assert (-not (Test-Path -LiteralPath $work[0].FullName)) 'Staging cleanup left the work directory.'
    Assert (@(Get-ChildItem -LiteralPath $parent -Force).Count -eq 3) 'Unexpected deployment artifacts remain.'
    $script:passed++

    $options = Fixture 'All' 'destination junction refusal'
    $external = Join-Path $options.ApiRoot '.local'
    $externalBefore = Snapshot $external
    $null = New-Item -ItemType Junction -Path (Join-Path $options.Destination 'old/linked') -Target $external
    $message = ''
    try { Invoke-FamilyDeployment @options } catch { $message = $_.Exception.Message }
    Assert ($message -match 'Package replacement failed.*junctions') 'Unsafe destination deletion was accepted.'
    Assert ((Snapshot $external) -eq $externalBefore) 'Cleanup changed a junction target.'
    $parent = Split-Path $options.Destination -Parent
    Assert (Test-Path -LiteralPath (Join-Path $options.Destination 'old/.hidden')) 'Unsafe destination was partially deleted.'
    Assert (-not (Test-Path -LiteralPath (Join-Path $parent '.theallinfamily.deploy.lock'))) 'Unsafe cleanup left the lock.'
    [IO.Directory]::Delete((Join-Path $options.Destination 'old/linked'))
    Assert-CleanLive $options
    $script:passed++

    $options = Fixture 'All' 'cross mode lock'
    $nested = $options.Clone()
    $nested.Mode = 'Client'
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
