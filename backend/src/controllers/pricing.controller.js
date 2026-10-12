const service = require("../services/pricing.service");
const { sendSuccess } = require("../utils/response");

const query = (req) => req.validatedQuery || req.query;
const params = (req) => req.validatedParams || req.params;
const body = (req) => req.validatedBody || req.body;

async function listCoupons(req, res) {
  return sendSuccess(res, await service.listCoupons(query(req)));
}
async function getCoupon(req, res) {
  return sendSuccess(res, await service.getCoupon(params(req).id));
}
async function createCoupon(req, res) {
  return sendSuccess(res, await service.createCoupon(body(req), req));
}
async function updateCoupon(req, res) {
  return sendSuccess(res, await service.updateCoupon(params(req).id, body(req), req));
}
async function deleteCoupon(req, res) {
  return sendSuccess(res, await service.deleteCoupon(params(req).id, req));
}

async function listTaxRates(req, res) {
  return sendSuccess(res, await service.listTaxRates(query(req)));
}
async function getTaxRate(req, res) {
  return sendSuccess(res, await service.getTaxRate(params(req).id));
}
async function createTaxRate(req, res) {
  return sendSuccess(res, await service.createTaxRate(body(req), req));
}
async function updateTaxRate(req, res) {
  return sendSuccess(res, await service.updateTaxRate(params(req).id, body(req), req));
}
async function deleteTaxRate(req, res) {
  return sendSuccess(res, await service.deleteTaxRate(params(req).id, req));
}

module.exports = {
  listCoupons,
  getCoupon,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  listTaxRates,
  getTaxRate,
  createTaxRate,
  updateTaxRate,
  deleteTaxRate,
};
