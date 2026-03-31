/**
 * Calculates indirect attainment based on survey responses.
 * Pure function with no side effects.
 *
 * @param {Array} surveyResponses - Array of objects: { coCode, excellentCount, satisfactoryCount, averageCount, totalParticipants }
 * @param {Object} template - Template config containing surveyGrading { excellent: 3, satisfactory: 2, average: 1 }
 * @returns {Object} Computed indirect attainment per CO
 */
function calcIndirectAttainment(surveyResponses, template) {
  const grading = typeof template.surveyGrading === 'string'
    ? JSON.parse(template.surveyGrading)
    : template.surveyGrading;

  const results = {};

  surveyResponses.forEach(res => {
    // If no participants, it's 0 or NA
    if (!res.totalParticipants || res.totalParticipants === 0) {
      results[res.coCode] = { attainmentLevel: 'NA' };
      return;
    }

    const totalWeight =
      (res.excellentCount * grading.excellent) +
      (res.satisfactoryCount * grading.satisfactory) +
      (res.averageCount * grading.average);

    const average = totalWeight / res.totalParticipants;

    // Excel formula: ROUNDUP(avg, 1) -> maps to Math.ceil(number * 10) / 10
    const attainmentLevel = Math.ceil(average * 10) / 10;

    results[res.coCode] = {
      attainmentLevel: Number(attainmentLevel.toFixed(1))
    };
  });

  return results;
}

module.exports = {
  calcIndirectAttainment
};
