const test = require('node:test');
const assert = require('node:assert');

const {
  calcDirectAttainment,
  calcIndirectAttainment,
  calcCombinedAttainment,
  calcPOAttainment
} = require('../index');

// Mock template matching the Excel config
const mockTemplate = {
  coCount: 5,
  poCount: 12,
  psoCount: 3,
  targetPercentage: 60,
  attainmentThresholds: { level_3: 70, level_2: 60, level_1: 50 },
  directWeightage: 0.9,
  indirectWeightage: 0.1,
  surveyGrading: { excellent: 3, satisfactory: 2, average: 1 },
  assessmentGroups: {
    internal: [
      { id: "mid_01", label: "Mid-01" },
      { id: "mid_02", label: "Mid-02" },
      { id: "quiz", label: "Quiz" },
      { id: "assignment", label: "Assignment" }
    ],
    end_semester: { id: "end_sem", label: "End Examination" }
  }
};

test('calcDirectAttainment computes exact internal and end sem totals properly', (t) => {
  // Scenario matching a single student row with some blank columns, and marks exactly as defined
  // Max marks Mid1(15), Mid2(15), Quiz(20), Assign(20), EndSem(30)
  const students = [
    {
      id: 1, regNumber: "S001", marks: [
        // Mid-01 tests CO1, CO2
        { assessmentId: 'mid_01', coCode: 'CO1', maxMarks: 15, marksObtained: 12 },
        { assessmentId: 'mid_01', coCode: 'CO2', maxMarks: 15, marksObtained: 10 },
        // Mid-02 tests CO3, CO4, CO5
        { assessmentId: 'mid_02', coCode: 'CO3', maxMarks: 15, marksObtained: 14 },
        { assessmentId: 'mid_02', coCode: 'CO4', maxMarks: 15, marksObtained: 11 },
        { assessmentId: 'mid_02', coCode: 'CO5', maxMarks: 15, marksObtained: 13 },
        // Quiz covers all 5 COs
        { assessmentId: 'quiz', coCode: 'CO1', maxMarks: 20, marksObtained: 16 },
        { assessmentId: 'quiz', coCode: 'CO2', maxMarks: 20, marksObtained: 18 },
        { assessmentId: 'quiz', coCode: 'CO3', maxMarks: 20, marksObtained: 12 },
        { assessmentId: 'quiz', coCode: 'CO4', maxMarks: 20, marksObtained: 17 },
        { assessmentId: 'quiz', coCode: 'CO5', maxMarks: 20, marksObtained: 15 },
        // Assign covers all 5 COs
        { assessmentId: 'assignment', coCode: 'CO1', maxMarks: 20, marksObtained: 18 },
        { assessmentId: 'assignment', coCode: 'CO2', maxMarks: 20, marksObtained: 19 },
        { assessmentId: 'assignment', coCode: 'CO3', maxMarks: 20, marksObtained: 16 },
        { assessmentId: 'assignment', coCode: 'CO4', maxMarks: 20, marksObtained: 14 },
        { assessmentId: 'assignment', coCode: 'CO5', maxMarks: 20, marksObtained: 17 },
        // End Exam (as observed, same marks distributed to all CO columns) 
        // Example: Exam total was 24 out of 30, distributed as 4.8 per CO.
        { assessmentId: 'end_sem', coCode: 'CO1', maxMarks: 6, marksObtained: 4.8 },
        { assessmentId: 'end_sem', coCode: 'CO2', maxMarks: 6, marksObtained: 4.8 },
        { assessmentId: 'end_sem', coCode: 'CO3', maxMarks: 6, marksObtained: 4.8 },
        { assessmentId: 'end_sem', coCode: 'CO4', maxMarks: 6, marksObtained: 4.8 },
        { assessmentId: 'end_sem', coCode: 'CO5', maxMarks: 6, marksObtained: 4.8 }
      ]
    }
  ];

  const result = calcDirectAttainment(students, mockTemplate);
  
  // Checks for student computed fields
  const s1 = result.studentResults[0];
  
  // CO1 internal total = Mid1(12) + Quiz(16) + Assign(18) = 46
  assert.strictEqual(s1.internal['CO1'], 46);
  // CO1 endSem = 4.8
  assert.strictEqual(s1.endSem['CO1'], 4.8);
  // CO1 combined = 50.8
  assert.strictEqual(s1.combined['CO1'], 50.8);

  // CO3 internal = Mid2(14) + Quiz(12) + Assign(16) = 42
  assert.strictEqual(s1.internal['CO3'], 42);

  // Check column max marks mapping
  // Internal CO1 max = Mid1(15) + Quiz(20) + Assign(20) = 55
  assert.strictEqual(result.columnMaxMarks.internal['CO1'], 55);
  // EndSem CO1 max = 6
  assert.strictEqual(result.columnMaxMarks.endSem['CO1'], 6);
  // Combined CO1 max = 61
  assert.strictEqual(result.columnMaxMarks.combined['CO1'], 61);

  // Summary Metrics check for CO1
  // Max=55, Target 60% of 55 = 33
  // Since student scored 46, they met target.
  assert.strictEqual(result.summary.internal['CO1'].attempted, 1);
  assert.strictEqual(result.summary.internal['CO1'].targetMet, 1);
  assert.strictEqual(result.summary.internal['CO1'].percentage, 100);
  assert.strictEqual(result.summary.internal['CO1'].level, 3);
});

