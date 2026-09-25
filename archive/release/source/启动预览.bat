@echo off
chcp 936 >nul
title 中国工业博物馆数字展馆 - 本地预览

echo.
echo  ============================================
echo   中国工业博物馆数字展馆  ·  本地预览
echo  ============================================
echo.

cd /d "%~dp0"

REM ---- 检查 Node.js ----
where node >nul 2>nul
if errorlevel 1 (
    echo  [错误] 没有找到 Node.js
    echo.
    echo  请先安装：
    echo    1. 打开  https://nodejs.org
    echo    2. 下载 LTS 版本并一路安装
    echo    3. 安装完成后，重开这个窗口再试
    echo.
    pause
    exit /b 1
)

echo  [1/3] 检查运行环境 ... OK

REM ---- 检查依赖 ----
if not exist "node_modules" (
    echo  [2/3] 首次运行，正在安装依赖，约需 1 分钟 ...
    echo.
    call npm install --no-audit --no-fund
    if errorlevel 1 (
        echo.
        echo  [错误] 依赖安装失败，请检查网络后重试
        pause
        exit /b 1
    )
) else (
    echo  [2/3] 依赖已就绪 ... OK
)

REM ---- 构建 ----
echo  [3/3] 正在构建 ...
call npm run build
if errorlevel 1 (
    echo.
    echo  [错误] 构建失败，请把上面的报错发给设计方
    pause
    exit /b 1
)

echo.
echo  ============================================
echo   启动成功，浏览器即将自动打开
echo.
echo   首页：  http://localhost:4173/
echo   展厅：  http://localhost:4173/#/hall
echo.
echo   关闭预览：在此窗口按 Ctrl + C ，再按 Y
echo  ============================================
echo.

start "" http://localhost:4173/
call npm run preview

pause
