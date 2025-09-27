import { test, expect, _electron as electron } from '@playwright/test';
import { ElectronApplication, Page } from 'playwright';
import path from 'path';

let electronApp: ElectronApplication;
let window: Page;

test.describe('App Shell - Command Palette', () => {
  test.beforeAll(async () => {
    electronApp = await electron.launch({
      args: [path.resolve(__dirname, '../../dist/main/main.js')],
      env: {
        ...process.env,
        NODE_ENV: 'test',
      },
    });
    window = await electronApp.firstWindow();
  });

  test.afterAll(async () => {
    await electronApp?.close();
  });

  test.beforeEach(async () => {
    // Ensure command palette is closed before each test
    const palette = window.locator('.command-palette');
    const isVisible = await palette.isVisible().catch(() => false);
    if (isVisible) {
      await window.keyboard.press('Escape');
      await expect(palette).toBeHidden();
    }
  });

  test('should open command palette with keyboard shortcut', async () => {
    // Open command palette with Cmd+Shift+P (macOS) or Ctrl+Shift+P
    await window.keyboard.press('Meta+Shift+KeyP');

    // Check if command palette is visible
    const palette = window.locator('.command-palette');
    await expect(palette).toBeVisible();

    // Check if input field is focused
    const input = window.locator('.command-palette input');
    await expect(input).toBeFocused();
  });

  test('should close command palette with Escape key', async () => {
    // Open command palette
    await window.keyboard.press('Meta+Shift+KeyP');
    const palette = window.locator('.command-palette');
    await expect(palette).toBeVisible();

    // Close with Escape
    await window.keyboard.press('Escape');
    await expect(palette).toBeHidden();
  });

  test('should display available commands', async () => {
    // Open command palette
    await window.keyboard.press('Meta+Shift+KeyP');

    // Wait for commands to load
    await window.waitForTimeout(1000);

    // Check if command results are displayed
    const results = window.locator('.command-results .command-item');
    const count = await results.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should filter commands based on search input', async () => {
    // Open command palette
    await window.keyboard.press('Meta+Shift+KeyP');
    const input = window.locator('.command-palette input');

    // Get initial command count
    await window.waitForTimeout(500);
    const initialResults = window.locator('.command-results .command-item');
    const initialCount = await initialResults.count();

    // Type search query
    await input.fill('quit');
    await window.waitForTimeout(300);

    // Check filtered results
    const filteredResults = window.locator('.command-results .command-item');
    const filteredCount = await filteredResults.count();

    expect(filteredCount).toBeLessThanOrEqual(initialCount);
    expect(filteredCount).toBeGreaterThan(0);
  });

  test('should navigate commands with arrow keys', async () => {
    // Open command palette
    await window.keyboard.press('Meta+Shift+KeyP');
    await window.waitForTimeout(500);

    // Check if first item is selected
    const firstItem = window.locator('.command-results .command-item').first();
    await expect(firstItem).toHaveClass(/selected/);

    // Navigate down
    await window.keyboard.press('ArrowDown');
    const secondItem = window.locator('.command-results .command-item').nth(1);
    await expect(secondItem).toHaveClass(/selected/);

    // Navigate back up
    await window.keyboard.press('ArrowUp');
    await expect(firstItem).toHaveClass(/selected/);
  });

  test('should execute command on Enter press', async () => {
    // Open command palette
    await window.keyboard.press('Meta+Shift+KeyP');
    const input = window.locator('.command-palette input');

    // Search for a specific command (e.g., "about")
    await input.fill('about');
    await window.waitForTimeout(300);

    // Press Enter to execute
    await window.keyboard.press('Enter');

    // Command palette should close
    const palette = window.locator('.command-palette');
    await expect(palette).toBeHidden();
  });

  test('should show command categories if available', async () => {
    // Open command palette
    await window.keyboard.press('Meta+Shift+KeyP');
    await window.waitForTimeout(500);

    // Check for command items with categories
    const commandItems = window.locator('.command-results .command-item');
    const firstCommand = commandItems.first();

    // Check if command has title (required)
    const title = firstCommand.locator('.command-title');
    await expect(title).toBeVisible();
  });

  test('should handle empty search results gracefully', async () => {
    // Open command palette
    await window.keyboard.press('Meta+Shift+KeyP');
    const input = window.locator('.command-palette input');

    // Search for something that doesn't exist
    await input.fill('nonexistentcommand12345');
    await window.waitForTimeout(500);

    // Check that no results are shown or empty state is displayed
    const results = window.locator('.command-results .command-item');
    const count = await results.count();
    expect(count).toBe(0);
  });

  test('should maintain focus within command palette', async () => {
    // Open command palette
    await window.keyboard.press('Meta+Shift+KeyP');
    const input = window.locator('.command-palette input');

    // Ensure input is focused
    await expect(input).toBeFocused();

    // Navigate with keys
    await window.keyboard.press('ArrowDown');

    // Focus should still be manageable
    await window.keyboard.press('ArrowUp');

    // Should be able to type in input
    await window.keyboard.type('test');
    const value = await input.inputValue();
    expect(value).toBe('test');
  });
});
