# node_modules とロックを削除してから pnpm install（@vitejs/plugin-react を react-swc に差し替え）
Set-Location $PSScriptRoot
if (Test-Path node_modules) {
    Write-Host "Removing node_modules..."
    Remove-Item -Recurse -Force node_modules
}
if (Test-Path pnpm-lock.yaml) {
    Write-Host "Removing pnpm-lock.yaml..."
    Remove-Item -Force pnpm-lock.yaml
}
Write-Host "Running pnpm install..."
pnpm install
Write-Host "Done. Run: pnpm dev"
