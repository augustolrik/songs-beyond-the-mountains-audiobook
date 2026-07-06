@echo off
setlocal
title Codex automatic resume

set "SCRIPT=%~dp0codex_auto_resume.ps1"

if not exist "%SCRIPT%" (
    echo Could not find:
    echo %SCRIPT%
    pause
    exit /b 1
)

echo.
echo 1. Resume the most recent Codex task in a project folder
echo 2. Start a new Codex task and automatically resume it after a usage limit
echo.
set /p MODECHOICE=Choose 1 or 2: 

if "%MODECHOICE%"=="2" (
    powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%SCRIPT%" -Mode new
) else (
    powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%SCRIPT%" -Mode resume
)

endlocal
