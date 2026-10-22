$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
try {
    . "$PSScriptRoot/deployment.ps1"
    $client = Split-Path $PSScriptRoot -Parent
    $api = Join-Path (Split-Path $client -Parent) 'api'
    $target = 'C:\xampp\htdocs\WebSitesDesigns\live\theallinfamily'
    $npm = (Get-Command npm.cmd -ErrorAction Stop).Source
    $php = Get-Command php.exe -ErrorAction SilentlyContinue
    $phpPath = if ($php) { $php.Source } else { 'C:\xampp\php\php.exe' }
    if (-not (Test-Path -LiteralPath $phpPath -PathType Leaf)) {
        throw 'PHP CLI is required to validate the packaged API. Add php.exe to PATH.'
    }
    Push-Location $client
    try {
        $previousApiBase = $env:VITE_API_BASE_URL
        $env:VITE_API_BASE_URL = '/api'
        try {
            Invoke-FamilyDeployment -ClientRoot $client -ApiRoot $api -Destination $target -Build {
                & $npm run build -- --base=/
                if ($LASTEXITCODE -ne 0) { throw "React build failed (exit $LASTEXITCODE)." }
            } -ValidatePhp {
                param($file)
                $result = & $phpPath -l $file 2>&1
                if ($LASTEXITCODE -ne 0) { throw "PHP syntax validation failed: $result" }
            }
        } finally { $env:VITE_API_BASE_URL = $previousApiBase }
    } finally { Pop-Location }
    exit 0
} catch {
    [Console]::Error.WriteLine("DEPLOY FAILED: $($_.Exception.Message)")
    exit 1
}
