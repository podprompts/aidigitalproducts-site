# Checks this repo for any actual Resend usage - code references, the
# package dependency, and whether a key is set locally. Never prints a
# full key value, only a masked preview, so it's safe to run and share.

Write-Host ""
Write-Host "=== Code files referencing RESEND_API_KEY ===" -ForegroundColor Cyan
Get-ChildItem -Recurse -Include *.ts,*.tsx -Path "src" -ErrorAction SilentlyContinue |
  Select-String -Pattern "RESEND_API_KEY" |
  ForEach-Object { Write-Host "$($_.Path):$($_.LineNumber)  $($_.Line.Trim())" }

Write-Host ""
Write-Host "=== Code files importing the 'resend' package ===" -ForegroundColor Cyan
Get-ChildItem -Recurse -Include *.ts,*.tsx -Path "src" -ErrorAction SilentlyContinue |
  Select-String -Pattern 'from\s+["'']resend["'']|require\(["'']resend["'']\)' |
  ForEach-Object { Write-Host "$($_.Path):$($_.LineNumber)  $($_.Line.Trim())" }

Write-Host ""
Write-Host "=== Is 'resend' an installed dependency? ===" -ForegroundColor Cyan
if (Test-Path "package.json") {
  $pkg = Get-Content "package.json" -Raw | ConvertFrom-Json
  $inDeps = $pkg.dependencies.PSObject.Properties.Name -contains "resend"
  $inDevDeps = $pkg.devDependencies.PSObject.Properties.Name -contains "resend"
  if ($inDeps -or $inDevDeps) {
    $version = if ($inDeps) { $pkg.dependencies.resend } else { $pkg.devDependencies.resend }
    Write-Host "YES - resend@$version is listed in package.json" -ForegroundColor Green
  } else {
    Write-Host "NOT FOUND in package.json dependencies" -ForegroundColor Yellow
  }
}

Write-Host ""
Write-Host "=== Is RESEND_API_KEY set in your local .env.local? ===" -ForegroundColor Cyan
if (Test-Path ".env.local") {
  $line = Get-Content ".env.local" | Where-Object { $_ -match "^RESEND_API_KEY=" }
  if ($line) {
    $value = ($line -split "=", 2)[1].Trim('"', "'", " ")
    if ($value.Length -gt 10) {
      $masked = $value.Substring(0,6) + "..." + $value.Substring($value.Length-4)
    } else {
      $masked = "(set, but too short to mask safely - check manually)"
    }
    Write-Host "FOUND locally - value starts/ends: $masked" -ForegroundColor Green
  } else {
    Write-Host "NOT SET in .env.local" -ForegroundColor Yellow
  }
} else {
  Write-Host ".env.local not found in this folder" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== Reminder ===" -ForegroundColor Cyan
Write-Host "This only checks THIS repo, on THIS machine. It cannot see:" -ForegroundColor Gray
Write-Host "  - Vercel's actual Production environment variables (check Vercel's dashboard directly)"
Write-Host "  - Your other codebases (HSA, FAIR, etc.) that may also use Resend"
