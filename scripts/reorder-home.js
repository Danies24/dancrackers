const fs = require('fs');
const file = 'app/(public)/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// The block to extract
const blockStart = `      {/* ₹99 Store — real, price-sorted, one horizontal scroll per shop`;
const blockEnd = `      })}`;

const startIndex = content.indexOf(blockStart);
const endIndex = content.indexOf(blockEnd, startIndex) + blockEnd.length;

const block = content.substring(startIndex, endIndex);

// Remove the block from its current location, plus the trailing newline if possible
content = content.replace(block + '\n\n', '');

// The insertion point
const insertMarker = `      {/* Shop by category — segregated into Night/Day Crackers`;
const insertIndex = content.indexOf(insertMarker);

// Insert the block
content = content.substring(0, insertIndex) + block + '\n\n' + content.substring(insertIndex);

fs.writeFileSync(file, content, 'utf8');
