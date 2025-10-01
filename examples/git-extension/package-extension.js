/* eslint-env node */
/**
 * Package Git Extension for Distribution
 *
 * Creates a .zip file containing the built extension ready for installation
 */

const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

const extensionDir = __dirname;
const outputDir = path.join(extensionDir, '..', '..');
const packageJson = require('./package.json');
const outputFileName = `${packageJson.name}-${packageJson.version}.zip`;
const outputPath = path.join(outputDir, 'dist', 'extensions', outputFileName);

// Files and directories to include in the package
const includePatterns = [
  'dist/**',
  'themes/**',
  'package.json',
  'README.md',
  'CHANGELOG.md',
  'LICENSE',
  'INSTALLATION.md',
  'EXAMPLE_USAGE.md',
];

// Files and directories to exclude
const excludePatterns = [
  'node_modules/**',
  'src/**',
  '.git/**',
  '*.log',
  'tsconfig.json',
  'build.sh',
  'build.bat',
  'package-extension.js',
];

async function packageExtension() {
  console.log('📦 Packaging Git Extension...');
  console.log(`   Extension: ${packageJson.displayName} v${packageJson.version}`);
  console.log(`   Output: ${outputPath}`);

  // Ensure output directory exists
  const outputDirPath = path.dirname(outputPath);
  if (!fs.existsSync(outputDirPath)) {
    fs.mkdirSync(outputDirPath, { recursive: true });
  }

  // Create a write stream for the zip file
  const output = fs.createWriteStream(outputPath);
  const archive = archiver('zip', {
    zlib: { level: 9 }, // Maximum compression
  });

  return new Promise((resolve, reject) => {
    output.on('close', () => {
      const sizeInMB = (archive.pointer() / 1024 / 1024).toFixed(2);
      console.log(`✅ Package created successfully!`);
      console.log(`   Size: ${sizeInMB} MB`);
      console.log(`   Total files: ${archive.pointer()} bytes`);
      console.log(`   Location: ${outputPath}`);
      resolve();
    });

    archive.on('error', err => {
      console.error('❌ Error creating package:', err);
      reject(err);
    });

    archive.on('warning', err => {
      if (err.code === 'ENOENT') {
        console.warn('⚠️  Warning:', err);
      } else {
        reject(err);
      }
    });

    // Pipe archive data to the file
    archive.pipe(output);

    const distPath = path.join(extensionDir, 'dist');
    if (!fs.existsSync(distPath)) {
      console.error('❌ Error: dist directory not found. Run "pnpm build" first.');
      process.exit(1);
    }

    includePatterns.forEach(pattern => {
      archive.glob(pattern, {
        cwd: extensionDir,
        ignore: excludePatterns,
        dot: true,
      });
    });

    // Finalize the archive once all patterns are queued
    archive.finalize();
  });
}

// Run the packaging
packageExtension().catch(err => {
  console.error('Failed to package extension:', err);
  process.exit(1);
});
