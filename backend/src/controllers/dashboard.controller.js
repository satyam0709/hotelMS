const service = require("../services/dashboard.service");
const { sendSuccess } = require("../utils/response");

const query = (req) => req.validatedQuery || req.query;

async function overview(req, res) {
  return sendSuccess(res, await service.overview(query(req), req.admin));
}

module.exports = { overview };
