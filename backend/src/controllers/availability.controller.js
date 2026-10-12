const service = require("../services/availability.service");
const { sendSuccess } = require("../utils/response");

async function searchAvailability(req, res) {
  const query = req.validatedQuery || req.query;
  return sendSuccess(res, await service.searchAvailability(query));
}

module.exports = {
  searchAvailability,
};
