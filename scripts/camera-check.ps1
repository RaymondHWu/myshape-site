# Camera Access Diagnostic for Windows 10/11
# Run: Right-click → "Run with PowerShell"
# Or: powershell -ExecutionPolicy Bypass -File scripts/camera-check.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  MyShape — Camera Access Diagnostic" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check 1: Registry key
$path = "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\CapabilityAccessManager\ConsentStore\webcam"
if (Test-Path $path) {
    $val = Get-ItemPropertyValue -Path $path -Name "Value" -ErrorAction SilentlyContinue
    if ($val -eq "Allow") {
        Write-Host "[OK]  Global camera access is ALLOWED" -ForegroundColor Green
    } else {
        Write-Host "[FAIL] Global camera access is BLOCKED (registry: $val)" -ForegroundColor Red
        Write-Host "  Fix: Windows Settings > Privacy > Camera > ON" -ForegroundColor Yellow
    }
} else {
    Write-Host "[FAIL] Camera registry key not found" -ForegroundColor Red
}

# Check 2: App-specific blocking
Write-Host ""
Write-Host "Checking browser camera permissions..."
$browsers = @("chrome.exe", "firefox.exe", "msedge.exe")
foreach ($b in $browsers) {
    $appPath = "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\CapabilityAccessManager\ConsentStore\webcompat\$b"
    # Check user-level too
    $userPath = "HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\CapabilityAccessManager\ConsentStore\webcam\NonPackaged"
    Write-Host "  $b" -ForegroundColor Gray -NoNewline
    Write-Host " — individual settings are managed via Windows Settings UI" -ForegroundColor Gray
}

Write-Host ""
Write-Host "----------------------------------------" -ForegroundColor Cyan
Write-Host "  HOW TO FIX:" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Cyan
Write-Host "  1. Press Windows key, type 'Camera privacy'" -ForegroundColor White
Write-Host "  2. Turn ON 'Allow apps to access your camera'" -ForegroundColor White
Write-Host "  3. Turn ON 'Allow desktop apps to access your camera'" -ForegroundColor White
Write-Host "  4. Restart your browser completely" -ForegroundColor White
Write-Host ""
Write-Host "  If both are already ON, try:" -ForegroundColor Yellow
Write-Host "  - Open Windows Camera app once (proves camera hardware works)" -ForegroundColor White
Write-Host "  - Disable antivirus temporarily" -ForegroundColor White
Write-Host "  - Check Device Manager: if camera has yellow !, driver broken" -ForegroundColor White
Write-Host ""

Read-Host "Press Enter to exit"
