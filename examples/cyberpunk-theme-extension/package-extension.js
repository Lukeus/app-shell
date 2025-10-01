/* eslint-env node */
/**
 * Package Cyberpunk Theme Extension for Distribution
 */

const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

const extensionDir = __dirname;
const outputDir = path.join(extensionDir, '..', '..');
const packageJson = require('./package.json');
const outputFileName = `${packageJson.name}-${packageJson.version}.zip`;
const outputPath = path.join(outputDir, 'dist', 'extensions', outputFileName);

async function packageExtension() {
  console.log('📦 Packaging Cyberpunk Theme Extension...');
  console.log(`   Extension: ${packageJson.displayName} v${packageJson.version}`);
  console.log(`   Output: ${outputPath}`);

  const outputDirPath = path.dirname(outputPath);
  if (!fs.existsSync(outputDirPath)) {
    fs.mkdirSync(outputDirPath, { recursive: true });
  }

  const output = fs.createWriteStream(outputPath);
  const archive = archiver('zip', { zlib: { level: 9 } });

  return new Promise((resolve, reject) => {
    output.on('close', () => {
      const sizeInKB = (archive.pointer() / 1024).toFixed(2);
      console.log(`✅ Package created successfully!`);
      console.log(`   Size: ${sizeInKB} KB`);
      console.log(`   Location: ${outputPath}`);
      resolve();
    });

    archive.on('error', reject);
    archive.pipe(output);

    // Add required files
    archive.file(path.join(extensionDir, 'package.json'), { name: 'package.json' });

    // Add src directory (JavaScript extension)
    if (fs.existsSync(path.join(extensionDir, 'src'))) {
      archive.directory(path.join(extensionDir, 'src'), 'src');
    }

    // Add themes directory
    if (fs.existsSync(path.join(extensionDir, 'themes'))) {
      archive.directory(path.join(extensionDir, 'themes'), 'themes');
    }

    // Add documentation
    const docFiles = ['README.md', 'CHANGELOG.md'];
    docFiles.forEach(file => {
      const filePath = path.join(extensionDir, file);
      if (fs.existsSync(filePath)) {
        archive.file(filePath, { name: file });
      }
    });

    archive.finalize();
  });
}

packageExtension().catch(err => {
  console.error('Failed to package extension:', err);
  process.exit(1);
});
