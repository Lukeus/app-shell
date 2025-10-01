@echo off
REM Cyberpunk Theme Extension Build Script for Windows
REM Creates a distributable package of the extension

echo 🚀 Building Cyberpunk Theme Extension...

SET BUILD_DIR=dist
SET PACKAGE_NAME=cyberpunk-theme-extension

REM Clean previous build
if exist "%BUILD_DIR%" rmdir /s /q "%BUILD_DIR%"
mkdir "%BUILD_DIR%"

REM Copy extension files
echo 📦 Copying extension files...
copy package.json "%BUILD_DIR%\"
copy README.md "%BUILD_DIR%\"
copy CHANGELOG.md "%BUILD_DIR%\"
copy tsconfig.json "%BUILD_DIR%\"

REM Copy directories
xcopy /e /i src "%BUILD_DIR%\src"
xcopy /e /i themes "%BUILD_DIR%\themes"

REM Create zip package (requires PowerShell)
echo 🗜️ Creating package...
powershell -command "Compress-Archive -Path '%BUILD_DIR%\*' -DestinationPath '%PACKAGE_NAME%.zip' -Force"

echo ✅ Build complete!
echo 📦 Package created: %PACKAGE_NAME%.zip
echo.
echo 🎯 Installation instructions:
echo 1. Open App Shell
echo 2. Go to Extensions view
echo 3. Click 'Browse for Extension File'
echo 4. Select %PACKAGE_NAME%.zip
echo 5. Enjoy your cyberpunk themes! 🎨

pause