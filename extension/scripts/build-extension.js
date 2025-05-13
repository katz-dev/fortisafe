const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Build the Next.js app
console.log('Building Next.js app...');
execSync('npm run build', { stdio: 'inherit' });

// Create extension directory
const extensionDir = path.resolve(__dirname, '../extension');
if (!fs.existsSync(extensionDir)) {
  fs.mkdirSync(extensionDir, { recursive: true });
}

// Copy manifest
console.log('Copying extension files...');
fs.copyFileSync(
  path.resolve(__dirname, '../public/manifest.json'),
  path.resolve(extensionDir, 'manifest.json')
);

// Create icons directory
const iconsDir = path.resolve(extensionDir, 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Create a simple placeholder icon if it doesn't exist
const createPlaceholderIcon = (size) => {
  const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#4F46E5"/>
  <text x="${size / 2}" y="${size * 0.625}" font-family="Arial" font-size="${size * 0.625}" fill="white" text-anchor="middle">F</text>
</svg>`;

  const iconPath = path.resolve(iconsDir, `icon${size}.svg`);
  fs.writeFileSync(iconPath, svgContent);
  console.log(`Created placeholder icon: icon${size}.svg`);
};

// Create placeholder icons for different sizes
[16, 48, 128].forEach(size => {
  const iconPath = path.resolve(__dirname, `../public/icons/icon${size}.png`);
  if (!fs.existsSync(iconPath)) {
    createPlaceholderIcon(size);
  } else {
    fs.copyFileSync(
      iconPath,
      path.resolve(iconsDir, `icon${size}.png`)
    );
  }
});

// Copy the built Next.js app to the extension directory
console.log('Copying built Next.js app...');
const nextBuildDir = path.resolve(__dirname, '../extension-build');

// Create assets directory
const assetsDir = path.resolve(extensionDir, 'assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

// Copy static files from _next directory to assets directory
const nextStaticDir = path.resolve(nextBuildDir, '_next');
if (fs.existsSync(nextStaticDir)) {
  // Copy CSS files
  const cssDir = path.resolve(nextStaticDir, 'static/css');
  if (fs.existsSync(cssDir)) {
    fs.cpSync(cssDir, path.resolve(assetsDir, 'css'), { recursive: true });
  }

  // Copy JS files
  const chunksDir = path.resolve(nextStaticDir, 'static/chunks');
  if (fs.existsSync(chunksDir)) {
    fs.cpSync(chunksDir, path.resolve(assetsDir, 'chunks'), { recursive: true });
  }
}

// Create popup.html with updated paths
const popupHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>FortiSafe Extension</title>
  <link rel="stylesheet" href="assets/css/main.css">
</head>
<body>
  <div id="__next"></div>
  <script src="assets/chunks/main.js"></script>
  <script src="assets/chunks/webpack.js"></script>
  <script src="assets/chunks/pages/popup.js"></script>
</body>
</html>
`;
fs.writeFileSync(path.resolve(extensionDir, 'popup.html'), popupHtml);

// Create simple background.js
const backgroundJs = `
console.log('Background script running');
`;
fs.writeFileSync(path.resolve(extensionDir, 'background.js'), backgroundJs);

// Create simple content.js
const contentJs = `
console.log('Content script running on', window.location.href);
`;
fs.writeFileSync(path.resolve(extensionDir, 'content.js'), contentJs);

console.log('Extension build complete! Load the "extension" folder in your browser.'); 