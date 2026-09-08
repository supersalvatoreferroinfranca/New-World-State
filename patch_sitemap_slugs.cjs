const fs = require('fs');

function patchFile(filename) {
    let code = fs.readFileSync(filename, 'utf8');

    // Fix sitemap.xml slug generation
    code = code.replace(
        /const translatedSlug = lang === 'it' \? slug : \(generateSlugServer\(langTitle\) \|\| slug\);/g,
        "const translatedSlug = slug; // Mantieni lo slug originale affinché la SPA possa trovare l'articolo"
    );
    code = code.replace(
        /const translatedSlug = lang === 'it' \? slug : \(generateSlugWorker\(langTitle\) \|\| slug\);/g,
        "const translatedSlug = slug; // Mantieni lo slug originale"
    );

    // Fix image:title to use langTitle
    // Wait, in sitemap.xml, image:title is currently using cleanTitle for all languages because it's built outside the loop.
    // Let's modify the map loop in sitemap.xml.
    
    fs.writeFileSync(filename, code);
}

patchFile('server.ts');
patchFile('temp_worker.js');
console.log("Patched slugs!");
