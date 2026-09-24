@echo off
chcp 65001 >nul
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo  [!] Node.js is not installed.
  echo      Install: winget install OpenJS.NodeJS.LTS
  echo      or download LTS from https://nodejs.org
  echo.
  pause
  exit /b 1
)
node tools\dev-server.js --open
pause
