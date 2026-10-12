const service = require("../services/report.service");
const { sendSuccess } = require("../utils/response");

const query = (req) => req.validatedQuery || req.query;

async function overview(req, res) {
  return sendSuccess(res, await service.overview(query(req)));
}

async function exportCsv(req, res) {
  const file = await service.exportCsv(query(req));
  res.setHeader("Content-Type", file.contentType);
  res.setHeader("Content-Disposition", `attachment; filename="${file.filename}"`);
  res.setHeader("Cache-Control", "no-store");
  return res.status(200).send(file.body);
}

module.exports = { overview, exportCsv };
