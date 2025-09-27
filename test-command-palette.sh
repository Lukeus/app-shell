#!/bin/bash

echo "🚀 Testing App Shell Command Palette"
echo "======================================"

# Build the project
echo "📦 Building project..."
pnpm build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    
    # Start the app in the background
    echo "🎯 Starting App Shell..."
    echo ""
    echo "Instructions to test Command Palette:"
    echo "1. Press Cmd+Shift+P (macOS) or Ctrl+Shift+P (Windows/Linux)"
    echo "2. Try typing: 'quit', 'reload', 'theme', 'terminal', 'about'"
    echo "3. Navigate with arrow keys"
    echo "4. Press Enter to execute commands"
    echo "5. Press Escape to close"
    echo ""
    echo "Available commands include:"
    echo "- Application: quit, reload, about, toggle dev tools"
    echo "- Window: minimize, maximize, close, toggle fullscreen"
    echo "- Terminal: new, clear, kill all"
    echo "- View: command palette, extensions, settings"
    echo "- Theme: light, dark"
    echo "- File: open folder"
    echo ""
    echo "Starting app..."
    
    # Run the production version
    NODE_ENV=production npx electron ./dist/main/main.js
else
    echo "❌ Build failed. Please check the errors above."
    exit 1
fi