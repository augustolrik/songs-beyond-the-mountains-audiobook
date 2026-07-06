@echo off
title Songs Beyond the Mountains Audiobook
cd /d "%~dp0"
echo.
echo Songs Beyond the Mountains audiobook server
echo =============================================
echo.
echo On your phone, connect to the same Wi-Fi as this computer.
echo Find this computer's IPv4 address below, then open:
echo.
echo     http://YOUR-IP-ADDRESS:8765
echo.
ipconfig | findstr /i "IPv4"
echo.
echo Keep this window open while listening.
echo Press Ctrl+C to stop the server.
echo.
python -m http.server 8765 --bind 0.0.0.0
pause
