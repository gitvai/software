@echo off
echo Starting Sohar Dental Lab Server...
cd /d "%~dp0backend"
node server.js
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Server crashed with Exit Code: %ERRORLEVEL%
) else (
    echo.
    echo Server finished normally.
)
pause