test('calcIndirectAttainment applies Excel ROUNDUP properly', (t) => {
  const responses = [
    { coCode: 'CO1', excellentCount: 40, satisfactoryCount: 15, averageCount: 5, totalParticipants: 60 },
    { coCode: 'CO2', excellentCount: 20, satisfactoryCount: 30, averageCount: 10, totalParticipants: 60 }
  ];

  const result = calcIndirectAttainment(responses, mockTemplate);

  // CO1: (40*3 + 15*2 + 5*1) / 60 = 155 / 60 = 2.5833 -> ceil(2.5833 * 10)/10 = 2.6
  assert.strictEqual(result['CO1'].attainmentLevel, 2.6);

  // CO2: (20*3 + 30*2 + 10*1) / 60 = 130 / 60 = 2.166 -> 2.2
  assert.strictEqual(result['CO2'].attainmentLevel, 2.2);
});

test('calcCombinedAttainment combines direct and indirect via weightages', (t) => {
  const direct = {
    'CO1': { level: 3 },
    'CO2': { level: 2 },
    'CO3': { level: 'NA' } // No students attempted
  };
  const indirect = {
    'CO1': { attainmentLevel: 2.6 },
    'CO2': { attainmentLevel: 2.2 },
    'CO3': { attainmentLevel: 2.0 }
  };

  const result = calcCombinedAttainment(direct, indirect, mockTemplate);

  // CO1: 3 * 0.9 + 2.6 * 0.1 = 2.7 + 0.26 = 2.96
  assert.strictEqual(result['CO1'].attainmentLevel, 2.96);

  // CO2: 2 * 0.9 + 2.2 * 0.1 = 1.8 + 0.22 = 2.02
  assert.strictEqual(result['CO2'].attainmentLevel, 2.02);

  // CO3: NA direct -> returns NA
  assert.strictEqual(result['CO3'].attainmentLevel, 'NA');
});

test('calcPOAttainment outputs Articulation Stats and calculations', (t) => {
  const combinedAttainment = {
    'CO1': { attainmentLevel: 2.96 },
    'CO2': { attainmentLevel: 2.02 },
    'CO3': { attainmentLevel: 'NA' },
    'CO4': { attainmentLevel: 1.50 },
    'CO5': { attainmentLevel: 1.00 }
  };

  const coPoMappings = [
    { coCode: 'CO1', poCode: 'PO1', mappingValue: 3 },
    { coCode: 'CO2', poCode: 'PO1', mappingValue: 2 },
    // CO3 mapping exists but level is NA -> shouldn't add to sum implicitly, wait Excel logic calculates denominator from Mapping existence alone
    { coCode: 'CO3', poCode: 'PO1', mappingValue: 1 }, 
    { coCode: 'CO4', poCode: 'PO2', mappingValue: 3 },
    { coCode: 'CO5', poCode: 'PO2', mappingValue: 2 }
  ];

  const result = calcPOAttainment(combinedAttainment, coPoMappings, mockTemplate);
  
  // PO1 Stats: Sum=3+2+1=6, Count=3, Avg=Math.ceil(6/3 * 10)/10 = 2.0
  assert.strictEqual(result.articulationStats['PO1'].sum, 6);
  assert.strictEqual(result.articulationStats['PO1'].average, 2.0);

  // PO1 Direct Attainment
  // CO1 contribution: 2.96 * 3 / 6 = 1.48
  // CO2 contribution: 2.02 * 2 / 6 = 0.6733 -> Math.round -> 0.67
  // CO3 contribution: NA -> acts as 0 contribution: 0 * 1 / 6 = 0
  // PO1 Total = 1.48 + 0.67 + 0 = 2.15
  assert.strictEqual(result.attainment['PO1'].coContributions['CO1'], 1.48);
  assert.strictEqual(result.attainment['PO1'].coContributions['CO2'], 0.67);
  assert.strictEqual(result.attainment['PO1'].coContributions['CO3'], 0);
  assert.strictEqual(result.attainment['PO1'].total, 2.15);
  
  // PO2 Stats: Sum=5, Count=2, Avg=Math.ceil(2.5 * 10)/10 = 2.5
  assert.strictEqual(result.articulationStats['PO2'].sum, 5);
  assert.strictEqual(result.articulationStats['PO2'].average, 2.5);

  // PO2 Attainment
  // CO4: 1.50 * 3 / 5 = 0.90
  // CO5: 1.00 * 2 / 5 = 0.40
  // PO2 Total = 1.30
  assert.strictEqual(result.attainment['PO2'].coContributions['CO4'], 0.90);
  assert.strictEqual(result.attainment['PO2'].coContributions['CO5'], 0.40);
  assert.strictEqual(result.attainment['PO2'].total, 1.3);
});
