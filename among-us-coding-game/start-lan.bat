@echo off
echo ========================================
echo Among Us Coding Game - LAN Setup
echo ========================================

echo.
echo Finding your local IP address...
node get-ip.js

echo.
echo Starting backend server...
start "Backend Server" cmd /k "npm run dev:lan"

timeout /t 5 /nobreak >nul

echo.
echo Starting frontend server...
cd frontend
start "Frontend Server" cmd /k "npm run dev:lan"

echo.
echo Setup complete! Check the IP address above to access the game from other devices.
echo Make sure to create a .env file in the root directory with:
echo HOST=0.0.0.0
echo.
echo Press any key to exit...
pause >nul