const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '..', 'sw.js');

const now = new Date();
const dateStamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
const nextVersion = `v${dateStamp}`;
const queryVersion = dateStamp;

const cacheVersionPattern = /const CACHE_VERSION = 'v\d{8}';/;
const originalContent = fs.readFileSync(targetFile, 'utf8').replace(/^\uFEFF/, '');
const filesToUpdate = [
  { file: path.join(__dirname, '..', 'index.html'), pattern: /serviceWorker\.register\(['"]\.\/sw\.js(?:\?v=?v?\d{8})?['"]\)/, makeReplacement: () => `serviceWorker.register('./sw.js?v=${queryVersion}')` },
  { file: path.join(__dirname, '..', 'cek_lembur', 'index.html'), pattern: /serviceWorker\.register\(['"]\.\.\/sw\.js(?:\?v=?v?\d{8})?['"]\)/, makeReplacement: () => `serviceWorker.register('../sw.js?v=${queryVersion}')` },
  { file: path.join(__dirname, '..', 'work_planner.html'), pattern: /serviceWorker\.register\(['"]\.\/sw\.js(?:\?v=?v?\d{8})?['"]\)/, makeReplacement: () => `serviceWorker.register('./sw.js?v=${queryVersion}')` },
  { file: path.join(__dirname, '..', 'notes_viewer.html'), pattern: /serviceWorker\.register\(['"]\.\/sw\.js(?:\?v=?v?\d{8})?['"]\)/, makeReplacement: () => `serviceWorker.register('./sw.js?v=${queryVersion}')` },
];

if (!cacheVersionPattern.test(originalContent)) {
  throw new Error('CACHE_VERSION declaration not found in sw.js');
}

const updatedContent = originalContent.replace(cacheVersionPattern, `const CACHE_VERSION = '${nextVersion}';`);
fs.writeFileSync(targetFile, updatedContent);

filesToUpdate.forEach(({ file, pattern, makeReplacement }) => {
  const content = fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '');
  const updated = content.replace(pattern, makeReplacement());
  fs.writeFileSync(file, updated);
});

console.log(`CACHE_VERSION bumped to ${nextVersion} and service worker register URL updated.`);
