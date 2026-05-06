import fs from 'fs';
import path from 'path';

const DIST_DIR = 'dist';
const PUBLIC_DIR = 'public';

/**
 * Ensures a directory exists
 */
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Copies a file from source to destination
 */
function copyFile(src, dest) {
  try {
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
      return true;
    }
    return false;
  } catch (err) {
    console.error(`Error copying ${src} to ${dest}:`, err);
    return false;
  }
}

async function runPostBuild() {
  console.log('🚀 Starting post-build cleanup and file copying...');

  try {
    // 1. Copy manifest.json
    copyFile(path.join(PUBLIC_DIR, 'manifest.json'), path.join(DIST_DIR, 'manifest.json'));

    // 2. Copy icons
    const iconDest = path.join(DIST_DIR, 'icons');
    ensureDir(iconDest);
    
    const icons = ['icon16.png', 'icon48.png', 'icon128.png', 'extIcon.png'];
    icons.forEach(icon => {
      copyFile(path.join(PUBLIC_DIR, 'icons', icon), path.join(iconDest, icon));
    });

    // 3. Handle popup.html move (Vite puts it in dist/src/ if not configured carefully)
    const srcPopup = path.join(DIST_DIR, 'src', 'popup.html');
    const destPopup = path.join(DIST_DIR, 'popup.html');

    if (fs.existsSync(srcPopup)) {
      let html = fs.readFileSync(srcPopup, 'utf8');
      
      // Update script and link paths for the root location
      html = html.replace(/\.\.\/popup\.js/g, './popup.js')
                 .replace(/\.\.\/popup\.css/g, './popup.css');
      
      fs.writeFileSync(destPopup, html);
      console.log('✅ popup.html moved and paths updated.');
    }

    // 4. Cleanup redundant directories
    const redundantSrc = path.join(DIST_DIR, 'src');
    if (fs.existsSync(redundantSrc)) {
      fs.rmSync(redundantSrc, { recursive: true, force: true });
      console.log('🧹 Cleaned up redundant src directory.');
    }

    console.log('✨ Post-build process completed successfully!');
  } catch (error) {
    console.error('❌ Post-build process failed:', error);
    process.exit(1);
  }
}

runPostBuild();
