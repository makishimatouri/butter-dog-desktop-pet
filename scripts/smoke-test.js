const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const requiredFiles = [
  'src/main.js',
  'src/preload.js',
  'src/renderer.html',
  'src/renderer.js',
  'src/styles.css',
  'assets/spritesheet.webp'
];

for (const relativePath of requiredFiles) {
  const filePath = path.join(root, relativePath);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing required file: ${relativePath}`);
  }
}

const spriteSize = fs.statSync(path.join(root, 'assets/spritesheet.webp')).size;
if (spriteSize < 100_000) {
  throw new Error('spritesheet.webp is unexpectedly small');
}

console.log('Smoke test passed.');
