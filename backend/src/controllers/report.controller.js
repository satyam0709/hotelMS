const service = require("../services/report.service");
const { sendSuccess } = require("../utils/response");

const query = (req) => req.validatedQuery || req.query;

async function overview(req, res) {
  return sendSuccess(res, await service.overview(query(req)));
}

async function exportCsv(req, res) {
  return service.exportReport(res, query(req), req);
}

module.exports = { overview, exportCsv };
