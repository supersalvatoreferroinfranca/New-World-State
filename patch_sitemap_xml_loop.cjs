const fs = require('fs');

function patchFile(filename) {
    let code = fs.readFileSync(filename, 'utf8');

    // Replace the block in server.ts
    const search1 = `
        const defaultUrl = getArticleUrl('it');
        const hreflangs = buildMultilingualHreflangs(getArticleUrl, defaultUrl);
        const imageXml = imgUrl ? \`
          <image:image>
            <image:loc>\${escapeHtml(imgUrl)}</image:loc>
            <image:title>\${escapeHtml(cleanTitle)}</image:title>
            <image:caption>\${escapeHtml(cleanTitle)}</image:caption>
          </image:image>\` : '';

        return SITE_SUPPORTED_LANGUAGES.map(lang => {
          const url = getArticleUrl(lang);
          return \`
        <url>
          <loc>\${escapeHtml(url)}</loc>
          <lastmod>\${lastMod}</lastmod>
          <changefreq>daily</changefreq>
          <priority>0.95</priority>\${hreflangs}\${imageXml}
        </url>\`;
        }).join('');
    `;
    
    const replace1 = `
        const defaultUrl = getArticleUrl('it');
        const hreflangs = buildMultilingualHreflangs(getArticleUrl, defaultUrl);

        return SITE_SUPPORTED_LANGUAGES.map(lang => {
          let langTitle = cleanTitle;
          if (lang !== 'it' && a.translations && a.translations[lang] && a.translations[lang].title) {
            langTitle = a.translations[lang].title;
          }
          const url = getArticleUrl(lang);
          const imageXml = imgUrl ? \`
          <image:image>
            <image:loc>\${escapeHtml(imgUrl)}</image:loc>
            <image:title>\${escapeHtml(langTitle)}</image:title>
            <image:caption>\${escapeHtml(langTitle)}</image:caption>
          </image:image>\` : '';
          return \`
        <url>
          <loc>\${escapeHtml(url)}</loc>
          <lastmod>\${lastMod}</lastmod>
          <changefreq>daily</changefreq>
          <priority>0.95</priority>\${hreflangs}\${imageXml}
        </url>\`;
        }).join('');
    `;

    // Try to replace in server.ts (and adjust for temp_worker.js if they differ slightly)
    if (code.includes(search1.trim())) {
        code = code.replace(search1.trim(), replace1.trim());
    }

    fs.writeFileSync(filename, code);
}

patchFile('server.ts');
