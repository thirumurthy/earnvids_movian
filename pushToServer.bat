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

REM Print the constructed FTP URL for debugging
echo ftp://%FTP_USER%:%FTP_PASS%@%FTP_HOST%%REMOTE_DIR%/%ZIP_FILE%

REM Upload ZIP file to FTP server
echo Uploading %ZIP_FILE% to FTP server...
curl -T %ZIP_FILE% --ftp-create-dirs ftp://%FTP_USER%:%FTP_PASS%@%FTP_HOST%%REMOTE_DIR%/%ZIP_FILE%

REM Delete ZIP file after upload
IF %ERRORLEVEL% EQU 0 (
    echo Upload successful. Deleting local %ZIP_FILE%...
    DEL /F /Q %ZIP_FILE%
) ELSE (
    echo Upload failed. Keeping the local %ZIP_FILE% for investigation.
)
