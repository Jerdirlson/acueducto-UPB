# Script PowerShell para iniciar el sistema
# Configuración de política de ejecución y PATH

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Acueducto Rural - Sistema de Gestion" -ForegroundColor Cyan
Write-Host "  Universidad Pontificia Bolivariana" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Configurar política de ejecución para esta sesión
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process -Force | Out-Null

# Agregar Node.js al PATH si no está
if (-not ($env:Path -like "*nodejs*")) {
    $env:Path += ";C:\Program Files\nodejs"
}

Write-Host "[1/2] Iniciando servidor backend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend'; npm run dev" -WindowStyle Normal

Start-Sleep -Seconds 3

Write-Host "[2/2] Iniciando frontend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\frontend'; npm run dev" -WindowStyle Normal

Start-Sleep -Seconds 3

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Sistema iniciado correctamente!" -ForegroundColor Green
Write-Host "  Backend: http://localhost:3000" -ForegroundColor Green
Write-Host "  Frontend: http://localhost:5173" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Presiona cualquier tecla para cerrar esta ventana..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

