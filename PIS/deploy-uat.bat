@echo off
REM PIS Cloudflare Deployment Script for Windows
REM Run this script to deploy PIS to Cloudflare UAT

echo ==========================================
echo PIS UAT Deployment Script
echo ==========================================
echo.

REM Check if Node.js is installed
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo [1/6] Node.js detected: 
node --version
echo.

REM Set working directory
cd /d "%~dp0"
echo [2/6] Working directory: %cd%
echo.

REM Install dependencies
echo [3/6] Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: npm install failed!
    pause
    exit /b 1
)
echo Dependencies installed successfully.
echo.

REM Install Wrangler globally if not present
echo [4/6] Installing Wrangler CLI...
call npm install -g wrangler
if %errorlevel% neq 0 (
    echo WARNING: Could not install wrangler globally.
    echo Trying with npx...
)
echo.

REM Deploy API Worker
echo [5/6] Deploying API to Cloudflare Workers (UAT)...
call npx wrangler deploy --env uat --config wrangler.toml
if %errorlevel% neq 0 (
    echo ERROR: Worker deployment failed!
    pause
    exit /b 1
)
echo API deployed successfully!
echo.

REM Deploy Frontend
echo [6/6] Building and deploying Frontend...
cd src\frontend
call npm install
call npm run build
call npx wrangler pages deploy dist --project-name=pis-project-uat
if %errorlevel% neq 0 (
    echo WARNING: Pages deployment may need to be done manually.
    echo Run: cd src\frontend ^&^& npm run build ^&^& npx wrangler pages deploy dist
)
cd ..\..
echo.

echo ==========================================
echo Deployment Complete!
echo ==========================================
echo.
echo Your PIS UAT environment should now be live at:
echo   API: https://pis-project-uat.YOUR_SUBDOMAIN.workers.dev
echo   Frontend: https://pis-project-uat.pages.dev
echo.
echo To verify, visit: https://pis-project-uat.pages.dev
echo.
pause
