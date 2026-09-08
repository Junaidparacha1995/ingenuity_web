@echo off
cd /d "%~dp0"
echo.
echo =============================================
echo   Ingenuity Systems - Production Preview
echo =============================================
echo.
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js 22 or newer is required.
  echo Install Node.js, reopen VS Code, then run this file again.
  pause
  exit /b 1
)
for /f "tokens=*" %%v in ('node -p "process.versions.node.split('.')[0]"') do set NODEMAJOR=%%v
if %NODEMAJOR% LSS 22 (
  echo Node.js 22 or newer is required. Current major version: %NODEMAJOR%
  pause
  exit /b 1
)
if not exist .env copy .env.example .env >nul
if not exist node_modules (
  echo Installing dependencies...
  call npm install
  if errorlevel 1 exit /b 1
)
echo Opening http://localhost:3000
start "" http://localhost:3000
call npm start
