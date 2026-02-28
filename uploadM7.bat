@echo off
setlocal EnableExtensions EnableDelayedExpansion

echo.
echo ============================================
echo   R2 Backup + Upload Script Starting
echo ============================================
echo.

REM ==========================================================
REM VERIFY .env
REM ==========================================================

if not exist ".env" (
    echo ERROR: .env file not found.
    exit /b 1
)

REM ==========================================================
REM LOAD ENV VARIABLES
REM ==========================================================

for /f "usebackq tokens=* delims=" %%i in (".env") do (
    set "line=%%i"
    if not "!line!"=="" (
        if not "!line:~0,1!"=="#" (
            rem safely set the variable from KEY=VALUE line
            set "%%i"
        )
    )
)

if "%ZIP_FILE%"=="" (
    echo ERROR: ZIP_FILE missing in .env
    exit /b 1
)

set "ZIP_PATH=%CD%\%ZIP_FILE%"
set "UPLOAD_URL=https://tllprm.thirumurthy.workers.dev/m7file/upload"
set "MAX_RETRIES=3"

echo ZIP file:
echo %ZIP_PATH%
echo.

REM ==========================================================
REM DELETE OLD ZIP
REM ==========================================================

if exist "%ZIP_PATH%" (
    echo Removing old archive...
    del /f /q "%ZIP_PATH%"
)

REM ==========================================================
REM CREATE TEMP POWERSHELL SCRIPT
REM ==========================================================

set "PS_SCRIPT=%TEMP%\create_zip_%RANDOM%.ps1"

rem Write PowerShell script lines safely using single-line redirects to avoid parsing issues with parentheses/braces
echo $ErrorActionPreference = "Stop" > "%PS_SCRIPT%"
echo $dest = "%ZIP_PATH%" >> "%PS_SCRIPT%"
echo Write-Host "Creating archive..." >> "%PS_SCRIPT%"
echo $files = Get-ChildItem -Recurse -File ^| Where-Object { $_.Name -notin @('.env','.gitignore') } >> "%PS_SCRIPT%"
echo if($files.Count -eq 0){ throw "No files found to archive." } >> "%PS_SCRIPT%"
echo foreach($f in $files){ $f.LastWriteTime = Get-Date } >> "%PS_SCRIPT%"
echo Compress-Archive -Path $files.FullName -DestinationPath $dest -CompressionLevel Optimal -Force >> "%PS_SCRIPT%"
echo Write-Host "Archive created successfully." >> "%PS_SCRIPT%"

REM ==========================================================
REM RUN POWERSHELL SAFELY
REM ==========================================================

powershell -NoProfile -ExecutionPolicy Bypass -File "%PS_SCRIPT%"

if errorlevel 1 (
    echo ERROR: ZIP creation failed.
    del "%PS_SCRIPT%" >nul 2>&1
    exit /b 1
)

del "%PS_SCRIPT%" >nul 2>&1

if not exist "%ZIP_PATH%" (
    echo ERROR: ZIP not created.
    exit /b 1
)

echo.
echo Archive ready.
echo.

REM ==========================================================
REM UPLOAD WITH RETRY
REM ==========================================================

set RETRY_COUNT=0
set UPLOAD_SUCCESS=0

:UPLOAD_RETRY
set /a RETRY_COUNT+=1

echo Upload attempt !RETRY_COUNT! of %MAX_RETRIES%...

curl --silent --show-error --fail ^
  --location "%UPLOAD_URL%" ^
  --form "filename=%ZIP_FILE%" ^
  --form "file=@%ZIP_PATH%"

if %ERRORLEVEL% EQU 0 (
    set UPLOAD_SUCCESS=1
    goto UPLOAD_DONE
)

echo Upload failed.

if !RETRY_COUNT! GEQ %MAX_RETRIES% goto UPLOAD_DONE

echo Waiting 5 seconds before retry...
timeout /t 5 >nul
goto UPLOAD_RETRY

:UPLOAD_DONE
echo.

REM ==========================================================
REM CLEANUP
REM ==========================================================

if "%UPLOAD_SUCCESS%"=="1" (
    echo Upload successful.
    del /f /q "%ZIP_PATH%"
    echo Local archive removed.
    echo.
    echo ✅ Backup uploaded to R2.
    exit /b 0
)

echo ❌ Upload failed after retries.
echo Archive kept at:
echo %ZIP_PATH%
exit /b 1