@echo off
title Starting EduPrep AI Capstone Project...
echo ========================================================
echo               EduPrep AI - Starting Server              
echo ========================================================
echo.

:: Add Node.js runtime to PATH
set "PATH=%LOCALAPPDATA%\OpenAI\Codex\runtimes\cua_node\03b1cdac8af3a530\bin;%PATH%"

cd /d "C:\EDUPREP AI"

echo [1/2] Launching Next.js server on http://localhost:3000 ...
echo [2/2] Opening browser in 5 seconds...
echo.

start "" "http://localhost:3000"

npm run dev

pause
