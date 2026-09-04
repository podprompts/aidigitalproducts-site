# find-cdn-issue.ps1
# Run this from the ROOT of your AIDigitalProducts.com repo in VS Code's terminal (PowerShell).
# It hunts for anything referencing a CDN URL, and the components that render product images.

Write-Host "`n=== 1. .env files (CDN / R2 / IMAGE vars only) ===" -ForegroundColor Cyan
Get-ChildItem -Path . -Filter ".env*" -Force -File -Recurse -ErrorAction SilentlyContinue |
    Where-Object { $_.FullName -notmatch "node_modules" } |
    ForEach-Object {
        Write-Host "`n--- $($_.FullName) ---" -ForegroundColor Yellow
        Select-String -Path $_.FullName -Pattern "CDN|R2|IMAGE|BUCKET|STORAGE" -CaseSensitive:$false
    }

Write-Host "`n=== 2. Any hardcoded reference to vintagegaragesale ===" -ForegroundColor Cyan
Get-ChildItem -Path . -Recurse -Include *.ts,*.tsx,*.js,*.jsx,*.env*,*.json `
    -ErrorAction SilentlyContinue |
    Where-Object { $_.FullName -notmatch "node_modules|\.next|\.git" } |
    Select-String -Pattern "vintagegaragesale" -CaseSensitive:$false |
    ForEach-Object { Write-Host "$($_.Path):$($_.LineNumber)  $($_.Line.Trim())" }

Write-Host "`n=== 3. Any generic 'cdn.' domain reference ===" -ForegroundColor Cyan
Get-ChildItem -Path . -Recurse -Include *.ts,*.tsx,*.js,*.jsx,*.env*,*.json `
    -ErrorAction SilentlyContinue |
    Where-Object { $_.FullName -notmatch "node_modules|\.next|\.git" } |
    Select-String -Pattern "cdn\.[a-z0-9\-]+\.com" -CaseSensitive:$false |
    ForEach-Object { Write-Host "$($_.Path):$($_.LineNumber)  $($_.Line.Trim())" }

Write-Host "`n=== 4. next.config.* image domains/remotePatterns ===" -ForegroundColor Cyan
Get-ChildItem -Path . -Filter "next.config.*" -Recurse -ErrorAction SilentlyContinue |
    Where-Object { $_.FullName -notmatch "node_modules" } |
    ForEach-Object {
        Write-Host "`n--- $($_.FullName) ---" -ForegroundColor Yellow
        Get-Content $_.FullName
    }

Write-Host "`n=== 5. Components/files likely rendering product images ===" -ForegroundColor Cyan
Get-ChildItem -Path . -Recurse -Include *.ts,*.tsx,*.js,*.jsx -ErrorAction SilentlyContinue |
    Where-Object { $_.FullName -notmatch "node_modules|\.next|\.git" } |
    Select-String -Pattern "<Image|<img|image_url|imageUrl|product.*image" -CaseSensitive:$false |
    Select-Object -First 40 |
    ForEach-Object { Write-Host "$($_.Path):$($_.LineNumber)  $($_.Line.Trim())" }

Write-Host "`n=== Done. Paste the output above back into chat. ===" -ForegroundColor Green
