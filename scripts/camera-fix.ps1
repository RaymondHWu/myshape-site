# CAMERA FIX: Enable desktop app (browser) camera access
# Run as Administrator
# Right-click → "Run with PowerShell" (as Administrator)

$ErrorActionPreference = "Stop"

Write-Host "Enabling camera access for desktop apps (browsers)..." -ForegroundColor Cyan

$path = "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\CapabilityAccessManager\ConsentStore\webcam"

# 1. Ensure directory exists
if (-not (Test-Path "$path\NonPackaged")) {
    New-Item -Path "$path\NonPackaged" -Force | Out-Null
    Write-Host "  Created NonPackaged key" -ForegroundColor Green
}

# 2. Set the Allow value
Set-ItemProperty -Path "$path\NonPackaged" -Name "Value" -Value "Allow" -Type String
Write-Host "  Set desktop app access to: Allow" -ForegroundColor Green

# 3. Verify
$val = Get-ItemPropertyValue -Path "$path\NonPackaged" -Name "Value"
Write-Host ""
Write-Host "Current setting: $val" -ForegroundColor $(if ($val -eq "Allow") { "Green" } else { "Red" })
Write-Host ""
Write-Host "DONE. Now:" -ForegroundColor Yellow
Write-Host "  1. Close ALL browser windows completely" -ForegroundColor White
Write-Host "  2. Reopen browser" -ForegroundColor White
Write-Host "  3. Go to http://localhost:3001/camera-test" -ForegroundColor White
Write-Host "  4. Click Start — camera should work now" -ForegroundColor White

Read-Host "Press Enter to exit"
