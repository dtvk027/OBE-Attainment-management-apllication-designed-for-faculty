const xlsx = require('xlsx');

class AssessmentParser {
  /**
   * Parse a single-assessment file like Quiz-2.xlsx
   * @param {Buffer|String} fileData - The file buffer or path
   * @returns {Array} Extracted student marks for this specific assessment
   */
  static parse(fileData) {
    let workbook;
    if (fileData && fileData.SheetNames) {
      // Already a workbook object
      workbook = fileData;
    } else {
      workbook = typeof fileData === 'string' 
        ? xlsx.readFile(fileData) 
        : xlsx.read(fileData, { type: 'buffer' });
    }

    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // Method 1: Try with header labels
    const rowsWithHeaders = xlsx.utils.sheet_to_json(sheet, { defval: null });
    let results = this.parseWithHeaders(rowsWithHeaders);

    // Method 2: Heuristic detection if Method 1 fails (common in exports without headers)
    if (results.length === 0) {
      const rawRows = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: null });
      results = this.parseHeuristically(rawRows);
    }

    return results;
  }

  static parseWithHeaders(rows) {
    const results = [];
    for (const row of rows) {
      const normalizedRow = {};
      for (const [key, val] of Object.entries(row)) {
        normalizedRow[String(key).trim().toLowerCase()] = val;
      }

      const regNoRaw = normalizedRow['regdno'] || normalizedRow['regd_no'] || normalizedRow['reg.no'] || normalizedRow['registration number'] || normalizedRow['roll no'] || normalizedRow['id'];
      const regNumber = regNoRaw ? String(regNoRaw).trim() : null;

      const markRaw = normalizedRow['marks'] || normalizedRow['marks obtained'] || normalizedRow['score'] || normalizedRow['total'];
      let mark = null;
      if (markRaw !== undefined && markRaw !== null && String(markRaw).trim() !== '') {
        mark = Number(markRaw);
      }

      const maxMarkRaw = normalizedRow['max_marks'] || normalizedRow['max marks'] || normalizedRow['maximum marks'] || normalizedRow['out of'];
      let maxMark = null;
      if (maxMarkRaw !== undefined && maxMarkRaw !== null && String(maxMarkRaw).trim() !== '') {
        maxMark = Number(maxMarkRaw);
      }

      if (regNumber && !isNaN(mark)) {
        results.push({
          regNumber,
          maxMarks: maxMark,
          marksObtained: mark,
          rawRow: row
        });
      }
    }
    return results;
  }

  static parseHeuristically(rows) {
    if (rows.length === 0) return [];
    
    // Heuristic: Find the ID column
    // Usually the first column with alphanumeric strings of length 5-15
    let idCol = -1;
    let markCol = -1;
    
    // Look for ID in first 2 columns
    for (let c = 0; c <= 1; c++) {
        const sample = rows.find(r => r[c] && String(r[c]).length >= 5 && /^[A-Z0-9.\-]+$/i.test(String(r[c])));
        if (sample) {
            idCol = c;
            break;
        }
    }

    // Look for Marks (last numeric column)
    const lastRow = rows.find(r => r.some(v => typeof v === 'number'));
    if (lastRow) {
        for (let c = lastRow.length - 1; c >= 0; c--) {
            if (typeof lastRow[c] === 'number' && c !== idCol) {
                markCol = c;
                break;
            }
        }
    }

    if (idCol === -1) return [];

    const results = [];
    for (const row of rows) {
        const regNumber = String(row[idCol] || '').trim();
        const mark = markCol !== -1 ? Number(row[markCol]) : null;
        
        if (regNumber && regNumber.length >= 5 && !isNaN(mark) && mark !== null) {
            results.push({
                regNumber,
                maxMarks: null, // Heuristic can't easily distinguish max from obtained if both present
                marksObtained: mark,
                rawRow: row
            });
        }
    }
    return results;
  }
}

module.exports = AssessmentParser;
