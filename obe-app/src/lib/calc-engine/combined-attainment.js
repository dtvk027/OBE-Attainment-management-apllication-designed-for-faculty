/**
 * Calculates combined attainment from direct and indirect results.
 * Pure function with no side effects.
 *
 * @param {Object} directSummary - e.g. { CO1: { level: 3 }, CO2: { level: 2 } }
 * @param {Object} indirectSummary - e.g. { CO1: { attainmentLevel: 2.7 } }
 * @param {Object} template - contains directWeightage and indirectWeightage
 * @returns {Object} Computed combined attainment per CO
 */
function calcCombinedAttainment(directSummary, indirectSummary, template) {
  const directW = template.directWeightage || 0.8;
  const indirectW = template.indirectWeightage || 0.2;

  const results = {};

  // Assuming directSummary contains keys like CO1, CO2
  Object.keys(directSummary).forEach(co => {
    const directLvl = directSummary[co].level;
    const indirectEntry = indirectSummary[co];
    const indirectLvl = indirectEntry && indirectEntry.attainmentLevel !== 'NA'
      ? indirectEntry.attainmentLevel : 0;

    if (directLvl === 'NA') {
      results[co] = { attainmentLevel: 'NA', direct: 'NA', indirect: indirectLvl };
      return;
    }

    const total = (directLvl * directW) + (indirectLvl * indirectW);
    // Usually Excel rounds combined to 2 decimals
    results[co] = {
      direct: directLvl,
      indirect: indirectLvl,
      attainmentLevel: Number(total.toFixed(2))
    };
  });

  return results;
}

module.exports = {
  calcCombinedAttainment
};
