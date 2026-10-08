import fs from 'fs';

try {
  let arts = [];
  if (fs.existsSync('data/news_articles.json')) {
    arts = JSON.parse(fs.readFileSync('data/news_articles.json', 'utf8'));
  }

  let indexHtml = '';
  if (fs.existsSync('dist/index.html')) {
    indexHtml = fs.readFileSync('dist/index.html', 'utf8');
  } else if (fs.existsSync('index.html')) {
    indexHtml = fs.readFileSync('index.html', 'utf8');
  }

  const out = `// Generated automatically by build_worker_assets.js
export const FALLBACK_ARTICLES = ${JSON.stringify(arts)};
export const FALLBACK_INDEX_HTML = ${JSON.stringify(indexHtml)};
`;

  fs.writeFileSync('worker_assets.js', out, 'utf8');
  console.log('✓ worker_assets.js successfully generated with', arts.length, 'articles and fallback index.html.');
} catch (e) {
  console.error('[BUILD-WORKER-ASSETS-ERR]', e);
}
