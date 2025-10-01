@echo off
REM Build script for Git Extension (Windows)

echo Building Git Extension...

REM Clean previous build
echo Cleaning previous build...
call npm run clean

REM Install dependencies
echo Installing dependencies...
call npm install

REM Build TypeScript
echo Compiling TypeScript...
call npm run build

REM Check if build was successful
if %errorlevel% equ 0 (
    echo ✅ Git Extension built successfully!
    echo Output directory: .\dist\
    echo Main file: .\dist\extension.js
) else (
    echo ❌ Build failed!
    exit /b 1
)

echo Build complete.
pause