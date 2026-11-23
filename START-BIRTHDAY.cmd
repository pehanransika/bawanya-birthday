@echo off
cd /d "%~dp0"
if exist "dist\OPEN-BIRTHDAY.html" (
  start "" "%~dp0dist\OPEN-BIRTHDAY.html"
) else (
  echo Opening Bawanya's birthday website...
  echo Keep this window open while viewing. Press Ctrl+C to stop.
  call npm.cmd run dev -- --open
  if errorlevel 1 pause
)
