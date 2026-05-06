const fs = require('fs');

const path = 'src/modules/project/application/service/project.service.ts';
let text = fs.readFileSync(path, 'utf8');

text = text.replace(
  "tokenSymbol: data.tokenSymbol ?? '',",
  "tokenSymbol: data.tokenSymbol || null,"
);

fs.writeFileSync(path, text);
console.log('tokenSymbol fix applied');
