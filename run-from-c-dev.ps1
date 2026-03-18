# Dropbox 外 (C:\dev) にコピーして npm で起動（パス・pnpm の不具合を避ける）
$dest = "C:\dev\PremiumRealEstate"
$src  = $PSScriptRoot

if (-not (Test-Path "C:\dev")) { New-Item -ItemType Directory -Path "C:\dev" | Out-Null }
if (Test-Path $dest) {
    Write-Host "Removing existing $dest..."
    Remove-Item -Recurse -Force $dest
}

Write-Host "Copying project to $dest (excluding node_modules, .git)..."
$exclude = @("node_modules", ".git", "run-from-c-dev.ps1", "reinstall.ps1")
Get-ChildItem -Path $src -Force | Where-Object { $exclude -notcontains $_.Name } | ForEach-Object {
    Copy-Item -Path $_.FullName -Destination $dest -Recurse -Force
}

# コピー先で pnpm のロックを削除し npm でインストール
Push-Location $dest
if (Test-Path "pnpm-lock.yaml") { Remove-Item -Force "pnpm-lock.yaml" }
if (Test-Path "node_modules") { Remove-Item -Recurse -Force "node_modules" }
Write-Host "Running npm install in $dest..."
npm install
if ($LASTEXITCODE -ne 0) { Pop-Location; exit 1 }
Write-Host ""
Write-Host "Done. Starting dev server..."
Write-Host "  URL: http://localhost:5173"
Write-Host "  To stop: Ctrl+C"
Write-Host ""
npm run dev
Pop-Location
