const jwt = require("jsonwebtoken");
const env = require("../config/env");

const issuer = "hotelms-admin";
const audience = "hotelms-admin";

function signAccessToken(adminId) {
  return jwt.sign({}, env.jwtSecret, {
    subject: adminId,
    issuer,
    audience,
    expiresIn: env.jwtExpiresIn,
  });
}

function verifyAccessToken(token) {
  return jwt.verify(token, env.jwtSecret, { issuer, audience });
}

module.exports = { signAccessToken, verifyAccessToken };