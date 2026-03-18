# このフォルダで pnpm をやめて npm で入れ直す（Vite の chunk 解決エラーを避ける）
$dir = $PSScriptRoot
Set-Location $dir

Write-Host "This will remove node_modules and pnpm-lock.yaml, then use npm."
Write-Host "Close any running 'npm run dev' or Cursor terminal using this project first."
Write-Host "Press Enter to continue, or Ctrl+C to cancel."
Read-Host

if (Test-Path "node_modules") {
    Write-Host "Removing node_modules..."
    Remove-Item -Recurse -Force "node_modules" -ErrorAction SilentlyContinue
    if (Test-Path "node_modules") {
        Write-Host "ERROR: Could not delete node_modules. Close all programs using it and run again."
        exit 1
    }
}
if (Test-Path "pnpm-lock.yaml") { Remove-Item -Force "pnpm-lock.yaml" }
if (Test-Path "node_modules/.vite") { Remove-Item -Recurse -Force "node_modules/.vite" }

Write-Host "Running npm install..."
npm install
if ($LASTEXITCODE -ne 0) { Write-Host "npm install failed."; exit 1 }

Write-Host ""
Write-Host "Done. Run dev server with:  npm run dev"
Write-Host "Then open: http://localhost:5173"
Write-Host ""
