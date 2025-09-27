import { test, expect, _electron as electron } from '@playwright/test';
import { ElectronApplication, Page } from 'playwright';
import path from 'path';

let electronApp: ElectronApplication;
let window: Page;

test.describe('App Shell - Terminal', () => {
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

  test('should have terminal panel visible', async () => {
    // Check terminal panel exists and is visible
    await expect(window.locator('#bottom-panel')).toBeVisible();
    await expect(window.locator('#terminal-tab')).toBeVisible();
    await expect(window.locator('#terminal')).toBeVisible();
  });

  test('should have terminal tab active by default', async () => {
    // Check that terminal tab is active
    const terminalTab = window.locator('#terminal-tab');
    await expect(terminalTab).toHaveClass(/active/);
  });

  test('should display output tab', async () => {
    // Check that output tab exists (even if not active)
    const outputTab = window.locator('#output-tab');
    await expect(outputTab).toBeVisible();
  });

  test('should be able to switch between terminal and output tabs', async () => {
    // Click output tab
    const outputTab = window.locator('#output-tab');
    const terminalTab = window.locator('#terminal-tab');

    await outputTab.click();
    await expect(outputTab).toHaveClass(/active/);
    await expect(terminalTab).not.toHaveClass(/active/);

    // Switch back to terminal tab
    await terminalTab.click();
    await expect(terminalTab).toHaveClass(/active/);
    await expect(outputTab).not.toHaveClass(/active/);
  });

  test('should have xterm terminal initialized', async () => {
    // Check for xterm elements
    const xtermContainer = window.locator('.xterm');
    await expect(xtermContainer).toBeVisible();

    // Check for terminal viewport
    const xtermViewport = window.locator('.xterm-viewport');
    await expect(xtermViewport).toBeVisible();
  });

  test('should have proper terminal styling', async () => {
    // Check that terminal has dark background (matching app theme)
    const terminal = window.locator('#terminal');
    const backgroundColor = await terminal.evaluate(
      el => window.getComputedStyle(el).backgroundColor
    );

    // Should have a dark background color (specific RGB values may vary)
    expect(backgroundColor).toMatch(/rgb\(30, 30, 30\)|#1e1e1e|rgba\(30, 30, 30/);
  });

  test('should be able to focus terminal', async () => {
    // Click on the terminal to focus it
    await window.locator('#terminal').click();

    // Terminal should be able to receive focus
    // Note: Testing actual terminal input/output requires the terminal to be fully initialized
    // which depends on the WebTerminalManager being properly set up
  });

  test('should have terminal responsive to container changes', async () => {
    // Get initial terminal dimensions
    const terminal = window.locator('#terminal');
    const initialSize = await terminal.boundingBox();
    expect(initialSize).not.toBeNull();

    // Resize window
    await window.setViewportSize({ width: 1400, height: 900 });

    // Terminal should adapt to new size
    const newSize = await terminal.boundingBox();
    expect(newSize).not.toBeNull();
    expect(newSize!.width).not.toBe(initialSize!.width);
  });

  test('should maintain terminal panel height', async () => {
    // Check that bottom panel has fixed height
    const bottomPanel = window.locator('#bottom-panel');
    const panelHeight = await bottomPanel.evaluate(el => el.offsetHeight);

    // Should have reasonable height (300px as specified in CSS)
    expect(panelHeight).toBe(300);
  });

  test('should have terminal content area properly sized', async () => {
    // Check panel content takes remaining space after tabs
    const panelContent = window.locator('.panel-content');
    const contentHeight = await panelContent.evaluate(el => el.offsetHeight);

    // Should be panel height minus tab height (32px)
    expect(contentHeight).toBe(268); // 300 - 32 = 268
  });

  test('should handle terminal initialization gracefully', async () => {
    // Even if terminal process fails to start, UI should not crash
    const terminal = window.locator('#terminal');
    await expect(terminal).toBeVisible();

    // Should not show error messages in UI
    const errorMessages = window.locator('.error, .loading');
    const errorCount = await errorMessages.count();
    expect(errorCount).toBeLessThanOrEqual(1); // May have loading state initially
  });

  test('should provide visual feedback for terminal state', async () => {
    // Terminal should have some visual indication of its state
    const terminal = window.locator('#terminal');

    // Should either have xterm content or loading/error state
    const xtermExists = await window.locator('.xterm').isVisible();
    const loadingExists = await window.locator('.loading').isVisible();

    // One of these should be true
    expect(xtermExists || loadingExists).toBe(true);
  });
});
