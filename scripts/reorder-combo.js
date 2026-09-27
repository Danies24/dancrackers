const fs = require('fs');
const file = 'app/(public)/page.tsx';
let content = fs.readFileSync(file, 'utf8');

const comboStart = `      {/* Combo Packs`;
const comboEnd = `        </section>\n      )}\n`;

let startIndex = content.indexOf(comboStart);
let endIndex = content.indexOf(comboEnd, startIndex) + comboEnd.length;

let comboBlock = content.substring(startIndex, endIndex);

// Remove combo block
content = content.substring(0, startIndex) + content.substring(endIndex);

// Insert after 99 Store block
const ninetyNineEnd = `      })}\n`;
let insertIndex = content.indexOf(ninetyNineEnd) + ninetyNineEnd.length;

content = content.substring(0, insertIndex) + '\n' + comboBlock + content.substring(insertIndex);

fs.writeFileSync(file, content, 'utf8');
