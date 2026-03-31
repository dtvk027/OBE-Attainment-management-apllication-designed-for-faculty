/**
 * Calculates PO and PSO attainment.
 * Pure function with no side effects.
 *
 * @param {Object} combinedAttainment - Output from calcCombinedAttainment e.g. { CO1: { attainmentLevel: 2.97 } }
 * @param {Array} coPoMappings - Array of objects: { coCode, poCode, mappingValue }
 * @param {Object} template - containing poCount, psoCount or we can derive dynamically
 * @returns {Object} Computed PO/PSO attainment summary
 */
function calcPOAttainment(combinedAttainment, coPoMappings, template) {
  const poCount = template.poCount || 12;
  const psoCount = template.psoCount || 3;

  const poList = Array.from({ length: poCount }, (_, i) => `PO${i + 1}`);
  const psoList = Array.from({ length: psoCount }, (_, i) => `PSO${i + 1}`);
  const allPos = [...poList, ...psoList];

  const articulationStats = {};
  const attainment = {};

  // Part A: Articulation Matrix Stats
  allPos.forEach(po => {
    // find all mappings for this PO > 0
    const mappings = coPoMappings.filter(m => m.poCode === po && m.mappingValue > 0);
    const count = mappings.length;
    let sum = 0;
    
    if (count > 0) {
      sum = mappings.reduce((acc, m) => acc + m.mappingValue, 0);
      const avg = sum / count;
      articulationStats[po] = {
        sum,
        count,
        // Excel: ROUNDUP(sum/count, 1) or basically ROUNDUP to 1 dec digit
        average: Math.ceil(avg * 10) / 10
      };
    } else {
      articulationStats[po] = { sum: 0, count: 0, average: 0 };
    }
  });

  // Part B: PO Direct Attainment per PO
  allPos.forEach(po => {
    let poTotal = 0;
    const coContributions = {};

    Object.keys(combinedAttainment).forEach(co => {
      const mappingObj = coPoMappings.find(m => m.poCode === po && m.coCode === co);
      const mappingValue = mappingObj ? mappingObj.mappingValue : 0;
      
      const coVal = combinedAttainment[co];
      const coCombinedAtt = coVal && coVal.attainmentLevel !== 'NA' ? coVal.attainmentLevel : 0;

      if (mappingValue > 0 && articulationStats[po].sum > 0) {
        // Excel formula for specific cell: ROUND(co_total_attainment * mapping_value / sum_of_mapping, 2)
        const contribution = Math.round((coCombinedAtt * mappingValue / articulationStats[po].sum) * 100) / 100;
        coContributions[co] = contribution;
        poTotal += contribution;
      } else {
        coContributions[co] = null; // empty cell
      }
    });

    attainment[po] = {
      coContributions,
      total: poTotal > 0 ? Number(poTotal.toFixed(2)) : 0
    };
  });

  return {
    articulationStats,
    attainment
  };
}

module.exports = {
  calcPOAttainment
};
