Write-Host ""
Write-Host "=== Checking for the seller-applications admin page ===" -ForegroundColor Cyan
Test-Path "src\app\admin\seller-applications\page.tsx"

Write-Host ""
Write-Host "=== Checking if the folder exists at all (even without a page.tsx) ===" -ForegroundColor Cyan
Test-Path "src\app\admin\seller-applications"

Write-Host ""
Write-Host "=== Checking for any backing API route ===" -ForegroundColor Cyan
Test-Path "src\app\api\admin\seller-applications"
Get-ChildItem -Recurse -Path "src\app\api\admin" -Filter "route.ts" -ErrorAction SilentlyContinue |
  Where-Object { $_.FullName -like "*seller*" } |
  ForEach-Object { Write-Host "Found: $($_.FullName)" -ForegroundColor Green }
