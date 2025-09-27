import { electronProcess } from './global-setup';

async function globalTeardown() {
  console.log('🧹 Starting global test teardown...');

  try {
    // Kill the Electron process if it's still running
    if (electronProcess && !electronProcess.killed) {
      console.log('🔪 Terminating Electron process...');
      electronProcess.kill('SIGTERM');

      // Wait for graceful shutdown, then force kill if necessary
      await new Promise<void>(resolve => {
        const timeout = setTimeout(() => {
          if (electronProcess && !electronProcess.killed) {
            console.log('⚡ Force killing Electron process...');
            electronProcess.kill('SIGKILL');
          }
          resolve();
        }, 5000);

        electronProcess?.on('exit', () => {
          clearTimeout(timeout);
          resolve();
        });
      });
    }

    console.log('✅ Global teardown completed successfully');
  } catch (error) {
    console.error('❌ Global teardown failed:', error);
  }
}

export default globalTeardown;
