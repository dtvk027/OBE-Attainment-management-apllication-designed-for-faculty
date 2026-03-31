/**
 * Calculates direct attainment based on raw marks and template configuration.
 * Pure function with no side effects.
 *
 * @param {Array} students - Array of student objects: { id, regNumber, marks: [] }
 *    where marks is an array of { assessmentId, coCode, maxMarks, marksObtained }
 * @param {Object} template - Template configuration containing assessmentGroups, coCount, thresholds
 * @returns {Object} Computed attainment metrics
 */
function calcDirectAttainment(students, template) {
  const coList = Array.from({ length: template.coCount }, (_, i) => `CO${i + 1}`);

  // Parse assessment groups if it's a string
  const groups = typeof template.assessmentGroups === 'string'
    ? JSON.parse(template.assessmentGroups)
    : template.assessmentGroups;

  const thresholds = typeof template.attainmentThresholds === 'string'
    ? JSON.parse(template.attainmentThresholds)
    : template.attainmentThresholds;

  const targetPercentage = template.targetPercentage || 60;

  // 1. Identify max marks per assessment + CO from template
  // To keep it dynamic, we look at the provided marks from the first student 
  // or define them solely from the groups if provided in the template.
  // Actually, we should extract max marks from the raw marks array since that's what's uploaded.
  
  // Create a map of maxMarks per assessment+CO for easier reference later
  const maxMarksMap = {}; // "assessmentId_COx" -> maxMark
  students.forEach(student => {
    student.marks.forEach(m => {
      const key = `${m.assessmentId}_${m.coCode}`;
      if (!maxMarksMap[key] || maxMarksMap[key] < m.maxMarks) {
        maxMarksMap[key] = m.maxMarks;
      }
    });
  });

  const internalAssessments = groups.internal.map(g => g.id.toLowerCase().trim());
  const endSemId = groups.end_semester.id.toLowerCase().trim();

  // Process each student
  const studentResults = students.map(student => {
    const studentData = {
      id: student.id,
      regNumber: student.regNumber,
      internal: {},   // by CO
      endSem: {},     // by CO
      combined: {},   // by CO
      inSemTotal: 0,
      endExamTotal: 0,
      finalTotal: 0
    };

    coList.forEach(co => {
      // Internal CO-wise Total (SUMIF)
      const internalMarks = student.marks.filter(m => 
        m.coCode === co && 
        m.assessmentId && 
        internalAssessments.includes(m.assessmentId.toLowerCase().trim()) && 
        m.marksObtained !== null
      );
      const internalCoTotal = internalMarks.reduce((sum, m) => sum + (m.marksObtained || 0), 0);

      // End Semester CO-wise Total
      const endSemMarkObj = student.marks.find(m => 
        m.coCode === co && 
        m.assessmentId && 
        m.assessmentId.toLowerCase().trim() === endSemId && 
        m.marksObtained !== null
      );
      const endSemCo = endSemMarkObj ? endSemMarkObj.marksObtained : 0;

      studentData.internal[co] = internalCoTotal;
      studentData.endSem[co] = endSemCo;
      studentData.combined[co] = internalCoTotal + endSemCo;

      studentData.inSemTotal += internalCoTotal;
      studentData.endExamTotal += endSemCo;
      studentData.finalTotal += (internalCoTotal + endSemCo);
    });

    return studentData;
  });

  // Calculate Column Max Marks
  const columnMaxMarks = {
    internal: {},
    internal_raw: {}, // assessmentId_CO -> maxMark
    endSem: {},
    combined: {}
  };

  coList.forEach(co => {
    // Internal Max Total per CO = Sum of Max Marks for all internal assessments for this CO
    let internalMax = 0;
    internalAssessments.forEach(assId => {
      const key = `${assId}_${co}`;
      const mark = maxMarksMap[key];
      if (mark) {
        internalMax += mark;
        columnMaxMarks.internal_raw[key] = mark;
      }
    });
    
    // End Sem Max per CO
    const endSemMax = maxMarksMap[`${endSemId}_${co}`] || 0;

    columnMaxMarks.internal[co] = internalMax;
    columnMaxMarks.endSem[co] = endSemMax;
    columnMaxMarks.combined[co] = internalMax + endSemMax;
  });

  // Helper to calculate attainment metrics for a specific dataset
  const calcMetrics = (dataExtractor, maxMarksObj) => {
    const results = {};
    coList.forEach(co => {
      const maxMark = maxMarksObj[co];
      // Note: If a CO is not tested at all, maxMark will be 0.
      if (!maxMark || maxMark === 0) {
        results[co] = { maxMark: 0, attempted: 0, targetMet: 0, percentage: 0, level: 'NA' };
        return;
      }

      const target = maxMark * (targetPercentage / 100);
      let attempted = 0;
      let targetMet = 0;

      studentResults.forEach(student => {
        const val = dataExtractor(student, co);
        // Only count if student actually has data (greater than -1 in excel, here we check if > 0 or has data)
        // We assume 0 is a valid attempted mark. Null means absent/not attempted.
        // For simplicity, Excel logic COUNTIF(> -1) means any non-negative number is an attempt.
        if (val !== null && val >= 0) {
          attempted++;
          if (val >= target) {
            targetMet++;
          }
        }
      });

      const percentage = attempted === 0 ? 0 : (targetMet / attempted) * 100;
      
      let level = 0;
      if (attempted === 0) {
        level = 'NA';
      } else if (percentage >= thresholds.level_3) {
        level = 3;
      } else if (percentage >= thresholds.level_2) {
        level = 2;
      } else if (percentage >= thresholds.level_1) {
        level = 1;
      }

      results[co] = {
        maxMark,
        attempted,
        targetMet,
        percentage: Number(percentage.toFixed(2)),
        level
      };
    });
    return results;
  };

  const summary = {
    internal: calcMetrics((s, co) => s.internal[co], columnMaxMarks.internal),
    endSem: calcMetrics((s, co) => s.endSem[co], columnMaxMarks.endSem),
    combined: calcMetrics((s, co) => s.combined[co], columnMaxMarks.combined)
  };

  return {
    studentResults,
    columnMaxMarks,
    summary
  };
}

module.exports = {
  calcDirectAttainment
};
