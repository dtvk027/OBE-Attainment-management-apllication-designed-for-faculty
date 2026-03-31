const xlsx = require('xlsx');

class Exporter {
  /**
   * Generates an Excel workbook from the database/calculated state
   * @param {Object} subject - DB Subject object
   * @param {Object} calculatedData - output from calc engine
   * @returns {Buffer} - The generated .xlsx file buffer
   */
  static exportAll(subject, calculatedData) {
    const wb = xlsx.utils.book_new();
    
    // Create a simplified flattened marks & attainment export
    // In future this can perfectly replicate the 6-sheet template if needed.
    // For now, providing a 1-sheet summary of Attainment for easy faculty access.
    
    const rows = [];
    rows.push(["Registration Number", ...subject.template.coCount ? Array.from({length: subject.template.coCount}, (_, i) => `CO${i+1} Internal Total`) : [], 
               ...subject.template.coCount ? Array.from({length: subject.template.coCount}, (_, i) => `CO${i+1} Combined Attainment`) : [],
               "Final Total"]);

    calculatedData.studentResults.forEach(student => {
      const row = [student.regNumber];
      
      // Internal
      for (let i = 1; i <= subject.template.coCount; i++) {
        row.push(student.internal[`CO${i}`] ?? null);
      }
      
      // Combined
      for (let i = 1; i <= subject.template.coCount; i++) {
        row.push(student.combined[`CO${i}`] ?? null);
      }
      
      row.push(student.finalTotal);
      rows.push(row);
    });

    const summaryDataSheet = xlsx.utils.aoa_to_sheet(rows);
    xlsx.utils.book_append_sheet(wb, summaryDataSheet, "Attainment Summary");
    
    // Add CO-PO mappings
    const poRows = [["CO Code", "PO Code", "Mapping Value"]];
    if (subject.coPOMappings) {
      subject.coPOMappings.forEach(m => {
        poRows.push([m.coCode, m.poCode, m.mappingValue]);
      });
    }
    const poSheet = xlsx.utils.aoa_to_sheet(poRows);
    xlsx.utils.book_append_sheet(wb, poSheet, "PO-PSO Mappings");

    // Produce buffer
    const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
    return buffer;
  }
}

module.exports = Exporter;
