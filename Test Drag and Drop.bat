@echo off
title Test Drag and Drop
color 0F

echo.
echo ========================================
echo      🧪 TEST DRAG AND DROP 🧪
echo ========================================
echo.
echo This will help you test if drag and drop is working.
echo.

echo Method 1: Drag folders ONTO this .bat file
echo Arguments passed: %*
if not "%~1"=="" (
    echo ✅ SUCCESS! Folders were dragged onto the .bat file:
    set count=0
    :loop1
    if "%~1"=="" goto endloop1
    set /a count+=1
    echo   %count%. "%~1"
    shift
    goto loop1
    :endloop1
) else (
    echo ❌ No folders dragged onto the .bat file
)

echo.
echo Method 2: Drag folders INTO this window
set /p user_input="Drag folders here and press Enter: "

if not "%user_input%"=="" (
    echo ✅ SUCCESS! Input captured: %user_input%
) else (
    echo ❌ No input captured
)

echo.
echo 💡 Recommendations:
echo - Method 1 (drag ONTO .bat file) is more reliable
echo - Method 2 (drag INTO window) can be tricky
echo.
echo Press any key to exit...
pause >nul
