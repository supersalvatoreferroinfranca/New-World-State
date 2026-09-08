const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const trans = fs.readFileSync('trans.json', 'utf8');

// Replace the one for art-104 explicitly.
const searchStr = `    isFeatured: true\n  },\n  {\n    id: 'art-103'`;
const replaceStr = `    isFeatured: true,\n    translations: ${trans}\n  },\n  {\n    id: 'art-103'`;

code = code.replace(searchStr, replaceStr);

fs.writeFileSync('server.ts', code);
