const AppError = require("../utils/appError");

function validateBody(schema) {
  return function bodyValidator(req, res, next) {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const details = result.error.issues.map(({ code, message, path }) => ({ code, message, path }));
      return next(new AppError(400, "Request validation failed.", "VALIDATION_ERROR", details));
    }
    req.body = result.data;
    return next();
  };
}

function validateQuery(schema) {
  return function queryValidator(req, res, next) {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      const details = result.error.issues.map(({ code, message, path }) => ({ code, message, path }));
      return next(new AppError(400, "Request validation failed.", "VALIDATION_ERROR", details));
    }
    req.validatedQuery = result.data;
    return next();
  };
}

function validateParams(schema) {
  return function paramsValidator(req, res, next) {
    const result = schema.safeParse(req.params);
    if (!result.success) {
      const details = result.error.issues.map(({ code, message, path }) => ({ code, message, path }));
      return next(new AppError(400, "Request validation failed.", "VALIDATION_ERROR", details));
    }
    req.validatedParams = result.data;
    return next();
  };
}

module.exports = { validateBody, validateParams, validateQuery };