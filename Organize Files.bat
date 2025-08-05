@echo off
title Design File Organizer
color 0B

echo.
echo ========================================
echo    🎨 DESIGN FILE ORGANIZER 🎨
echo ========================================
echo.
echo This tool will organize your design files into folders:
echo   📁 jpg/  📁 png/  📁 eps/  📁 pdf/
echo   📁 ai/   📁 psd/  📁 svg/  📁 zip/
echo.
echo It also extracts ZIP and RAR files automatically!
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org
    echo.
    pause
    exit /b 1
)

echo ✅ Node.js found
echo.

echo You can:
echo 1. Just press Enter for interactive mode
echo 2. Drag and drop ONE folder here
echo 3. Type folder paths separated by spaces
echo.

set /p user_input="Enter folder path(s) or press Enter for interactive: "

if "%user_input%"=="" (
    echo.
    echo Starting interactive mode...
    node organize.js
) else (
    echo.
    echo Processing folders...
    REM Use the input directly - organize.js will handle multiple paths
    node organize.js %user_input%
)

echo.
echo Press any key to exit...
pause >nul
