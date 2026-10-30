# Run with Windows PowerShell. All mutations use a unique disposable temp folder.
$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
. "$PSScriptRoot/deployment.ps1"
$scratch = Join-Path ([IO.Path]::GetTempPath()) ('allin-deploy-tests-' + [Guid]::NewGuid().ToString('N'))
$null = New-Item -ItemType Directory -Path $scratch
$passed = 0
function Assert($Condition, [string] $Message) {
    if (-not $Condition) { throw $Message }
}
function Fixture([string] $Name) {
    $root = Join-Path $scratch $Name
    foreach ($relative in @('client/dist/assets', 'client/src', 'api/src', 'live/theallinfamily/old')) {
        $null = New-Item -ItemType Directory -Path (Join-Path $root $relative) -Force
    }
    foreach ($relative in @('client/dist/index.html', 'client/dist/.htaccess', 'client/dist/assets/app.js',
        'api/index.php', 'api/.htaccess', 'api/.env.example', 'api/src/bootstrap.php',
        'api/.env', 'live/theallinfamily/old/.hidden')) {
        Set-Content -LiteralPath (Join-Path $root $relative) -Value $relative -Encoding ASCII
    }
    Set-Content -LiteralPath (Join-Path $root 'client/src/app-version.json') -Value '{"version":"0.20"}' -Encoding ASCII
    return @{
        ClientRoot = Join-Path $root 'client'
        ApiRoot = Join-Path $root 'api'
        Destination = Join-Path $root 'live/theallinfamily'
        Build = {}
        ValidatePhp = { param($file) }
    }
}
function Expect-Failure($Options, [string] $Message, [switch] $ReplacementFailed) {
    $failed = $false
    try { Invoke-FamilyDeployment @Options } catch { $failed = $true }
    Assert $failed $Message
    if ($ReplacementFailed) {
        Assert (-not (Test-Path -LiteralPath $Options.Destination)) 'Failed promotion restored an old package.'
    } else {
        Assert (Test-Path -LiteralPath (Join-Path $Options.Destination 'old/.hidden')) 'Old live content was changed before replacement.'
    }
    Assert-CleanLive $Options -MissingDestination:$ReplacementFailed
    $script:passed++
}
function Assert-CleanLive($Options, [switch] $MissingDestination) {
    $entries = @(Get-ChildItem -LiteralPath (Split-Path $Options.Destination -Parent) -Force)
    if ($MissingDestination) { Assert ($entries.Count -eq 0) 'Failed promotion retained deployment artifacts.' }
    else { Assert ($entries.Count -eq 1 -and $entries[0].Name -eq 'theallinfamily') 'Temporary deployment artifacts remain.' }
}
try {
    $options = Fixture 'success with spaces'
    Invoke-FamilyDeployment @options
    Assert (Test-Path -LiteralPath (Join-Path $options.Destination 'api/src/bootstrap.php')) 'API runtime missing.'
    Assert (Test-Path -LiteralPath (Join-Path $options.Destination '.htaccess')) 'SPA rules missing.'
    Assert (-not (Test-Path -LiteralPath (Join-Path $options.Destination 'api/.env'))) 'Private environment leaked.'
    Assert (-not (Test-Path -LiteralPath (Join-Path $options.Destination 'old'))) 'Stale live files remain.'
    Assert-CleanLive $options
    $script:passed++
    $options = Fixture 'promotion failure without rollback'
    function Move-Item {
        param([string] $LiteralPath, [string] $Destination, [string] $ErrorAction)
        if ((Split-Path $LiteralPath -Leaf) -like '.theallinfamily-stage-*') { throw 'Simulated final rename failure' }
        Microsoft.PowerShell.Management\Move-Item -LiteralPath $LiteralPath -Destination $Destination -ErrorAction Stop
    }
    try { Expect-Failure $options 'Final rename failure was accepted.' -ReplacementFailed } finally { Remove-Item Function:Move-Item }
    $options = Fixture 'failed-build'
    $options.Build = { throw 'Simulated build failure' }
    Expect-Failure $options 'Failed build was accepted.'
    $options = Fixture 'missing-output'
    $options.Build = { Rename-Item -LiteralPath (Join-Path $options.ClientRoot 'dist/index.html') -NewName 'missing.html' }
    Expect-Failure $options 'Incomplete build was accepted.'
    $options = Fixture 'php-error'
    $options.ValidatePhp = { param($file) throw 'Simulated PHP syntax error' }
    Expect-Failure $options 'PHP syntax error was accepted.'
    $options = Fixture 'source-leak'
    Set-Content -LiteralPath (Join-Path $options.ClientRoot 'dist/.env') -Value 'private'
    Expect-Failure $options 'Private file in dist was accepted.'
    $options = Fixture 'copy-error'
    $handle = [IO.File]::Open((Join-Path $options.ClientRoot 'dist/assets/app.js'),
        [IO.FileMode]::Open, [IO.FileAccess]::ReadWrite, [IO.FileShare]::None)
    try { Expect-Failure $options 'Locked source copy was accepted.' } finally { $handle.Dispose() }
    $options = Fixture 'concurrent-run'
    $handle = [IO.File]::Open((Join-Path (Split-Path $options.Destination -Parent) '.theallinfamily.deploy.lock'),
        [IO.FileMode]::OpenOrCreate, [IO.FileAccess]::ReadWrite, [IO.FileShare]::None)
    try {
        $failed = $false
        try { Invoke-FamilyDeployment @options } catch { $failed = $true }
        Assert $failed 'Concurrent deployment was accepted.'
        Assert (Test-Path -LiteralPath (Join-Path $options.Destination 'old/.hidden')) 'Locked destination changed.'
        $script:passed++
    } finally { $handle.Dispose() }
    # A subsequent successful owner removes even a pre-existing lock on close.
    Invoke-FamilyDeployment @options
    Assert-CleanLive $options
    $options = Fixture 'unsafe-target'
    $options.Destination = $options.ClientRoot
    $failed = $false
    try { Invoke-FamilyDeployment @options } catch { $failed = $true }
    Assert $failed 'Source checkout destination was accepted.'
    $script:passed++
    $options = Fixture 'overlap'
    $options.ClientRoot = $options.Destination
    Expect-Failure $options 'Source overlap was accepted.'
    $options = Fixture 'junction'
    $junction = Join-Path (Split-Path $options.Destination -Parent) 'linked'
    $null = New-Item -ItemType Junction -Path $junction -Target $options.Destination
    $options.Destination = Join-Path $junction 'live/theallinfamily'
    try {
        $failed = $false
        try { Invoke-FamilyDeployment @options } catch { $failed = $true }
        Assert $failed 'Junction ancestor was accepted.'
        $script:passed++
    } finally { [IO.Directory]::Delete($junction) }
    $options = Fixture 'missing-destination'
    Rename-Item -LiteralPath $options.Destination -NewName 'previous'
    Invoke-FamilyDeployment @options
    Assert (Test-Path -LiteralPath (Join-Path $options.Destination 'index.html')) 'Missing live folder was not created.'
    $script:passed++
    Write-Host "PASS: $passed deployment checks. Real live folder was not used by these tests."
} finally {
    $resolved = [IO.Path]::GetFullPath($scratch)
    $tempRoot = [IO.Path]::GetFullPath([IO.Path]::GetTempPath()).TrimEnd('\') + '\'
    if (-not $resolved.StartsWith($tempRoot, [StringComparison]::OrdinalIgnoreCase) -or
        (Split-Path $resolved -Leaf) -notlike 'allin-deploy-tests-*') { throw 'Refusing unsafe test cleanup.' }
    Remove-Item -LiteralPath $resolved -Recurse -Force
}
