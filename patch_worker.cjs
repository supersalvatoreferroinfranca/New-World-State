const fs = require('fs');
let code = fs.readFileSync('temp_worker.js', 'utf8');

const trans = fs.readFileSync('trans.json', 'utf8');

// We need to only replace the first occurrence, which is art-104 (or we can just replace both)
// Let's replace the one for art-104 explicitly.
const searchStr = `    isFeatured: true\n  },\n  {\n    id: 'art-103'`;
const replaceStr = `    isFeatured: true,\n    translations: ${trans}\n  },\n  {\n    id: 'art-103'`;

code = code.replace(searchStr, replaceStr);

fs.writeFileSync('temp_worker.js', code);
