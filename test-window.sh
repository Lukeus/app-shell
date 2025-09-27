#!/bin/bash

echo "🔍 Testing App Shell Window Creation"
echo "====================================="

# Build and run the app in background
echo "Building app..."
pnpm build > /dev/null 2>&1

echo "Starting app in background..."
NODE_ENV=production npx electron ./dist/main/main.js > app.log 2>&1 &
APP_PID=$!

echo "App started with PID: $APP_PID"

# Give it time to start
sleep 5

echo "Checking if Electron process is running..."
if ps -p $APP_PID > /dev/null 2>&1; then
    echo "✅ Electron process is running (PID: $APP_PID)"
    
    # Check for any Electron windows
    echo "Checking for Electron windows..."
    if pgrep -f "Electron.app" > /dev/null 2>&1; then
        echo "✅ Electron.app processes found"
    else
        echo "❌ No Electron.app processes found"
    fi
    
    # Show the log output
    echo ""
    echo "App log output:"
    echo "==============="
    cat app.log
    
    # Kill the app
    echo ""
    echo "Stopping app..."
    kill $APP_PID 2>/dev/null
    sleep 2
    
    # Force kill if still running  
    if ps -p $APP_PID > /dev/null 2>&1; then
        kill -9 $APP_PID 2>/dev/null
    fi
    
else
    echo "❌ Electron process not found"
    echo "App log output:"
    echo "==============="
    cat app.log
fi

echo "Done."
rm -f app.log