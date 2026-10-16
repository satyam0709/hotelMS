const env = require("../config/env");
const adminAuthService = require("../services/adminAuth.service");
const { sendSuccess } = require("../utils/response");

function cookieOptions() {
  const options = {
    httpOnly: true,
    secure: env.cookieSecure,
    sameSite: env.cookieSameSite,
    path: "/",
    maxAge: env.jwtExpiresInMs,
  };
  if (env.cookieSameSite === "none" && env.cookieSecure) {
    options.partitioned = true;
  }
  return options;
}

function clearCookieOptions() {
  const { maxAge, ...options } = cookieOptions();
  return options;
}

async function login(req, res) {
  const result = await adminAuthService.login({ ...req.body, request: req });
  res.cookie(env.cookieName, result.token, cookieOptions());
  return sendSuccess(res, { admin: result.admin, token: result.token });
}

async function logout(req, res) {
  res.clearCookie(env.cookieName, clearCookieOptions());
  await adminAuthService.logout(req.cookies[env.cookieName], req);
  return sendSuccess(res, { loggedOut: true });
}

function me(req, res) {
  return sendSuccess(res, { admin: req.admin });
}

async function forgotPassword(req, res) {
  await adminAuthService.requestPasswordReset(req.body.email, req);
  return sendSuccess(res, { accepted: true }, "If the account exists, the reset request has been accepted.");
}

async function resetPassword(req, res) {
  await adminAuthService.resetPassword({ ...req.body, request: req });
  return sendSuccess(res, { reset: true }, "Password reset completed.");
}

async function changePassword(req, res) {
  await adminAuthService.changePassword({
    adminId: req.admin.id,
    currentPassword: req.body.currentPassword,
    newPassword: req.body.newPassword,
    request: req,
  });
  return sendSuccess(res, { changed: true }, "Password updated.");
}

async function updateProfile(req, res) {
  const result = await adminAuthService.updateProfile({
    adminId: req.admin.id,
    name: req.body.name,
    profileImageMediaId: req.body.profileImageMediaId,
    request: req,
  });
  return sendSuccess(res, result, "Profile updated.");
}

module.exports = {
  changePassword,
  forgotPassword,
  login,
  logout,
  me,
  resetPassword,
  updateProfile,
};