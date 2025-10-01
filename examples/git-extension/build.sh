#!/bin/bash

# Build script for Git Extension

echo "Building Git Extension..."

# Clean previous build
echo "Cleaning previous build..."
npm run clean

# Install dependencies
echo "Installing dependencies..."
npm install

# Build TypeScript
echo "Compiling TypeScript..."
npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Git Extension built successfully!"
    echo "Output directory: ./dist/"
    echo "Main file: ./dist/extension.js"
else
    echo "❌ Build failed!"
    exit 1
fi

echo "Build complete."