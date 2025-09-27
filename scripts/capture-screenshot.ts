import { _electron as electron } from '@playwright/test';
import path from 'path';
import fs from 'fs';

/**
 * Captures a screenshot of the App Shell for documentation purposes
 */
async function captureScreenshot() {
  console.log('📸 Starting screenshot capture...');

  try {
    // Ensure screenshots directory exists
    const screenshotsDir = path.resolve(__dirname, '../screenshots');
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
    }

    // Launch Electron app
    console.log('🚀 Launching App Shell...');
    const electronApp = await electron.launch({
      args: [path.resolve(__dirname, '../dist/main/main.js')],
      env: {
        ...process.env,
        NODE_ENV: 'production'
      }
    });

    // Get the first window
    const window = await electronApp.firstWindow();
    console.log('🖥️  App window opened');

    // Ensure DevTools are closed for clean screenshots
    try {
      await window.evaluate(() => {
        if ((window as any).electronAPI?.closeDevTools) {
          (window as any).electronAPI.closeDevTools();
        }
      });
    } catch (error) {
      console.log('⚠️ Could not close DevTools via API, trying direct method');
    }

    // Wait for app to fully load
    console.log('⏳ Waiting for app to fully load...');
    await window.waitForLoadState('networkidle');
    
    // Wait for the welcome message to appear
    await window.waitForSelector('h2:has-text("Welcome to App Shell")', { timeout: 10000 });
    
    // Wait a bit more for any animations or async loading
    await window.waitForTimeout(2000);

    // Set a good window size for the screenshot
    await window.setViewportSize({ width: 1200, height: 800 });
    
    // Take screenshot of the full window
    const screenshotPath = path.join(screenshotsDir, 'app-shell-main.png');
    console.log(`📸 Capturing screenshot to: ${screenshotPath}`);
    
    await window.screenshot({
      path: screenshotPath,
      fullPage: false // Capture just the viewport
    });

    // Also capture a dark theme focused screenshot
    const darkScreenshotPath = path.join(screenshotsDir, 'app-shell-dark-theme.png');
    console.log(`📸 Capturing dark theme screenshot to: ${darkScreenshotPath}`);
    
    await window.screenshot({
      path: darkScreenshotPath,
      fullPage: false
    });

    // Capture a screenshot showing the terminal
    console.log('📸 Capturing terminal screenshot...');
    
    // Click on the terminal area to ensure it's visible
    await window.locator('#terminal').click();
    await window.waitForTimeout(500);
    
    const terminalScreenshotPath = path.join(screenshotsDir, 'app-shell-terminal.png');
    await window.screenshot({
      path: terminalScreenshotPath,
      fullPage: false
    });

    // Try to capture command palette if possible
    try {
      console.log('📸 Attempting to capture command palette...');
      
      // Open command palette
      await window.keyboard.press('Meta+Shift+KeyP');
      await window.waitForTimeout(1000); // Wait for palette to open and commands to load
      
      const paletteScreenshotPath = path.join(screenshotsDir, 'app-shell-command-palette.png');
      await window.screenshot({
        path: paletteScreenshotPath,
        fullPage: false
      });
      console.log('✅ Command palette screenshot captured');
    } catch (error) {
      console.log('⚠️ Could not capture command palette screenshot:', error);
    }

    // Close the app
    await electronApp.close();
    console.log('✅ Screenshots captured successfully!');
    console.log(`📁 Screenshots saved to: ${screenshotsDir}`);
    
    return {
      main: screenshotPath,
      darkTheme: darkScreenshotPath,
      terminal: terminalScreenshotPath
    };

  } catch (error) {
    console.error('❌ Failed to capture screenshot:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  captureScreenshot().then(() => {
    console.log('🎉 Screenshot capture completed!');
    process.exit(0);
  }).catch(error => {
    console.error('💥 Screenshot capture failed:', error);
    process.exit(1);
  });
}

export { captureScreenshot };