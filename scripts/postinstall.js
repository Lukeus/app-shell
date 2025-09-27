const { exec } = require('child_process');
const os = require('os');

// Check if we're in a CI environment
const isCI = process.env.CI || process.env.CONTINUOUS_INTEGRATION || process.env.GITHUB_ACTIONS;

if (!isCI) {
  console.log('🔧 Running electron-rebuild for native modules...');
  exec('pnpm run rebuild', (error, stdout, stderr) => {
    if (error) {
      console.log('⚠️  Native module rebuild failed, using fallback implementations');
      console.log('This is normal for some environments and won\'t affect core functionality.');
      if (process.env.DEBUG) {
        console.log('Error details:', error.message);
      }
    } else {
      console.log('✅ Electron rebuild completed successfully');
    }
    if (stdout && process.env.DEBUG) console.log('stdout:', stdout);
    if (stderr && process.env.DEBUG) console.log('stderr:', stderr);
  });
} else {
  console.log('🚀 Skipping native rebuild in CI environment (' + (process.env.GITHUB_ACTIONS ? 'GitHub Actions' : 'CI') + ')');
  console.log('Platform:', os.platform(), 'Arch:', os.arch());
}
