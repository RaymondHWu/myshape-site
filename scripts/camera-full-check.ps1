# Full Camera Diagnostic
# Run: Right-click → "Run with PowerShell"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Camera Diagnostic — Full Report" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. OS Info
$os = Get-CimInstance Win32_OperatingSystem
Write-Host "[1] OS: Windows $($os.Version) · Build $($os.BuildNumber)" -ForegroundColor White

# 2. Camera Hardware
Write-Host ""
Write-Host "[2] Camera Hardware:" -ForegroundColor Yellow
$cameras = Get-CimInstance Win32_PnPEntity | Where-Object { $_.PNPClass -eq "Camera" -or $_.Name -match "camera|webcam|cam" }
if ($cameras) {
    foreach ($cam in $cameras) {
        $status = if ($cam.Status -eq "OK") { "OK" } else { $cam.Status }
        Write-Host "  Found: $($cam.Name) — Status: $status" -ForegroundColor $(if ($status -eq "OK") { "Green" } else { "Red" })
    }
} else {
    Write-Host "  NO CAMERA DETECTED IN DEVICE MANAGER" -ForegroundColor Red
}

# 3. Registry — Global Camera Access
Write-Host ""
Write-Host "[3] Registry — Global Camera Access:" -ForegroundColor Yellow
$globalPath = "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\CapabilityAccessManager\ConsentStore\webcam"
if (Test-Path $globalPath) {
    $val = Get-ItemPropertyValue -Path $globalPath -Name "Value" -ErrorAction SilentlyContinue
    Write-Host "  Global toggle: $val" -ForegroundColor $(if ($val -eq "Allow") { "Green" } else { "Red" })
} else {
    Write-Host "  Key not found (unusual)" -ForegroundColor Red
}

# 4. Registry — Desktop App Access (this is what browsers need)
Write-Host ""
Write-Host "[4] Registry — Desktop App Access:" -ForegroundColor Yellow
$desktopPath = "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\CapabilityAccessManager\ConsentStore\webcam\NonPackaged"
if (Test-Path $desktopPath) {
    $val = Get-ItemPropertyValue -Path $desktopPath -Name "Value" -ErrorAction SilentlyContinue
    Write-Host "  Desktop apps toggle: $val" -ForegroundColor $(if ($val -eq "Allow") { "Green" } else { "Red" })
} else {
    Write-Host "  Key not found" -ForegroundColor Yellow
}

# 5. Check if any browser has individual blocking
Write-Host ""
Write-Host "[5] Browser-specific camera blocking:" -ForegroundColor Yellow
$browserKeys = @(
    "HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\CapabilityAccessManager\ConsentStore\webcam\NonPackaged\C:#Program Files#Google#Chrome#Application#chrome.exe",
    "HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\CapabilityAccessManager\ConsentStore\webcam\NonPackaged\C:#Program Files#Mozilla Firefox#firefox.exe",
    "HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\CapabilityAccessManager\ConsentStore\webcam\NonPackaged\C:#Program Files (x86)#Microsoft#Edge#Application#msedge.exe"
)
$found = $false
foreach ($key in $browserKeys) {
    if (Test-Path $key) {
        $val = Get-ItemPropertyValue -Path $key -Name "Value" -ErrorAction SilentlyContinue
        if ($val -ne "Allow") {
            Write-Host "  BLOCKED: $key — Value: $val" -ForegroundColor Red
            $found = $true
        }
    }
}
if (-not $found) {
    Write-Host "  No individual browser blocks found" -ForegroundColor Green
}

# 6. Antivirus
Write-Host ""
Write-Host "[6] Third-party antivirus:" -ForegroundColor Yellow
$av = Get-CimInstance -Namespace root/SecurityCenter2 -ClassName AntivirusProduct 2>$null
if ($av) {
    foreach ($a in $av) { Write-Host "  Found: $($a.displayName)" -ForegroundColor Yellow }
    Write-Host "  (Some AV software blocks browser camera access)" -ForegroundColor Yellow
} else {
    Write-Host "  None detected (Windows Defender only — should be fine)" -ForegroundColor Green
}

# 7. Try to open the camera via PowerShell (tests driver)
Write-Host ""
Write-Host "[7] Camera driver quick test:" -ForegroundColor Yellow
$cameraApp = Get-Command "microsoft.windows.camera:" -ErrorAction SilentlyContinue
if ($cameraApp) {
    Write-Host "  Windows Camera app is installed"
    Write-Host "  → Please open Camera app manually and check if it shows video" -ForegroundColor White
    Write-Host "  → If Camera app shows green/black screen, driver is broken" -ForegroundColor White
} else {
    Write-Host "  Windows Camera app not found" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  NEXT STEPS" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  1. Open Windows Camera app — does it show video?" -ForegroundColor White
Write-Host "  2. If Camera app works, go to: Settings > Privacy > Camera" -ForegroundColor White
Write-Host "     Turn OFF both toggles, restart PC, turn them ON" -ForegroundColor White
Write-Host "  3. If Camera app shows black/green: driver broken → reinstall" -ForegroundColor White
Write-Host "  4. Check for third-party AV — temporarily disable to test" -ForegroundColor White

Read-Host "`nPress Enter to exit"
