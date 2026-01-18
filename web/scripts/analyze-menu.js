const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const menuDir = path.join(__dirname, '../../menu');
const files = fs.readdirSync(menuDir);
const etFile = files.find(f => f.endsWith('.et') || f.endsWith('.xlsx'));

if (!etFile) {
  console.log('No Excel/ET file found.');
  process.exit(1);
}

const filePath = path.join(menuDir, etFile);
console.log(`Reading file: ${filePath}`);

const workbook = XLSX.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];

// Convert to JSON to see structure
const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }); // Array of arrays

console.log('Sheet Name:', sheetName);
console.log('First 100 rows:');
data.slice(0, 100).forEach((row, i) => {
  if (row && row.length > 0) {
     console.log(`Row ${i}:`, row[0]); // Just print first column to find sections
  }
});
