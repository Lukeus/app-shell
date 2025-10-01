#!/bin/bash

# Cyberpunk Theme Extension Build Script
# Creates a distributable package of the extension

echo "🚀 Building Cyberpunk Theme Extension..."

# Create build directory
BUILD_DIR="dist"
PACKAGE_NAME="cyberpunk-theme-extension"

# Clean previous build
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR"

# Copy extension files
echo "📦 Copying extension files..."
cp package.json "$BUILD_DIR/"
cp README.md "$BUILD_DIR/"
cp CHANGELOG.md "$BUILD_DIR/"
cp tsconfig.json "$BUILD_DIR/"

# Copy source files
cp -r src "$BUILD_DIR/"
cp -r themes "$BUILD_DIR/"

# Create zip package
echo "🗜️ Creating package..."
cd "$BUILD_DIR"
zip -r "../${PACKAGE_NAME}.zip" . -x "*.DS_Store" "*/.git/*"
cd ..

# Create tarball as alternative
tar -czf "${PACKAGE_NAME}.tar.gz" -C "$BUILD_DIR" .

echo "✅ Build complete!"
echo "📦 Package created: ${PACKAGE_NAME}.zip"
echo "📦 Tarball created: ${PACKAGE_NAME}.tar.gz"
echo ""
echo "🎯 Installation instructions:"
echo "1. Open App Shell"
echo "2. Go to Extensions view"
echo "3. Click 'Browse for Extension File'"
echo "4. Select ${PACKAGE_NAME}.zip"
echo "5. Enjoy your cyberpunk themes! 🎨"