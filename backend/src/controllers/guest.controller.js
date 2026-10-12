const service = require("../services/guest.service");
const { sendSuccess } = require("../utils/response");

const query = (req) => req.validatedQuery || req.query;
const params = (req) => req.validatedParams || req.params;
const body = (req) => req.validatedBody || req.body;

async function listGuests(req, res) {
  return sendSuccess(res, await service.listGuests(query(req)));
}

async function getGuest(req, res) {
  return sendSuccess(res, await service.getGuest(params(req).id));
}

async function updateGuest(req, res) {
  return sendSuccess(res, await service.updateGuest(params(req).id, body(req), req));
}

async function deleteGuest(req, res) {
  return sendSuccess(res, await service.deleteGuest(params(req).id, req));
}

module.exports = {
  listGuests,
  getGuest,
  updateGuest,
  deleteGuest,
};
