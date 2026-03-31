const xlsx = require('xlsx');

const workbook = xlsx.readFile('AIoT-118-THEORY- 2-Mid OBE Attainment Format.xls', { cellFormula: true });
const sheetName = workbook.SheetNames.find(n => n.toLowerCase().includes('mid') || n.toLowerCase().includes('internal') || n.toLowerCase().includes('direct') || n.toLowerCase().includes('attain'));
const sheet = workbook.Sheets[sheetName || workbook.SheetNames[0]];

console.log(`Processing Sheet: ${sheetName || workbook.SheetNames[0]}`);

const formulas = [];
for (const cell in sheet) {
  if (cell[0] === '!') continue;
  if (sheet[cell].f) {
    formulas.push(`${cell}: ${sheet[cell].v} => Formula: ${sheet[cell].f}`);
  }
}

console.log(`Found ${formulas.length} formulas.`);
// Limit output to prevent massive spam
formulas.slice(0, 50).forEach(f => console.log(f));
