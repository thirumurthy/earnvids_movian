@echo off

REM Load environment variables from .env file
for /F "tokens=*" %%i in ('type .env') do (
    set %%i
)

REM Get current date and time for ZIP_FILE
set ZIP_FILE=%ZIP_FILE%

REM Delete existing ZIP file if it exists
IF EXIST %ZIP_FILE% (
    echo Deleting existing %ZIP_FILE%...
    DEL /F /Q %ZIP_FILE%
)

REM Compress files and folders, excluding .env and .gitignore
echo Creating %ZIP_FILE%, excluding .env and .gitignore...
powershell -Command "Get-ChildItem -Recurse | Where-Object { $_.Name -notin @('.env', '.gitignore') } | ForEach-Object { $_.LastWriteTime = [datetime]::Now; $_ } | Compress-Archive -DestinationPath '%ZIP_FILE%'"


REM Set source and destination paths
set "source=C:\Thiru\TV\movian\earnvids\earnvids.zip"
set "destination=C:\Users\91thi\Downloads\MEmu Download"

REM Ensure destination folder exists
if not exist "%destination%" (
    mkdir "%destination%"
)

REM Move and overwrite if exists
xcopy "%source%" "%destination%\" /Y
del "%source%"