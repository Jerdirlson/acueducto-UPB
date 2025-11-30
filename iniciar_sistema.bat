@echo off
echo ========================================
echo   Acueducto Rural - Sistema de Gestion
echo   Universidad Pontificia Bolivariana
echo ========================================
echo.

echo [1/2] Iniciando servidor backend...
cd backend
start "Backend Server" cmd /k "npm.cmd run dev"
timeout /t 3 /nobreak >nul

echo [2/2] Iniciando frontend...
cd ../frontend
start "Frontend Dev" cmd /k "npm.cmd run dev"
timeout /t 3 /nobreak >nul

echo.
echo ========================================
echo   Sistema iniciado correctamente!
echo   Backend: http://localhost:3000
echo   Frontend: http://localhost:5173
echo ========================================
echo.
echo Presiona cualquier tecla para cerrar esta ventana...
pause >nul

