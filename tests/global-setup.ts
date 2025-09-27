import { chromium, FullConfig } from '@playwright/test';
import { ChildProcess, spawn } from 'child_process';
import path from 'path';

let electronProcess: ChildProcess | undefined;

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global test setup...');

  // Ensure the application is built before running tests
  console.log('📦 Building application...');

  try {
    // Start the Electron application in test mode
    console.log('🖥️  Starting Electron application...');
    const electronPath = path.resolve(__dirname, '../node_modules/.bin/electron');
    const mainPath = path.resolve(__dirname, '../dist/main/main.js');

    electronProcess = spawn(electronPath, [mainPath], {
      env: {
        ...process.env,
        NODE_ENV: 'test',
        ELECTRON_ENABLE_LOGGING: '1',
      },
      stdio: 'pipe',
    });

    if (electronProcess.stdout) {
      electronProcess.stdout.on('data', data => {
        console.log(`Electron stdout: ${data}`);
      });
    }

    if (electronProcess.stderr) {
      electronProcess.stderr.on('data', data => {
        console.error(`Electron stderr: ${data}`);
      });
    }

    // Wait a bit for the application to start
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('✅ Global setup completed successfully');
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  }
}

export default globalSetup;
export { electronProcess };
