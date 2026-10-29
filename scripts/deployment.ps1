Set-StrictMode -Version Latest

function Get-FamilyPackageName {
    param([ValidateSet('All', 'Client', 'Api')][string] $Mode = 'All')
    # Mode selects the payload; every mode replaces the same disposable package.
    'theallinfamily'
}

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

function Assert-OrdinaryTree([string] $Path) {
    Assert-OrdinaryPath $Path
    $pending = New-Object 'Collections.Generic.Stack[string]'
    $pending.Push($Path)
    while ($pending.Count) {
        foreach ($entry in Get-ChildItem -LiteralPath $pending.Pop() -Force) {
            Assert-OrdinaryPath $entry.FullName
            if ($entry.PSIsContainer) { $pending.Push($entry.FullName) }
        }
    }
}

function Remove-DeployWork([string] $Path, [string] $Parent) {
    $resolved = [IO.Path]::GetFullPath($Path)
    if ((Split-Path $resolved -Parent) -ne $Parent -or
        (Split-Path $resolved -Leaf) -notlike '.theallinfamily-work-*') {
        throw "Refusing unsafe deployment cleanup: $resolved"
    }
    if (-not (Test-Path -LiteralPath $resolved)) { return }
    Assert-OrdinaryTree $resolved
    # Keep the deny rule until every payload child has been removed. A recursive
    # removal of the work root could delete the rule before failing on a file.
    foreach ($entry in Get-ChildItem -LiteralPath $resolved -Force) {
        if ($entry.Name -ne '.htaccess') {
            Remove-Item -LiteralPath $entry.FullName -Recurse -Force -ErrorAction Stop
        }
    }
    $rules = Join-Path $resolved '.htaccess'
    if (Test-Path -LiteralPath $rules) {
        Remove-Item -LiteralPath $rules -Force -ErrorAction Stop
    }
    # Nonrecursive: after removing the rule, only an empty directory may go.
    [IO.Directory]::Delete($resolved)
}

