Set-StrictMode -Version Latest

function Assert-OrdinaryPath([string] $Path) {
    $cursor = [IO.Path]::GetFullPath($Path)
    while ($cursor) {
        if (Test-Path -LiteralPath $cursor) {
            $item = Get-Item -LiteralPath $cursor -Force -ErrorAction Stop
            if ($item.Attributes -band [IO.FileAttributes]::ReparsePoint) {
                throw "Symbolic links/junctions are not allowed in deployment paths: $cursor"
            }
        }
        $parent = Split-Path $cursor -Parent
        if ($parent -eq $cursor) { break }
        $cursor = $parent
    }
}

function Get-DeployHash([string] $Path) {
    $stream = [IO.File]::OpenRead($Path)
    $algorithm = [Security.Cryptography.SHA256]::Create()
    try { return [Convert]::ToBase64String($algorithm.ComputeHash($stream)) }
    finally { $stream.Dispose(); $algorithm.Dispose() }
}

function Copy-VerifiedFile([string] $Source, [string] $Target) {
    Assert-OrdinaryPath $Source
    $null = New-Item -ItemType Directory -Path (Split-Path $Target -Parent) -Force -ErrorAction Stop
    Copy-Item -LiteralPath $Source -Destination $Target -Force -ErrorAction Stop
    if ((Get-DeployHash $Source) -ne (Get-DeployHash $Target)) {
        throw "Copy verification failed: $Target"
    }
}

function Invoke-FamilyDeployment {
    param(
        [Parameter(Mandatory)][string] $ClientRoot,
        [Parameter(Mandatory)][string] $ApiRoot,
        [Parameter(Mandatory)][string] $Destination,
        [Parameter(Mandatory)][scriptblock] $Build,
        [Parameter(Mandatory)][scriptblock] $ValidatePhp
    )
    $ErrorActionPreference = 'Stop'
    $client = [IO.Path]::GetFullPath($ClientRoot).TrimEnd('\')
    $api = [IO.Path]::GetFullPath($ApiRoot).TrimEnd('\')
    $target = [IO.Path]::GetFullPath($Destination).TrimEnd('\')
    $parent = Split-Path $target -Parent
    if ((Split-Path $target -Leaf) -ne 'theallinfamily' -or
        (Split-Path $parent -Leaf) -ne 'live') {
        throw 'Destination must be a theallinfamily folder directly inside a live folder.'
    }
    foreach ($source in @($client, $api)) {
        if ($target -eq $source -or $target.StartsWith($source + '\', [StringComparison]::OrdinalIgnoreCase) -or
            $source.StartsWith($target + '\', [StringComparison]::OrdinalIgnoreCase)) {
            throw 'Deployment destination must not overlap a source checkout.'
        }
    }
    foreach ($path in @($client, $api, $target)) { Assert-OrdinaryPath $path }
    if (-not (Test-Path -LiteralPath $parent -PathType Container)) { throw "Live parent folder does not exist: $parent" }
    if ((Test-Path -LiteralPath $target) -and -not (Test-Path -LiteralPath $target -PathType Container)) {
        throw 'Deployment destination is a file, not a folder.'
    }
    # The previous directory is renamed as a whole, never traversed or copied.
    # Checking its ancestors is sufficient and avoids scanning a large legacy site.
    $lock = $null
    $stage = $null
    $backup = $null
    try {
        $lockPath = Join-Path $parent '.theallinfamily.deploy.lock'
        Assert-OrdinaryPath $lockPath
        $lock = [IO.File]::Open($lockPath, [IO.FileMode]::OpenOrCreate, [IO.FileAccess]::ReadWrite, [IO.FileShare]::None)
        Write-Host 'Building React. Existing live files remain untouched until validation passes.'
        & $Build
        $dist = Join-Path $client 'dist'
        foreach ($required in @('index.html', '.htaccess')) {
            if (-not (Test-Path -LiteralPath (Join-Path $dist $required) -PathType Leaf)) { throw "Build output missing $required" }
        }
        if (-not (Test-Path -LiteralPath (Join-Path $dist 'assets') -PathType Container)) { throw 'Build assets are missing.' }
        foreach ($required in @('index.php', '.htaccess', '.env.example', 'src/bootstrap.php')) {
            if (-not (Test-Path -LiteralPath (Join-Path $api $required) -PathType Leaf)) { throw "API source missing $required" }
        }
        foreach ($root in @($dist, (Join-Path $api 'src'))) {
            Assert-OrdinaryPath $root
            foreach ($entry in Get-ChildItem -LiteralPath $root -Recurse -Force) { Assert-OrdinaryPath $entry.FullName }
        }
        $tag = (Get-Date -Format 'yyyyMMdd-HHmmss') + '-' + [Guid]::NewGuid().ToString('N').Substring(0, 8)
        $stage = Join-Path $parent ".theallinfamily-stage-$tag"
        $null = New-Item -ItemType Directory -Path $stage
        foreach ($file in Get-ChildItem -LiteralPath $dist -Recurse -Force -File) {
            $relative = $file.FullName.Substring($dist.Length + 1)
            if ($relative -match '(^|[\\/])(\.env[^\\/]*|\.git|node_modules)([\\/]|$)' -or $file.Extension -eq '.map') {
                throw "Unexpected development file in build: $relative"
            }
            Copy-VerifiedFile $file.FullName (Join-Path $stage $relative)
        }
        foreach ($relative in @('index.php', '.htaccess', '.env.example')) {
            Copy-VerifiedFile (Join-Path $api $relative) (Join-Path $stage "api/$relative")
        }
        foreach ($file in Get-ChildItem -LiteralPath (Join-Path $api 'src') -Recurse -Force -File) {
            if ($file.Extension -ne '.php') { throw "Unexpected API runtime file: $($file.Name)" }
            Copy-VerifiedFile $file.FullName (Join-Path $stage ('api/' + $file.FullName.Substring($api.Length + 1)))
        }
        foreach ($file in Get-ChildItem -LiteralPath (Join-Path $stage 'api') -Recurse -File -Filter '*.php') {
            & $ValidatePhp $file.FullName
        }
        # Keep all previous content outside the upload directory, including hidden files.
        $backupRoot = Join-Path $parent '.deploy-backups'
        Assert-OrdinaryPath $backupRoot
        $null = New-Item -ItemType Directory -Path $backupRoot -Force
        Set-Content -LiteralPath (Join-Path $backupRoot '.htaccess') -Value 'Require all denied' -Encoding ASCII
        Assert-OrdinaryPath $target
        if (Test-Path -LiteralPath $target) {
            $backup = Join-Path $backupRoot "theallinfamily-$tag"
            Move-Item -LiteralPath $target -Destination $backup -ErrorAction Stop
        }
        try {
            Move-Item -LiteralPath $stage -Destination $target -ErrorAction Stop
            $stage = $null
        } catch {
            if ($backup -and -not (Test-Path -LiteralPath $target)) {
                Move-Item -LiteralPath $backup -Destination $target -ErrorAction Stop
                $backup = $null
            }
            throw
        }
        Write-Host "Upload package ready: $target"
        if ($backup) { Write-Host "Previous files backed up: $backup" }
        Write-Host 'Server environment, database migrations and private photo/session storage are managed separately; verify hosting setup before uploading.'
        Write-Host 'No database, credentials, local uploads, tests or development tools have been copied.'
    } catch {
        if ($stage) { Write-Warning "Incomplete staging folder retained for diagnosis: $stage" }
        throw
    } finally {
        if ($lock) { $lock.Dispose() }
    }
}
