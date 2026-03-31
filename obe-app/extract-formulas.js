const xlsx = require('xlsx');

const workbook = xlsx.readFile('../AIoT-118-THEORY- 2-Mid OBE Attainment Format.xls', { cellFormula: true });
console.log("SheetNames:", workbook.SheetNames);
const sheetName = 'Mid-2 Attainment'; // based on typical naming. Let's just output all sheets first.
const sheet = workbook.Sheets[sheetName] || workbook.Sheets[workbook.SheetNames[1]];

console.log(`Processing Sheet: ${sheetName}`);

const formulas = [];
for (const cell in sheet) {
  if (cell[0] === '!') continue;
  if (sheet[cell].f) {
    formulas.push(`${cell}: ${sheet[cell].v} => Formula: ${sheet[cell].f}`);
  }
}

console.log(`Found ${formulas.length} formulas.`);
// Limit output to prevent massive spam
formulas.slice(0, 100).forEach(f => console.log(f));
