@echo off
title Quick Design File Organizer
color 0A

echo.
echo ========================================
echo   🚀 QUICK DESIGN FILE ORGANIZER 🚀
echo ========================================
echo.
echo DRAG AND DROP YOUR FOLDER HERE!
echo.
echo Instructions:
echo 1. Drag your design folder into this window
echo 2. Press Enter
echo 3. Wait for organization to complete
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

set /p folder_path="Drop your folder here and press Enter: "

REM Remove quotes if present
set folder_path=%folder_path:"=%

REM Check if folder path is provided
if "%folder_path%"=="" (
    echo ❌ No folder provided
    echo.
    pause
    exit /b 1
)

REM Check if folder exists
if not exist "%folder_path%" (
    echo ❌ Folder not found: %folder_path%
    echo.
    pause
    exit /b 1
)

echo.
echo 🚀 Organizing files in: %folder_path%
echo.

REM Run the organizer
node organize.js "%folder_path%"

echo.
echo ✅ Done! Check the 'organized_files' folder in your original directory.
echo.
echo Press any key to exit...
pause >nul
