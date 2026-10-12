const AppError = require("../utils/appError");
const { sendFailure } = require("../utils/response");

function notFoundHandler(req, res, next) {
  next(new AppError(404, "Route not found.", "NOT_FOUND"));
}

function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);

  const statusCode = Number.isInteger(error.statusCode) ? error.statusCode : 500;
  if (statusCode >= 500) console.error(error);

  const message = statusCode >= 500 && process.env.NODE_ENV === "production"
    ? "Internal server error."
    : error.message || "Internal server error.";
  const errorCode = statusCode >= 500
    ? "INTERNAL_SERVER_ERROR"
    : error.errorCode || "REQUEST_ERROR";

  return sendFailure(res, statusCode, message, errorCode, error.details);
}

module.exports = { errorHandler, notFoundHandler };