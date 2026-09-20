Write-Host ""
Write-Host "=== Searching for any 30% / commission language across the site ===" -ForegroundColor Cyan
Get-ChildItem -Recurse -Include *.ts,*.tsx,*.html -Path "src","public" -ErrorAction SilentlyContinue |
  Select-String -Pattern "30\s*%|30 percent" |
  ForEach-Object { Write-Host "$($_.Path):$($_.LineNumber)  $($_.Line.Trim())" }

Write-Host ""
Write-Host "=== Searching for other payout/commission wording worth double-checking ===" -ForegroundColor Cyan
Get-ChildItem -Recurse -Include *.ts,*.tsx,*.html -Path "src","public" -ErrorAction SilentlyContinue |
  Select-String -Pattern "commission|per sale|weekly payout|Friday" |
  ForEach-Object { Write-Host "$($_.Path):$($_.LineNumber)  $($_.Line.Trim())" }
