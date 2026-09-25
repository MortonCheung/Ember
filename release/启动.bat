@echo off
setlocal
cd /d "%~dp0"
title Industrial Museum - Local Preview

echo.
echo  ============================================
echo   中国工业博物馆数字展馆 - 可运行版
echo  ============================================
echo.

REM ---- Node.js first: server.js opens the browser by itself ----
where node >nul 2>nul
if not errorlevel 1 (
    echo  Starting local server with Node.js ...
    echo.
    node server.js
    goto :end
)

REM ---- Fallback: Python built-in http server ----
where python >nul 2>nul
if not errorlevel 1 (
    echo  Node.js not found, using Python instead ...
    echo  Server: http://localhost:8080/
    echo  Stop: close this window or press Ctrl + C
    echo.
    start "" "http://localhost:8080/"
    python -m http.server 8080 --directory dist
    goto :end
)

echo  [ERROR] Neither Node.js nor Python was found on this computer.
echo.
echo  Please install Node.js (recommended):
echo    1. Open  https://nodejs.org
echo    2. Download the LTS version and install it
echo    3. Run this file again
echo.
pause
exit /b 1

:end
pause
