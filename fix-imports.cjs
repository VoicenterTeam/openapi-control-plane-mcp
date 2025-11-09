/**
 * Fix ES Module imports by adding .js extensions
 */

const fs = require('fs');
const path = require('path');

function fixImports(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    
    if (file.isDirectory()) {
      fixImports(fullPath);
    } else if (file.name.endsWith('.ts') && !file.name.endsWith('.d.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Fix relative imports: from './something' or '../something'
      content = content.replace(
        /from ['"](\.\.[\/\\][^'"]+|\.\/[^'"]+)['"]/g,
        (match, importPath) => {
          // Don't add .js if already has extension
          if (importPath.match(/\.(js|ts|json)$/)) {
            return match;
          }
          return `from '${importPath}.js'`;
        }
      );
      
      fs.writeFileSync(fullPath, content, 'utf8');
      console.log(`Fixed: ${fullPath}`);
    }
  }
}

console.log('Fixing ES module imports...');
fixImports(path.join(__dirname, 'src'));
console.log('Done!');

