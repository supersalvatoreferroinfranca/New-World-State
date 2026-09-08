const fs = require('fs');
let code = fs.readFileSync('temp_worker.js', 'utf8');

const trans = fs.readFileSync('trans.json', 'utf8');

code = code.replace(
  "isFeatured: true\n  },",
  "isFeatured: true,\n    translations: " + trans + "\n  },"
);

fs.writeFileSync('temp_worker.js', code);
