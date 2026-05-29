const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

const cssFiles = [];
walkDir(__dirname, function(filePath) {
  if (filePath.endsWith('.css')) {
    cssFiles.push(filePath);
  }
});

cssFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  const hexPattern = /#[0-9a-fA-F]{3,6}/;
  const hardcodedColors = lines.filter(l => hexPattern.test(l) && !l.includes('var('));
  if (hardcodedColors.length > 0) {
    console.log(`\n=== ${file} ===`);
    console.log(`Found ${hardcodedColors.length} lines with hardcoded hex colors without var() fallback.`);
  }
});