function Invoke-FamilyDeployment {
    param(
        [ValidateSet('All', 'Client', 'Api')][string] $Mode = 'All',
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
    $packageName = Get-FamilyPackageName $Mode
    $includeClient = $Mode -ne 'Api'
    $includeApi = $Mode -ne 'Client'
    if ((Split-Path $target -Leaf) -ne $packageName -or
        (Split-Path $parent -Leaf) -ne 'live') {
        throw "Destination for $Mode must be a $packageName folder directly inside a live folder."
    }
    foreach ($source in @($client, $api)) {
        if ($target -eq $source -or $target.StartsWith($source + '\', [StringComparison]::OrdinalIgnoreCase) -or
            $source.StartsWith($target + '\', [StringComparison]::OrdinalIgnoreCase)) {
            throw 'Deployment destination must not overlap a source checkout.'
        }
    }
    Assert-OrdinaryPath $target
    if ($includeClient) { Assert-OrdinaryPath $client }
    if ($includeApi) { Assert-OrdinaryPath $api }
    if (-not (Test-Path -LiteralPath $parent -PathType Container)) { throw "Live parent folder does not exist: $parent" }
    if ((Test-Path -LiteralPath $target) -and -not (Test-Path -LiteralPath $target -PathType Container)) {
        throw 'Deployment destination is a file, not a folder.'
    }
    $lock = $null
    $stage = $null
    $work = $null
    $deploymentError = $null
    try {
        $lockPath = Join-Path $parent '.theallinfamily.deploy.lock'
        Assert-OrdinaryPath $lockPath
        # Delete atomically on close, avoiding a close/delete race with the next run.
        $lock = [IO.FileStream]::new($lockPath, [IO.FileMode]::OpenOrCreate,
            [IO.FileAccess]::ReadWrite, [IO.FileShare]::None, 4096, [IO.FileOptions]::DeleteOnClose)
        Write-Host "Preparing $Mode package. Existing packages remain untouched until validation passes."
        $runtimeRoots = @()
        if ($includeClient) {
            & $Build
            $dist = Join-Path $client 'dist'
            foreach ($required in @('index.html', '.htaccess')) {
                if (-not (Test-Path -LiteralPath (Join-Path $dist $required) -PathType Leaf)) { throw "Build output missing $required" }
            }
            if (-not (Test-Path -LiteralPath (Join-Path $dist 'assets') -PathType Container)) { throw 'Build assets are missing.' }
            if (Test-Path -LiteralPath (Join-Path $dist 'api')) { throw 'Client build must not contain an api entry.' }
            $runtimeRoots += $dist
        }
        if ($includeApi) {
            foreach ($required in @('index.php', '.htaccess', '.env.example', 'src/bootstrap.php')) {
                if (-not (Test-Path -LiteralPath (Join-Path $api $required) -PathType Leaf)) { throw "API source missing $required" }
            }
            $runtimeRoots += Join-Path $api 'src'
        }
        foreach ($root in $runtimeRoots) {
            Assert-OrdinaryPath $root
            foreach ($entry in Get-ChildItem -LiteralPath $root -Recurse -Force) { Assert-OrdinaryPath $entry.FullName }
        }
        $tag = (Get-Date -Format 'yyyyMMdd-HHmmss') + '-' + [Guid]::NewGuid().ToString('N').Substring(0, 8)
        # Stage only the new build; the repository is the source of truth.
        $workPath = Join-Path $parent ".theallinfamily-work-$tag"
        $null = New-Item -ItemType Directory -Path $workPath
        $work = $workPath
        Set-Content -LiteralPath (Join-Path $work '.htaccess') -Value 'Require all denied' -Encoding ASCII
        $stage = Join-Path $work ".$packageName-stage-$tag"
        $null = New-Item -ItemType Directory -Path $stage
        if ($includeClient) {
            foreach ($file in Get-ChildItem -LiteralPath $dist -Recurse -Force -File) {
                $relative = $file.FullName.Substring($dist.Length + 1)
                if ($relative -match '(^|[\\/])(\.env[^\\/]*|\.git|node_modules)([\\/]|$)' -or $file.Extension -eq '.map') {
                    throw "Unexpected development file in build: $relative"
                }
                Copy-VerifiedFile $file.FullName (Join-Path $stage $relative)
            }
        }
        if ($includeApi) {
            if (Test-Path -LiteralPath (Join-Path $api 'src/daily-word.php')) {
                foreach ($asset in @('answers.txt', 'guesses.txt', 'COPYRIGHT.txt', 'provenance.json')) {
                    if (-not (Test-Path -LiteralPath (Join-Path $api "src/daily-word-data/$asset") -PathType Leaf)) { throw "Missing Daily Word runtime asset: $asset" }
                }
            }
            foreach ($relative in @('index.php', '.htaccess', '.env.example')) {
                Copy-VerifiedFile (Join-Path $api $relative) (Join-Path $stage "api/$relative")
            }
            foreach ($file in Get-ChildItem -LiteralPath (Join-Path $api 'src') -Recurse -Force -File) {
                $relativeRuntime = $file.FullName.Substring((Join-Path $api 'src').Length + 1).Replace('\', '/')
                $wordAsset = $relativeRuntime -cin @('daily-word-data/answers.txt', 'daily-word-data/guesses.txt', 'daily-word-data/COPYRIGHT.txt', 'daily-word-data/provenance.json')
                if ($file.Extension -ne '.php' -and -not $wordAsset) { throw "Unexpected API runtime file: $($file.Name)" }
                Copy-VerifiedFile $file.FullName (Join-Path $stage ('api/' + $file.FullName.Substring($api.Length + 1)))
            }
            foreach ($file in Get-ChildItem -LiteralPath (Join-Path $stage 'api') -Recurse -File -Filter '*.php') {
                & $ValidatePhp $file.FullName
            }
        }
        # The destination is disposable. No previous-package copy or rollback.
        try {
            Assert-OrdinaryPath $target
            if (Test-Path -LiteralPath $target) {
                Assert-OrdinaryTree $target
                Remove-Item -LiteralPath $target -Recurse -Force -ErrorAction Stop
            }
            Move-Item -LiteralPath $stage -Destination $target -ErrorAction Stop
            $stage = $null
        } catch {
            throw "Package replacement failed; the destination may be missing or incomplete. No rollback copy exists. Rebuild from the repository. $($_.Exception.Message)"
        }
        Write-Host "Upload package ready: $target"
        Write-Host 'Upload only the CONTENTS of this package to public_html; do not delete or mirror the remote directory.'
        if (-not $includeApi) { Write-Host 'Client-only package: the server api folder must be retained.' }
        if (-not $includeClient) { Write-Host 'API-only package: merge the included api folder into public_html; retain existing client files and server api/.env.' }
        Write-Host 'Server environment, database migrations and private photo/session storage are managed separately; verify hosting setup before uploading.'
        Write-Host 'No database, credentials, local uploads, tests or development tools have been copied.'
    } catch {
        $deploymentError = $_
        throw
    } finally {
        try {
            if ($work) {
                try { Remove-DeployWork $work $parent }
                catch {
                    $message = "Temporary deployment files could not be removed: $work. $($_.Exception.Message)"
                    if (-not $deploymentError) { throw $message }
                    Write-Warning $message
                }
            }
        } finally {
            if ($lock) { $lock.Dispose() }
        }
    }
}
