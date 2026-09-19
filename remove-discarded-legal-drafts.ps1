# Removes the three discarded legal-page drafts (superseded by the existing
# comprehensive /terms and /privacy pages found later). Safe to run even if
# these were never actually placed in your repo — Test-Path checks first.

$paths = @(
  "src\app\terms-of-service",
  "src\app\privacy-policy",
  "src\app\refund-policy"
)

foreach ($p in $paths) {
  if (Test-Path -LiteralPath $p) {
    Remove-Item -LiteralPath $p -Recurse -Force
    Write-Host "Removed: $p" -ForegroundColor Green
  } else {
    Write-Host "Not found (already clean): $p" -ForegroundColor Yellow
  }
}
