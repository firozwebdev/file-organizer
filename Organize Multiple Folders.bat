@echo off
title Multiple Folder Organizer
color 0C

echo.
echo ========================================
echo   🎨 MULTIPLE FOLDER ORGANIZER 🎨
echo ========================================
echo.
echo This tool organizes MULTIPLE folders at once!
echo All files will be organized into ONE central location.
echo.
echo Instructions:
echo 1. Select multiple folders in Windows Explorer
echo 2. Drag ALL selected folders into this window
echo 3. Press Enter
echo 4. Wait for organization to complete
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

echo DRAG MULTIPLE FOLDERS HERE:
echo 1. Select multiple folders in Windows Explorer (Ctrl+Click)
echo 2. Drag ALL selected folders into this window
echo 3. You should see the folder paths appear below
echo 4. Press Enter to continue
echo.

REM Show current directory for reference
echo Current directory: %CD%
echo.

set /p folder_paths="Folder paths will appear here: "

REM Show what was captured
echo.
echo Captured input: %folder_paths%
echo.

REM Check if folder paths are provided
if "%folder_paths%"=="" (
    echo ❌ No folders were detected
    echo.
    echo Troubleshooting:
    echo - Make sure you selected multiple folders first
    echo - Drag them all at once into this window
    echo - The paths should appear above
    echo.
    pause
    exit /b 1
)

echo 🚀 Organizing multiple folders...
echo 📤 Output: organized_files folder in current directory
echo.

REM Run the organizer with all provided paths
node organize.js %folder_paths%

echo.
echo ✅ Done! Check the 'organized_files' folder in this directory.
echo.
echo 💡 All files from all folders are now organized by type:
echo   📁 jpg/  📁 png/  📁 eps/  📁 pdf/
echo   📁 ai/   📁 psd/  📁 svg/  📁 zip/
echo.
echo Press any key to exit...
pause >nul
