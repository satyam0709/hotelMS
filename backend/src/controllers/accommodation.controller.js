const service = require("../services/accommodation.service");
const { sendSuccess } = require("../utils/response");

const params = (req) => req.validatedParams || req.params;
const query = (req) => req.validatedQuery || req.query;
const reply = (operation, args = () => []) => async (req, res) =>
  sendSuccess(res, await service[operation](...args(req)));

const listPublicRoomCategories = reply("listPublicRoomCategories", (req) => [query(req)]);
const getPublicRoomCategory = reply("getPublicRoomCategory", (req) => [params(req).slug]);
const listPublicAmenities = reply("listPublicAmenities", (req) => [query(req)]);
const listPublicRooms = reply("listPublicRooms", (req) => [query(req)]);
const getPublicRoom = reply("getPublicRoom", (req) => [params(req).slug]);
const listAdminRooms = reply("listAdminRooms", (req) => [query(req)]);
const getAdminRoom = reply("getAdminRoom", (req) => [params(req).id]);
const createRoom = reply("createRoom", (req) => [req.body, req]);
const updateRoom = reply("updateRoom", (req) => [params(req).id, req.body, req]);
const deleteRoom = reply("deleteRoom", (req) => [params(req).id, req]);
const setRoomStatus = reply("setRoomStatus", (req) => [params(req).id, req.body.isActive, req]);
const setRoomAmenities = reply("setRoomAmenities", (req) => [params(req).id, req.body.amenityIds, req]);
const setRoomMedia = reply("setRoomMedia", (req) => [params(req).id, req.body.items, req]);
const listRoomAvailability = reply("listRoomAvailability", (req) => [params(req).roomId, query(req)]);
const upsertRoomAvailability = reply("upsertRoomAvailability", (req) => [params(req).roomId, req.body.days, req]);
const listRoomBlocks = reply("listRoomBlocks", (req) => [params(req).roomId, query(req)]);
const createRoomBlock = reply("createRoomBlock", (req) => [params(req).roomId, req.body, req]);
const updateRoomBlock = reply("updateRoomBlock", (req) => [params(req).roomId, params(req).id, req.body, req]);
const deleteRoomBlock = reply("deleteRoomBlock", (req) => [params(req).roomId, params(req).id, req]);
const listRoomRates = reply("listRoomRates", (req) => [params(req).roomId, query(req)]);
const createRoomRate = reply("createRoomRate", (req) => [params(req).roomId, req.body, req]);
const updateRoomRate = reply("updateRoomRate", (req) => [params(req).roomId, params(req).id, req.body, req]);
const deleteRoomRate = reply("deleteRoomRate", (req) => [params(req).roomId, params(req).id, req]);

function listAdmin(resourceName) {
  return reply("listAdmin", (req) => [resourceName, query(req)]);
}

function getAdmin(resourceName) {
  return reply("getAdmin", (req) => [resourceName, params(req).id]);
}

function create(resourceName) {
  return reply("create", (req) => [resourceName, req.body, req]);
}

function update(resourceName) {
  return reply("update", (req) => [resourceName, params(req).id, req.body, req]);
}

function remove(resourceName) {
  return reply("remove", (req) => [resourceName, params(req).id, req]);
}

function reorder(resourceName) {
  return reply("reorder", (req) => [resourceName, req.body.items, req]);
}

module.exports = {
  create,
  createRoom,
  createRoomBlock,
  createRoomRate,
  deleteRoom,
  deleteRoomBlock,
  deleteRoomRate,
  getAdmin,
  getAdminRoom,
  getPublicRoomCategory,
  getPublicRoom,
  listAdmin,
  listAdminRooms,
  listPublicAmenities,
  listPublicRooms,
  listPublicRoomCategories,
  listRoomAvailability,
  listRoomBlocks,
  listRoomRates,
  remove,
  reorder,
  setRoomAmenities,
  setRoomMedia,
  setRoomStatus,
  updateRoomBlock,
  updateRoomRate,
  upsertRoomAvailability,
  update,
  updateRoom,
};