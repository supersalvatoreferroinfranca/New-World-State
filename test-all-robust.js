async function testAllRobust() {
  const query = 'colosseo';

  async function fetchBingSiteImages(platformId, siteHost, cleanQuery, maxItems = 8) {
    const fullQuery = `site:${siteHost} ${cleanQuery}`;
    const url = `https://www.bing.com/images/async?q=${encodeURIComponent(fullQuery)}&first=1&count=20&rel=1`;
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'it-IT,it;q=0.9,en-US;q=0.8,en;q=0.7'
        }
      });
      const html = await res.text();
      const murls = [...html.matchAll(/murl&quot;:&quot;(.*?)&quot;/g)].map(m => m[1]);
      const purls = [...html.matchAll(/purl&quot;:&quot;(.*?)&quot;/g)].map(m => m[1]);
      const turls = [...html.matchAll(/turl&quot;:&quot;(.*?)&quot;/g)].map(m => m[1]);

      const items = [];
      const seen = new Set();

      for (let i = 0; i < murls.length; i++) {
        const imgUrl = murls[i];
        const pageUrl = purls[i] || `https://${siteHost}`;
        const thumbUrl = turls[i] || imgUrl;

        if (!imgUrl || seen.has(imgUrl)) continue;
        seen.add(imgUrl);

        items.push({
          id: `${platformId.substring(0, 2)}_${Math.random().toString(36).substring(2, 9)}`,
          type: 'image',
          sourcePlatform: platformId,
          url: imgUrl,
          previewUrl: thumbUrl,
          sourceUrl: pageUrl,
          title: `${cleanQuery} - Fotografia ${platformId.toUpperCase()}`,
          author: `${platformId.toUpperCase()} Contributor`
        });

        if (items.length >= maxItems) break;
      }
      return items;
    } catch (e) {
      console.warn(`[Bing-${platformId.toUpperCase()}-ERR]`, e.message);
      return [];
    }
  }

  console.log('Testing all platforms with Bing Site Search + Direct APIs...\n');

  const platforms = [
    { id: 'unsplash', host: 'unsplash.com' },
    { id: 'pexels', host: 'pexels.com' },
    { id: 'pixabay', host: 'pixabay.com' },
    { id: 'wikimedia', host: 'commons.wikimedia.org' },
    { id: 'flickr', host: 'flickr.com' }
  ];

  for (const p of platforms) {
    const items = await fetchBingSiteImages(p.id, p.host, query, 8);
    console.log(`>>> PLATFORM: ${p.id.toUpperCase()} (Count: ${items.length}) <<<`);
    if (items[0]) {
      console.log(`   [1] Title: ${items[0].title}`);
      console.log(`       Img URL: ${items[0].url}`);
      console.log(`       Page URL: ${items[0].sourceUrl}`);
    }
    console.log('');
  }
}

testAllRobust();
