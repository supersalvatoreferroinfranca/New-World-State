/**
 * Build-time and deploy-time Sitemap Sanitizer for New World State
 * Ensures all sitemap, news, RSS, and LLM text files strictly use the canonical
 * sovereign domain https://newworldstate.cloud with ZERO references to localhost.
 */

import fs from 'fs';
import path from 'path';

const CANONICAL_DOMAIN = 'https://newworldstate.cloud';

function scanAndSanitize(dir) {
  if (!fs.existsSync(dir)) return 0;
  let count = 0;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      count += scanAndSanitize(fullPath);
    } else if (/\.(xml|html|txt|json|webmanifest)$/i.test(entry.name)) {
      try {
        let content = fs.readFileSync(fullPath, 'utf8');
        const matches = content.match(/http:\/\/localhost:3000/g) || content.match(/http:\/\/localhost(?!\w)/g) || content.match(/localhost:3000/g);
        if (matches && matches.length > 0) {
          content = content.replace(/http:\/\/localhost:3000/g, CANONICAL_DOMAIN);
          content = content.replace(/http:\/\/localhost(?!\w)/g, CANONICAL_DOMAIN);
          content = content.replace(/localhost:3000/g, 'newworldstate.cloud');
          fs.writeFileSync(fullPath, content, 'utf8');
          console.log(`[SITEMAP-SANITIZE] Fixed ${matches.length} occurrences in ${path.relative(process.cwd(), fullPath)}`);
          count += matches.length;
        }
      } catch (e) {}
    }
  }
  return count;
}

let totalReplaced = 0;
totalReplaced += scanAndSanitize(path.join(process.cwd(), 'public'));
totalReplaced += scanAndSanitize(path.join(process.cwd(), 'dist'));

console.log(`[SITEMAP-SANITIZE] Sanitization completed. Total localhost URLs corrected: ${totalReplaced}`);
