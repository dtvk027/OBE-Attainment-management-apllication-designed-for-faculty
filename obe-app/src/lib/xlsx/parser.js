const WorkbookParser = require('./workbook-parser');
const AssessmentParser = require('./assessment-parser');
const xlsx = require('xlsx');

class MainParser {
  /**
   * Reads the file and detects whether it is a Full OBE Workbook or a Single Assessment
   */
  static parse(fileData, options = {}) {
    const workbook = typeof fileData === 'string' 
      ? xlsx.readFile(fileData) 
      : xlsx.read(fileData, { type: 'buffer' });

    // Detect format based on sheets
    const hasIntroSheet = workbook.SheetNames.includes("Introductory");
    const hasDirectSheet = workbook.SheetNames.includes("CO-Direct Attain");

    if (hasIntroSheet && hasDirectSheet) {
      if (!options.template) {
        throw new Error("Template must be provided to parse a full OBE Workbook");
      }
      return {
        type: 'full_workbook',
        data: WorkbookParser.parse(workbook, options.template)
      };
    } else {
      // Treat as single assessment
      return {
        type: 'single_assessment',
        data: AssessmentParser.parse(workbook)
      };
    }
  }
}

module.exports = MainParser;
