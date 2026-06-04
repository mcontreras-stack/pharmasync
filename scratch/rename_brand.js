const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');

const excludeDirs = ['.next', 'node_modules', '.git', 'scratch', 'dist', '.nixpacks'];
const excludeFiles = ['rename_brand.js', 'favicon.ico'];

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    const dirPath = path.join(dir, f);
    const isDirectory = fs.statSync(dirPath).isDirectory();
    const basename = path.basename(dirPath);

    if (isDirectory) {
      if (!excludeDirs.includes(basename)) {
        walkDir(dirPath, callback);
      }
    } else {
      if (!excludeFiles.includes(basename)) {
        callback(dirPath);
      }
    }
  });
}

console.log('Iniciando reemplazo de marca en el codebase...');

let fileCount = 0;
let replaceCount = 0;

walkDir(rootDir, (filePath) => {
  // Only process text files (code files, json, sql, md)
  const ext = path.extname(filePath);
  if (!['.ts', '.tsx', '.js', '.jsx', '.json', '.sql', '.md', '.css', '.html'].includes(ext)) {
    return;
  }

  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let hasChanges = false;

    // Replace Brand names
    // 1. "PharmaSync Mom & Baby" -> "Vitara Health Mom & Baby"
    if (content.includes('PharmaSync Mom & Baby')) {
      content = content.replace(/PharmaSync Mom & Baby/g, 'Vitara Health Mom & Baby');
      hasChanges = true;
    }

    // 2. "PharmaSync" -> "Vitara Health"
    if (content.includes('PharmaSync')) {
      content = content.replace(/PharmaSync/g, 'Vitara Health');
      hasChanges = true;
    }

    // 3. Technical name "pharmasync" -> "vitarahealth" (for keys, S3 buckets, localStorage, etc.)
    if (content.includes('pharmasync')) {
      // Except for next package names like "pharmasync-mom-baby" -> "vitara-health-mom-baby"
      content = content.replace(/pharmasync-mom-baby/g, 'vitara-health-mom-baby');
      content = content.replace(/pharmasync_user/g, 'vitarahealth_user');
      content = content.replace(/pharmasync_mock_db/g, 'vitarahealth_mock_db');
      content = content.replace(/pharmasync_admin_subrole/g, 'vitarahealth_admin_subrole');
      content = content.replace(/pharmasync_admin_impersonator/g, 'vitarahealth_admin_impersonator');
      content = content.replace(/pharmasync_new_email/g, 'vitarahealth_new_email');
      content = content.replace(/pharmasync_sent_emails/g, 'vitarahealth_sent_emails');
      content = content.replace(/pharmasync_otp_/g, 'vitarahealth_otp_');
      content = content.replace(/pharmasync_reset_/g, 'vitarahealth_reset_');
      
      // Generic replacements
      content = content.replace(/pharmasync-demo/g, 'vitarahealth-demo');
      content = content.replace(/pharmasync/g, 'vitarahealth');
      hasChanges = true;
    }

    if (hasChanges) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✓ Modificado: ${path.relative(rootDir, filePath)}`);
      fileCount++;
    }
  } catch (err) {
    console.error(`Error procesando archivo ${filePath}:`, err.message);
  }
});

console.log(`Reemplazo completado. Se modificaron ${fileCount} archivos.`);
