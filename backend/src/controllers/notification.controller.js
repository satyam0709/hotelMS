const service = require("../services/notification.service");
const { sendSuccess } = require("../utils/response");

const query = (req) => req.validatedQuery || req.query;
const params = (req) => req.validatedParams || req.params;
const body = (req) => req.validatedBody || req.body;

async function getSettings(req, res) {
  return sendSuccess(res, await service.getSettings());
}

async function updateSettings(req, res) {
  return sendSuccess(res, await service.updateSettings(body(req), req));
}

async function listEmailLogs(req, res) {
  return sendSuccess(res, await service.listEmailLogs(query(req)));
}

async function listEmailTemplates(req, res) {
  return sendSuccess(res, await service.listEmailTemplates());
}

async function getEmailTemplate(req, res) {
  return sendSuccess(res, await service.getEmailTemplate(params(req).id));
}

async function updateEmailTemplate(req, res) {
  return sendSuccess(res, await service.updateEmailTemplate(params(req).id, body(req), req));
}

async function sendTestEmail(req, res) {
  return sendSuccess(res, await service.testEmail(body(req), req), "Test email dispatched.");
}

async function resendEmailLog(req, res) {
  return sendSuccess(res, await service.resendEmailLog(params(req).id, req), "Email retry initiated.");
}

module.exports = {
  getSettings,
  updateSettings,
  listEmailLogs,
  listEmailTemplates,
  getEmailTemplate,
  updateEmailTemplate,
  sendTestEmail,
  resendEmailLog,
};
