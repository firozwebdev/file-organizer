@echo off
title Drag Multiple Folders Organizer
color 0E

echo.
echo ========================================
echo   🎨 DRAG MULTIPLE FOLDERS HERE 🎨
echo ========================================
echo.
echo This batch file accepts dragged folders as arguments!
echo.
echo Instructions:
echo 1. Select multiple folders in Windows Explorer (Ctrl+Click)
echo 2. Drag ALL selected folders onto THIS .bat file
echo 3. The organizer will start automatically
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

REM Check if any arguments were passed (folders dragged onto the bat file)
if "%~1"=="" (
    echo ❌ No folders were dragged onto this file
    echo.
    echo How to use:
    echo 1. Select multiple folders in Windows Explorer
    echo 2. Drag them onto this .bat file (not into the window)
    echo 3. The organizer will start automatically
    echo.
    echo Alternative: Use "Organize Multiple Folders.bat" for manual input
    echo.
    pause
    exit /b 1
)

echo 📂 Detected folders:
set count=0
:loop
if "%~1"=="" goto endloop
set /a count+=1
echo   %count%. %~1
shift
goto loop
:endloop

echo.
echo 🚀 Starting organization...
echo 📤 Output: organized_files folder in current directory
echo.

REM Run the organizer with all arguments
node organize.js %*

echo.
echo ✅ Done! Check the 'organized_files' folder in this directory.
echo.
echo 💡 All files from all folders are now organized by type:
echo   📁 jpg/  📁 png/  📁 eps/  📁 pdf/
echo   📁 ai/   📁 psd/  📁 svg/  📁 zip/
echo.
echo Press any key to exit...
pause >nul
