const service = require("../services/activity.service");
const { sendSuccess } = require("../utils/response");

const query = (req) => req.validatedQuery || req.query;

async function listActivity(req, res) {
  return sendSuccess(res, await service.listActivity(query(req)));
}

module.exports = { listActivity };
