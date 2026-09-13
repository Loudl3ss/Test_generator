@echo off
title InfoQuiz v2.0 Serveris
chcp 65001 > nul
setlocal enabledelayedexpansion

echo ===================================================
echo   Paleidžiama InfoQuiz v2.0 aplikacija...
echo   Naršyklė su testais atsidarys automatiškai.
echo ===================================================
echo.
echo DĖMESIO: Neuždarykite šio konsolės lango, kol naudojatės programa!
echo.

cd /d "%~dp0"

:: 1. Tikriname, ar yra lokalus Python pakatalogis (pvz. išskleistas python-embed)
if exist "%~dp0python\python.exe" (
    echo [1/3] Rastas lokalus Python. Paleidžiamas serveris...
    timeout /t 1 /nobreak >nul 2>nul || ping 127.0.0.1 -n 2 >nul
    start "" http://localhost:8000
    "%~dp0python\python.exe" -m http.server 8000 -d "%~dp0"
    goto :done
)

:: 2. Tikriname, ar sistemoje įdiegtas Python (py arba python)
where py >nul 2>nul
if !errorlevel! equ 0 (
    py -3 -c "import http.server" >nul 2>nul
    if !errorlevel! equ 0 (
        echo [2/3] Rastas sistemos Python (py). Paleidžiamas serveris...
        timeout /t 1 /nobreak >nul 2>nul || ping 127.0.0.1 -n 2 >nul
        start "" http://localhost:8000
        py -3 -m http.server 8000 -d "%~dp0"
        goto :done
    )
)

where python >nul 2>nul
if !errorlevel! equ 0 (
    python -c "import http.server" >nul 2>nul
    if !errorlevel! equ 0 (
        echo [2/3] Rastas sistemos Python. Paleidžiamas serveris...
        timeout /t 1 /nobreak >nul 2>nul || ping 127.0.0.1 -n 2 >nul
        start "" http://localhost:8000
        python -m http.server 8000 -d "%~dp0"
        goto :done
    )
)

:: 3. Atsarginis sprendimas: Windows integruotas PowerShell (veikia 100%% Windows 10/11 kompiuterių)
where powershell >nul 2>nul
if !errorlevel! equ 0 (
    echo [3/3] Python nerastas. Paleidžiama per Windows PowerShell...
    powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0server.ps1"
    goto :done
)

:: Jei nepavyko rasti jokio metodo
echo.
echo ===================================================
echo   [KLAIDA] Nepavyko paleisti vietinio serverio!
echo ===================================================
echo   Jūsų kompiuteryje nerastas nei Python, nei PowerShell.
echo   Norėdami naudotis programa, įsidiekite Python:
echo   https://www.python.org/downloads/
echo ===================================================
echo.
pause

:done
