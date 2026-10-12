const bcrypt = require("bcryptjs");

function hashPassword(password) {
  return bcrypt.hash(password, 12);
}

function verifyPassword(password, passwordHash) {
  return bcrypt.compare(password, passwordHash);
}

module.exports = { hashPassword, verifyPassword };