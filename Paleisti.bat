@echo off
title InfoQuiz Serveris
chcp 65001 > nul
echo ===================================================
echo   Paleidžiama InfoQuiz aplikacija...
echo   Naršyklė su testais atsidarys automatiškai.
echo ===================================================
echo.
echo DĖMESIO: Neuždarykite šio konsolės lango, kol naudojatės programa!
echo.
timeout /t 1 /nobreak > nul
start "" http://localhost:8000
"%~dp0python\python.exe" -m http.server 8000 -d "%~dp0"
