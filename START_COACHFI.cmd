@echo off
setlocal
cd /d "%~dp0"

call npm.cmd run dev

if errorlevel 1 (
  echo.
  echo Nie udalo sie uruchomic Coach FI. Uruchom najpierw: npm install
  pause
)
