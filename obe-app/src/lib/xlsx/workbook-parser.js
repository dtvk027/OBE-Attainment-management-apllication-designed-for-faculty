const xlsx = require('xlsx');

class WorkbookParser {
  /**
   * Search for a cell with a specific substring value in the given sheet
   */
  static findCell(sheet, searchText, maxRows = 50, maxCols = 10) {
    if (!sheet) return null;
    const lowerSearch = String(searchText).toLowerCase();
    
    for (let r = 0; r < maxRows; r++) {
      for (let c = 0; c < maxCols; c++) {
        const cellAddress = xlsx.utils.encode_cell({ c, r });
        const cell = sheet[cellAddress];
        if (cell && cell.v !== undefined && cell.v !== null) {
          if (String(cell.v).toLowerCase().includes(lowerSearch)) {
            return { c, r, value: String(cell.v) };
          }
        }
      }
    }
    return null;
  }

  static parse(fileData, template) {
    const defaultTemplateGroups = typeof template.assessmentGroups === 'string'
      ? JSON.parse(template.assessmentGroups)
      : template.assessmentGroups;

    const workbook = typeof fileData === 'string' 
      ? xlsx.readFile(fileData) 
      : xlsx.read(fileData, { type: 'buffer' });

    // 1. Parse Introductory Metadata
    const introSheet = workbook.Sheets["Introductory"];
    const metadata = {
      academicYear: null,
      courseCode: null,
      courseName: null,
      facultyName: null,
      semester: null,
      section: null,
      coStatements: {}
    };

    if (introSheet) {
      const yearCell = this.findCell(introSheet, 'Academic Year');
      const codeCell = this.findCell(introSheet, 'Course Code');
      const nameCell = this.findCell(introSheet, 'Course Name');
      const progCell = this.findCell(introSheet, 'Program Name');
      
      // Usually the value is in the adjacent column
      if (yearCell) metadata.academicYear = introSheet[xlsx.utils.encode_cell({ c: yearCell.c + 1, r: yearCell.r })]?.v;
      if (codeCell) metadata.courseCode = introSheet[xlsx.utils.encode_cell({ c: codeCell.c + 1, r: codeCell.r })]?.v;
      if (nameCell) metadata.courseName = introSheet[xlsx.utils.encode_cell({ c: nameCell.c + 1, r: nameCell.r })]?.v;

      // Extract CO statements dynamically
      for (let i = 1; i <= template.coCount; i++) {
        const coLabel = `CO${i}`;
        const coCell = this.findCell(introSheet, coLabel + ':');
        if (coCell) {
          metadata.coStatements[coLabel] = String(coCell.value).substring(coLabel.length + 1).trim() || 
            introSheet[xlsx.utils.encode_cell({ c: coCell.c + 1, r: coCell.r })]?.v;
        }
      }
    }

    // 2. Parse Direct Attainment (Marks)
    const directSheet = workbook.Sheets["CO-Direct Attain"];
    const columnMapping = []; // Array of { colIndex, assessmentId, coCode }
    
    // In template: Mid-01 typically B-F (1-5), EndSem AC-AG (28-32)
    let currentColIdx = 1; // Default
    defaultTemplateGroups.internal.forEach(group => {
      group.co_columns.forEach(co => {
        columnMapping.push({ colIndex: currentColIdx, assessmentId: group.id, coCode: co });
        currentColIdx++;
      });
    });

    currentColIdx = 28; // End Sem starting column as seen in Excel analysis
    defaultTemplateGroups.end_semester.co_columns.forEach(co => {
      columnMapping.push({ colIndex: currentColIdx, assessmentId: defaultTemplateGroups.end_semester.id, coCode: co });
      currentColIdx++;
    });

    const maxMarks = {};
    const maxMarkRow = 3; // Row 4 (0-indexed 3)
    columnMapping.forEach(mapping => {
      const cellAddress = xlsx.utils.encode_cell({ c: mapping.colIndex, r: maxMarkRow });
      const cell = directSheet[cellAddress];
      maxMarks[`${mapping.assessmentId}_${mapping.coCode}`] = cell ? Number(cell.v) : 0;
    });

    const students = [];
    const startRowIdx = 5; // Rows 6->71
    for (let r = startRowIdx; r <= 150; r++) { // Iterate until blank
      const regCell = directSheet[xlsx.utils.encode_cell({ c: 0, r })]; // Col A for Reg Number
      if (!regCell || !regCell.v || String(regCell.v).trim() === '') break;

      const regNumber = String(regCell.v).trim();
      const studentMarks = [];

      columnMapping.forEach(mapping => {
        const cell = directSheet[xlsx.utils.encode_cell({ c: mapping.colIndex, r })];
        let val = null;
        if (cell && cell.v !== undefined && cell.v !== null && String(cell.v).trim() !== '') {
          val = Number(cell.v);
        }
        
        studentMarks.push({
          assessmentId: mapping.assessmentId,
          coCode: mapping.coCode,
          maxMarks: maxMarks[`${mapping.assessmentId}_${mapping.coCode}`],
          marksObtained: val
        });
      });

      students.push({ regNumber, marks: studentMarks });
    }

    // 3. Parse Indirect Attainment (Survey)
    const indirectSheet = workbook.Sheets["CO-Indirect Attainment"];
    const surveyResponses = [];
    if (indirectSheet) {
      for (let i = 1; i <= template.coCount; i++) {
        const coCode = `CO${i}`;
        const cell = this.findCell(indirectSheet, coCode);
        if (cell) {
          // Typically Excellent, Satisfactory, Average, Total are arranged in adjacent columns C, D, E, F/G
          // Usually CO1 is in col B, or A. Let's look adjacent to where it was found
          surveyResponses.push({
            coCode: coCode,
            excellentCount: Number(indirectSheet[xlsx.utils.encode_cell({ c: cell.c + 1, r: cell.r })]?.v || 0),
            satisfactoryCount: Number(indirectSheet[xlsx.utils.encode_cell({ c: cell.c + 2, r: cell.r })]?.v || 0),
            averageCount: Number(indirectSheet[xlsx.utils.encode_cell({ c: cell.c + 3, r: cell.r })]?.v || 0),
            // Total might be in +4 or computed. Excel might skip a column.
            totalParticipants: Number(indirectSheet[xlsx.utils.encode_cell({ c: cell.c + 4, r: cell.r })]?.v || 
                                     indirectSheet[xlsx.utils.encode_cell({ c: cell.c + 5, r: cell.r })]?.v || 0)
          });
        }
      }
    }

    // 4. Parse PO-PSO Mappings
    const poSheet = workbook.Sheets["PO-PSO DirectAttainment"];
    const coPoMappings = [];
    if (poSheet) {
      // Find where PO headers are (usually row 3/4)
      let poHeaders = [];
      for (let r = 0; r < 10; r++) {
        for (let c = 0; c < 20; c++) {
          const headerCell = poSheet[xlsx.utils.encode_cell({ c, r })];
          if (headerCell && typeof headerCell.v === 'string' && headerCell.v.match(/^(PO\d|PSO\d)/)) {
            poHeaders.push({ colIndex: c, poCode: String(headerCell.v).trim(), r });
          }
        }
      }

      for (let i = 1; i <= template.coCount; i++) {
        const coCode = `CO${i}`;
        const cell = this.findCell(poSheet, coCode);
        if (cell) {
          poHeaders.forEach(header => {
            // Mapping values should be on the same row as the CO label
            const valCell = poSheet[xlsx.utils.encode_cell({ c: header.colIndex, r: cell.r })];
            // Treat empty/null as no mapping (undefined). Excel might have 1, 2, 3 values or string.
            if (valCell && (Number(valCell.v) > 0)) {
              coPoMappings.push({
                coCode: coCode,
                poCode: header.poCode,
                mappingValue: Number(valCell.v)
              });
            }
          });
        }
      }
    }

    return {
      metadata,
      students,
      surveyResponses,
      coPoMappings
    };
  }
}

module.exports = WorkbookParser;
