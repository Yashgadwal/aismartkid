const fs = require('fs');
const path = require('path');

const files = [
  'server.js',
  'db.json',
  'package.json',
  'public/index.html',
  'public/landing.html',
  'public/professionals.html',
  'public/blog.html',
  'public/terms.html',
  'public/privacy.html',
  'public/app.js',
  'public/style.css',
  'public/admin/index.html'
];

files.forEach(relPath => {
  const fullPath = path.join(__dirname, relPath);
  if (!fs.existsSync(fullPath)) {
    console.log(`Skipping non-existent file: ${relPath}`);
    return;
  }
  let content = fs.readFileSync(fullPath, 'utf8');
  
  // Replace the name
  let newContent = content
    .replace(/AI SMART KIDS/g, 'AI SMART INSTITUTE')
    .replace(/AI Smart Kids/g, 'AI Smart Institute')
    .replace(/ai smart kids/g, 'ai smart institute');
    
  if (content !== newContent) {
    fs.writeFileSync(fullPath, newContent, 'utf8');
    console.log(`Updated brand name in: ${relPath}`);
  } else {
    console.log(`No changes needed in: ${relPath}`);
  }
});
