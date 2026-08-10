# ============================================================
# MyShape Protocol — install client-side git hooks (Windows)
# Writes a thin wrapper at .git/hooks/pre-push that defers to the
# version-controlled scripts/githooks/pre-push.
#
#   powershell -ExecutionPolicy Bypass -File scripts/githooks/install.ps1
# ============================================================

$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Set-Location $root

$target = Join-Path $root '.git\hooks\pre-push'
$hooksDir = Join-Path $root '.git\hooks'

if (-not (Test-Path $hooksDir)) { New-Item -ItemType Directory -Path $hooksDir | Out-Null }

$wrapper = @'
#!/bin/sh
exec "$(dirname "$0")/../../scripts/githooks/pre-push"
'@

# Write as UTF-8 without BOM, LF line endings
$bytes = [System.Text.Encoding]::UTF8.GetBytes(($wrapper -replace "`r`n", "`n"))
[System.IO.File]::WriteAllBytes((Resolve-Path $hooksDir).Path + '\pre-push', $bytes)

Write-Host "✓ Installed pre-push hook → $target"
Write-Host "  It runs the committed scripts/githooks/pre-push on every push."
