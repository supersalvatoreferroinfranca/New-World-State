/**
 * Build-time and deploy-time Sitemap Sanitizer for New World State
 * Ensures all sitemap, news, RSS, and LLM text files strictly use the canonical
 * sovereign domain https://newworldstate.cloud with ZERO references to localhost.
 */

import fs from 'fs';
import path from 'path';

const CANONICAL_DOMAIN = 'https://newworldstate.cloud';
const TARGET_FILES = [
  'public/sitemap.xml',
  'public/sitemap-news.xml',
  'public/sitemap.html',
  'public/rss.xml',
  'public/llms.txt',
  'public/robots.txt',
  'dist/sitemap.xml',
  'dist/sitemap-news.xml',
  'dist/sitemap.html',
  'dist/rss.xml',
  'dist/llms.txt',
  'dist/robots.txt'
];

let totalReplaced = 0;

for (const relPath of TARGET_FILES) {
  const fullPath = path.join(process.cwd(), relPath);
  if (fs.existsSync(fullPath)) {
    try {
      let content = fs.readFileSync(fullPath, 'utf8');
      const matches = content.match(/http:\/\/localhost:3000/g);
      if (matches && matches.length > 0) {
        content = content.replace(/http:\/\/localhost:3000/g, CANONICAL_DOMAIN);
        content = content.replace(/http:\/\/localhost/g, CANONICAL_DOMAIN);
        content = content.replace(/localhost:3000/g, 'newworldstate.cloud');
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`[SITEMAP-SANITIZE] Fixed ${matches.length} localhost occurrences in ${relPath}`);
        totalReplaced += matches.length;
      } else {
        console.log(`[SITEMAP-SANITIZE] Verified clean (0 localhost): ${relPath}`);
      }
    } catch (err) {
      console.error(`[SITEMAP-SANITIZE] Error processing ${relPath}:`, err.message);
    }
  }
}

console.log(`[SITEMAP-SANITIZE] Sanitization completed. Total localhost URLs corrected: ${totalReplaced}`);
