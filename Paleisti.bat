@echo off
title InfoQuiz v2.0 Serveris
chcp 65001 > nul
echo ===================================================
echo   Paleidžiama InfoQuiz v2.0 aplikacija...
echo   Naršyklė su testais atsidarys automatiškai.
echo ===================================================
echo.
echo DĖMESIO: Neuždarykite šio konsolės lango, kol naudojatės programa!
echo.
timeout /t 1 /nobreak > nul
start "" http://localhost:8000
"%~dp0python\python.exe" -m http.server 8000 -d "%~dp0"
