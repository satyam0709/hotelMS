function sendSuccess(res, data, message) {
  const body = { success: true, data };
  if (message) body.message = message;
  return res.json(body);
}

function sendFailure(res, statusCode, message, errorCode, details) {
  const body = { success: false, message, errorCode };
  if (details) body.details = details;
  return res.status(statusCode).json(body);
}

module.exports = { sendFailure, sendSuccess };