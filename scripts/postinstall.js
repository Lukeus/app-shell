const { exec } = require('child_process');

if (!process.env.CI) {
  console.log('Running electron-rebuild...');
  exec('pnpm run rebuild', (error, stdout, stderr) => {
    if (error) {
      console.log('Native module rebuild failed, using fallback implementations');
      console.log('Error:', error.message);
    } else {
      console.log('Electron rebuild completed successfully');
    }
    if (stdout) console.log('stdout:', stdout);
    if (stderr) console.log('stderr:', stderr);
  });
} else {
  console.log('Skipping native rebuild in CI environment');
}
