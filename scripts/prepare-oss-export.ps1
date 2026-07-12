# Optional owner-only helper: scrubbed one-way copy from a private tree into a clean directory.
# The public GitHub repo (jackjusko/brewledger-oss, branch main) is the OSS source of truth.
# Contributors and co-maintainers do NOT use this script—open PRs against the public repo.
#
# Usage:
#   .\scripts\prepare-oss-export.ps1
#   .\scripts\prepare-oss-export.ps1 -OutputDir "D:\brewledger-public" -Force

param(
    [string]$OutputDir = (Join-Path (Split-Path $PSScriptRoot -Parent) "oss-export"),
    [switch]$Force
)

$ErrorActionPreference = "Stop"
$Root = Split-Path $PSScriptRoot -Parent
$OutputDir = [System.IO.Path]::GetFullPath($OutputDir)

Write-Host "Source: $Root"
Write-Host "Output: $OutputDir"

if (Test-Path $OutputDir) {
    if (-not $Force) {
        throw "Output directory exists: $OutputDir. Pass -Force to overwrite."
    }
    cmd /c "rmdir /s /q `"$OutputDir`"" 2>$null
    if (Test-Path $OutputDir) {
        throw "Could not remove existing output directory: $OutputDir"
    }
}
New-Item -ItemType Directory -Path $OutputDir | Out-Null

# Robocopy exclude directories (no trailing slashes)
$xd = @(
    "node_modules", "dist", "build", "www", ".gradle", "Pods", "DerivedData",
    "coverage", ".vite", ".vitest", "changes", ".cursor", ".letta", "blogrip",
    "assorted", ".git"
)
$xdArgs = $xd | ForEach-Object { "/XD", $_ }

# Robocopy exclude files
$xf = @("*.sqlite", "*.sqlite3", "*.db", ".env", "._*", "ttb.pdf")
$xfArgs = $xf | ForEach-Object { "/XF", $_ }

function Copy-Tree {
    param([string]$RelativePath)
    $src = Join-Path $Root $RelativePath
    if (-not (Test-Path $src)) {
        Write-Warning "Skip missing: $RelativePath"
        return
    }
    $dest = Join-Path $OutputDir $RelativePath
    if (Test-Path $src -PathType Leaf) {
        $destDir = Split-Path $dest -Parent
        if (-not (Test-Path $destDir)) { New-Item -ItemType Directory -Path $destDir -Force | Out-Null }
        Copy-Item -Force $src $dest
        Write-Host "  file: $RelativePath"
        return
    }
    Write-Host "  dir:  $RelativePath"
    & robocopy $src $dest /E /NFL /NDL /NJH /NJS /nc /ns /np @xdArgs @xfArgs | Out-Null
    if ($LASTEXITCODE -ge 8) { throw "robocopy failed for $RelativePath (exit $LASTEXITCODE)" }
}

Write-Host "`nCopying allowlisted paths..."
$topLevel = @(
    "server",
    "platforms",
    "docs",
    "scripts",
    ".github",
    "README.md",
    "FAQ.md",
    "LICENSE",
    "NOTICE",
    "ARCHITECTURE.md",
    "SECURITY.md",
    "CODE_OF_CONDUCT.md",
    "GOVERNANCE.md",
    "MAINTAINERS.md",
    "CONTRIBUTING.md",
    ".env.example",
    ".gitignore"
)
foreach ($item in $topLevel) { Copy-Tree $item }

# Explicit post-copy removals
$explicitRemoves = @(
    "server\content\blog",
    "platforms\console\src\blog",
    "platforms\console\index_migrate.html",
    "platforms\brewledger-app\src\brewledger.html",
    "platforms\brewledger-app\android\app\src\main\assets\public",
    "platforms\brewledger-app\ios\App\App\public"
)
Write-Host "`nRemoving excluded paths..."
foreach ($rel in $explicitRemoves) {
    $p = Join-Path $OutputDir $rel
    if (Test-Path $p) {
        Write-Host "  remove: $rel"
        Remove-Item -Recurse -Force $p
    }
}

# Secret scan
Write-Host "`nScanning for secret patterns..."
$hits = @()
Get-ChildItem -Path $OutputDir -Recurse -File -ErrorAction SilentlyContinue |
    Where-Object { $_.Extension -match '\.(js|vue|json|md|env|html|cjs|ps1)$' } |
    ForEach-Object {
        $content = Get-Content $_.FullName -Raw -ErrorAction SilentlyContinue
        if ($content -match 'discord\.com/api/webhooks') { $hits += "$($_.FullName): discord webhook" }
        if ($content -match 'sk_live_') { $hits += "$($_.FullName): sk_live_" }
        if ($content -match 'sk_test_[a-zA-Z0-9]{10,}') { $hits += "$($_.FullName): sk_test_" }
        if ($content -match 'whsec_[a-zA-Z0-9]{10,}' -and $_.Name -notmatch 'billing\.spec') { $hits += "$($_.FullName): whsec_" }
        if ($content -match 'AKIA[0-9A-Z]{16}') { $hits += "$($_.FullName): AKIA" }
        if ($_.Extension -eq '.md' -and $content -match '192\.168\.\d+\.\d+') { $hits += "$($_.FullName): private LAN IP" }
    }

if ($hits.Count -gt 0) {
    Write-Host "WARNING: Potential secrets:" -ForegroundColor Red
    $hits | ForEach-Object { Write-Host "  $_" -ForegroundColor Red }
    exit 1
}
Write-Host "  No discord / sk_live / sk_test / whsec / AKIA / LAN IP patterns in export." -ForegroundColor Green

Write-Host "`nExport complete: $OutputDir"
