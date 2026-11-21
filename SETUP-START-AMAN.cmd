@echo off
setlocal
cd /d "%~dp0"
if not exist "%~dp0program\runtime\node.exe" goto extract
if not exist "%~dp0program\amanapp\server.js" goto extract
if not exist "%~dp0program\aman.ps1" goto extract
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0program\aman.ps1"
set "AMAN_EXIT=%ERRORLEVEL%"
if not "%AMAN_EXIT%"=="0" pause
exit /b %AMAN_EXIT%
:extract
echo Extract the ENTIRE ZIP to a folder first. Do not run it inside WinRAR.
pause
exit /b 1
