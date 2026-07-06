@echo off
title Generer dansk lydbog
cd /d "%~dp0"
echo.
echo Genererer 18 kapitler med Microsoft Christel Neural.
echo Det kan tage et stykke tid. Behold vinduet aabent.
echo.
python build_danish_audio.py
if errorlevel 1 (
  echo.
  echo Genereringen mislykkedes. Kontroller internetforbindelsen og proev igen.
  pause
  exit /b 1
)
echo.
echo Faerdig. Luk og genaabn offline-afspilleren.
pause
