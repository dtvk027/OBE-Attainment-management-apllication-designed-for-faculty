const { calcDirectAttainment } = require('./direct-attainment');
const { calcIndirectAttainment } = require('./indirect-attainment');
const { calcCombinedAttainment } = require('./combined-attainment');
const { calcPOAttainment } = require('./po-pso-attainment');

module.exports = {
  calcDirectAttainment,
  calcIndirectAttainment,
  calcCombinedAttainment,
  calcPOAttainment,
};
