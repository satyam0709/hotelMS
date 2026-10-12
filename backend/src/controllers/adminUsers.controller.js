const service = require("../services/adminUsers.service");
const { sendSuccess } = require("../utils/response");

const params = (req) => req.validatedParams || req.params;
const query = (req) => req.validatedQuery || req.query;

async function listUsers(req, res) {
  return sendSuccess(res, await service.listUsers(query(req)));
}

async function createUser(req, res) {
  return sendSuccess(res, await service.createUser(req.body, req), "User created.");
}

async function updateUser(req, res) {
  return sendSuccess(res, await service.updateUser(params(req).id, req.body, req), "User updated.");
}

async function deleteUser(req, res) {
  return sendSuccess(res, await service.deleteUser(params(req).id, req), "User deleted.");
}

async function listRoles(req, res) {
  return sendSuccess(res, await service.listRoles(query(req)));
}

async function createRole(req, res) {
  return sendSuccess(res, await service.createRole(req.body, req), "Role created.");
}

async function updateRole(req, res) {
  return sendSuccess(res, await service.updateRole(params(req).id, req.body, req), "Role updated.");
}

async function deleteRole(req, res) {
  return sendSuccess(res, await service.deleteRole(params(req).id, req), "Role deleted.");
}

async function listPermissions(req, res) {
  return sendSuccess(res, await service.listPermissions());
}

module.exports = {
  createRole,
  createUser,
  deleteRole,
  deleteUser,
  listPermissions,
  listRoles,
  listUsers,
  updateRole,
  updateUser,
};
