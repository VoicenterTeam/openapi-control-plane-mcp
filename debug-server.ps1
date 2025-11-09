Write-Host "Killing old processes..." -ForegroundColor Yellow
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 1

Write-Host "Running server with full debug output..." -ForegroundColor Green
Write-Host ""

$env:NODE_ENV = "development"
node dist/server.js 2>&1 | Tee-Object -FilePath "server-debug.log"

