@echo off
REM התקנה בלחיצה אחת — Photonics Workshop Site (Windows)
echo === Photonics Workshop Site - Setup ===

where node >nul 2>nul
if %errorlevel% neq 0 (
  echo Node.js is not installed.
  echo Please install it from https://nodejs.org and run this file again.
  pause
  exit /b 1
)

echo Installing dependencies...
call npm install

echo.
echo Setup complete! Starting the site at http://localhost:8080
call npm run dev
pause
