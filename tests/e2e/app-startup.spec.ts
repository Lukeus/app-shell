import { test, expect, _electron as electron } from '@playwright/test';
import { ElectronApplication, Page } from 'playwright';
import path from 'path';

let electronApp: ElectronApplication;
let window: Page;

test.describe('App Shell - Application Startup', () => {
  test.beforeAll(async () => {
    // Launch Electron app
    electronApp = await electron.launch({
      args: [path.resolve(__dirname, '../../dist/main/main.js')],
      env: {
        ...process.env,
        NODE_ENV: 'test'
      }
    });

    // Get the first window
    window = await electronApp.firstWindow();
  });

  test.afterAll(async () => {
    await electronApp?.close();
  });

  test('should launch the application successfully', async () => {
    // Check that the app launched
    expect(electronApp).toBeDefined();
    expect(window).toBeDefined();
  });

  test('should have the correct window title', async () => {
    const title = await window.title();
    expect(title).toBe('App Shell');
  });

  test('should display the welcome message', async () => {
    // Wait for the welcome text to appear
    await expect(window.locator('h2')).toContainText('Welcome to App Shell');
    await expect(window.locator('p')).toContainText('Your extensible application platform');
  });

  test('should have the main application structure', async () => {
    // Check for main container elements
    await expect(window.locator('#app')).toBeVisible();
    await expect(window.locator('.title-bar')).toBeVisible();
    await expect(window.locator('.main-container')).toBeVisible();
    await expect(window.locator('.sidebar')).toBeVisible();
    await expect(window.locator('.content-area')).toBeVisible();
  });

  test('should have functional title bar controls', async () => {
    // Check that title bar controls exist
    await expect(window.locator('#minimize-btn')).toBeVisible();
    await expect(window.locator('#maximize-btn')).toBeVisible();
    await expect(window.locator('#close-btn')).toBeVisible();
  });

  test('should have terminal panel visible', async () => {
    // Check that the terminal panel exists
    await expect(window.locator('#bottom-panel')).toBeVisible();
    await expect(window.locator('#terminal-tab')).toBeVisible();
    await expect(window.locator('#terminal')).toBeVisible();
  });

  test('should display extensions section', async () => {
    // Check extensions sidebar
    await expect(window.locator('h3')).toContainText('Extensions');
    await expect(window.locator('#extensions-list')).toBeVisible();
  });

  test('should be responsive to window resize', async () => {
    // Get initial window size
    const initialSize = await window.evaluate(() => ({
      width: window.innerWidth,
      height: window.innerHeight
    }));

    // Resize window
    await window.setViewportSize({ width: 1200, height: 800 });
    
    // Check new size
    const newSize = await window.evaluate(() => ({
      width: window.innerWidth,
      height: window.innerHeight
    }));

    expect(newSize.width).toBe(1200);
    expect(newSize.height).toBe(800);
    expect(newSize.width).not.toBe(initialSize.width);
  });

  test('should handle focus properly', async () => {
    // Test that the window can be focused
    await window.focus();
    
    // Check that document has focus
    const hasFocus = await window.evaluate(() => document.hasFocus());
    expect(hasFocus).toBe(true);
  });
});