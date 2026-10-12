class AppError extends Error {
  constructor(statusCode, message, errorCode, details) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
  }
}

module.exports = AppError;