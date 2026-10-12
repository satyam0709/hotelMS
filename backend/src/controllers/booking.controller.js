const service = require("../services/booking.service");
const { sendSuccess } = require("../utils/response");

const params = (req) => req.validatedParams || req.params;
const query = (req) => req.validatedQuery || req.query;

async function createPublicBooking(req, res) {
  return sendSuccess(res, await service.createPublicBooking(req.body, req), "Booking created.");
}

async function getPublicBooking(req, res) {
  return sendSuccess(res, await service.getPublicBooking(params(req).bookingRef, query(req)));
}

async function listAdminBookings(req, res) {
  return sendSuccess(res, await service.listAdminBookings(query(req)));
}

async function getAdminBooking(req, res) {
  return sendSuccess(res, await service.getAdminBooking(params(req).id));
}

async function createAdminBooking(req, res) {
  return sendSuccess(res, await service.createAdminBooking(req.body, req), "Booking created.");
}

async function updateBookingStatus(req, res) {
  return sendSuccess(res, await service.updateBookingStatus(params(req).id, req.body, req));
}

async function cancelAdminBooking(req, res) {
  return sendSuccess(res, await service.cancelBooking(params(req).id, req.body, req, { isAdmin: true }));
}

async function requestGuestCancellation(req, res) {
  return sendSuccess(
    res,
    await service.requestGuestCancellation(params(req).bookingRef, req.body, req),
    "Booking cancelled.",
  );
}

module.exports = {
  cancelAdminBooking,
  createAdminBooking,
  createPublicBooking,
  getAdminBooking,
  getPublicBooking,
  listAdminBookings,
  requestGuestCancellation,
  updateBookingStatus,
};
