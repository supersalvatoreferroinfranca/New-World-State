const fs = require('fs');
let code = fs.readFileSync('temp_worker.js', 'utf8');

const search = `    const isStaticAsset = (pathname) => {\n      const staticExtensions = [`;
const replace = `    const isStaticAsset = (pathname) => {\n      // Bypass static asset check for dynamically generated XMLs/feeds\n      if (pathname === '/sitemap.xml' || pathname === '/sitemap-news.xml' || pathname === '/rss.xml' || pathname === '/feed.xml') return false;\n      const staticExtensions = [`;

code = code.replace(search, replace);
fs.writeFileSync('temp_worker.js', code);
