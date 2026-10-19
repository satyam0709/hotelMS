const service = require("../services/restaurantReservation.service");
const { sendSuccess } = require("../utils/response");

const params = (req) => req.validatedParams || req.params;
const query = (req) => req.validatedQuery || req.query;

async function createPublicReservation(req, res) {
  const result = await service.createPublicReservation(req.body);
  return sendSuccess(res, result, "Reservation request received. The restaurant will contact you to confirm.");
}

async function listAdminReservations(req, res) {
  return sendSuccess(res, await service.listAdminReservations(query(req)));
}

async function getAdminReservation(req, res) {
  return sendSuccess(res, await service.getAdminReservation(params(req).id));
}

async function updateAdminReservationStatus(req, res) {
  const result = await service.updateAdminReservationStatus(params(req).id, req.body, req);
  return sendSuccess(res, result, "Reservation status updated.");
}

module.exports = {
  createPublicReservation,
  getAdminReservation,
  listAdminReservations,
  updateAdminReservationStatus,
};
