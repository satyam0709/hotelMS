const express = require("express");
const controller = require("../controllers/accommodation.controller");
const { requireAdminAuth } = require("../middleware/auth.middleware");
const { requirePermission } = require("../middleware/permission.middleware");
const { validateBody, validateParams, validateQuery } = require("../middleware/validate.middleware");
const validator = require("../validators/accommodation.validator");

const publicRouter = express.Router();
const adminRouter = express.Router();
const allow = (permission) => requirePermission(permission);
const idParams = validateParams(validator.idParams);
const slugParams = validateParams(validator.slugParams);
const listQuery = validateQuery(validator.listQuery);

const { apiCache } = require("../middleware/cache.middleware");

publicRouter.get("/room-categories", apiCache(120), listQuery, controller.listPublicRoomCategories);
publicRouter.get("/room-categories/:slug", apiCache(120), slugParams, controller.getPublicRoomCategory);
publicRouter.get("/amenities", apiCache(120), listQuery, controller.listPublicAmenities);
publicRouter.get("/rooms", apiCache(30), validateQuery(validator.roomListQuery), controller.listPublicRooms);
publicRouter.get("/rooms/:slug", apiCache(30), slugParams, controller.getPublicRoom);

adminRouter.use(requireAdminAuth);

adminRouter.get("/room-categories", allow("room_categories.read"), listQuery, controller.listAdmin("roomCategories"));
adminRouter.post("/room-categories", allow("room_categories.create"), validateBody(validator.roomCategory.create), controller.create("roomCategories"));
adminRouter.patch("/room-categories/reorder", allow("room_categories.update"), validateBody(validator.reorder), controller.reorder("roomCategories"));
adminRouter.get("/room-categories/:id", allow("room_categories.read"), idParams, controller.getAdmin("roomCategories"));
adminRouter.patch("/room-categories/:id", allow("room_categories.update"), idParams, validateBody(validator.roomCategory.update), controller.update("roomCategories"));
adminRouter.delete("/room-categories/:id", allow("room_categories.delete"), idParams, controller.remove("roomCategories"));

adminRouter.get("/amenities", allow("amenities.read"), listQuery, controller.listAdmin("amenities"));
adminRouter.post("/amenities", allow("amenities.create"), validateBody(validator.amenity.create), controller.create("amenities"));
adminRouter.patch("/amenities/reorder", allow("amenities.update"), validateBody(validator.reorder), controller.reorder("amenities"));
adminRouter.patch("/amenities/:id", allow("amenities.update"), idParams, validateBody(validator.amenity.update), controller.update("amenities"));
adminRouter.delete("/amenities/:id", allow("amenities.delete"), idParams, controller.remove("amenities"));

adminRouter.get("/rooms", allow("rooms.read"), validateQuery(validator.roomListQuery), controller.listAdminRooms);
adminRouter.post("/rooms", allow("rooms.create"), validateBody(validator.room.create), controller.createRoom);
adminRouter.get("/rooms/:id", allow("rooms.read"), idParams, controller.getAdminRoom);
adminRouter.put("/rooms/:id/amenities", allow("rooms.update"), idParams, validateBody(validator.roomAmenities), controller.setRoomAmenities);
adminRouter.put("/rooms/:id/media", allow("rooms.update"), idParams, validateBody(validator.roomMedia), controller.setRoomMedia);
adminRouter.patch("/rooms/:id/status", allow("rooms.update"), idParams, validateBody(validator.roomStatus), controller.setRoomStatus);
adminRouter.patch("/rooms/:id", allow("rooms.update"), idParams, validateBody(validator.room.update), controller.updateRoom);
adminRouter.delete("/rooms/:id", allow("rooms.delete"), idParams, controller.deleteRoom);

adminRouter.get("/rooms/:roomId/availability", allow("rooms.read"), validateParams(validator.roomIdParams), validateQuery(validator.roomRecordQuery), controller.listRoomAvailability);
adminRouter.put("/rooms/:roomId/availability", allow("rooms.update"), validateParams(validator.roomIdParams), validateBody(validator.availabilityUpsert), controller.upsertRoomAvailability);

adminRouter.get("/rooms/:roomId/blocks", allow("rooms.read"), validateParams(validator.roomIdParams), validateQuery(validator.roomRecordQuery), controller.listRoomBlocks);
adminRouter.post("/rooms/:roomId/blocks", allow("rooms.create"), validateParams(validator.roomIdParams), validateBody(validator.roomBlock.create), controller.createRoomBlock);
adminRouter.patch("/rooms/:roomId/blocks/:id", allow("rooms.update"), validateParams(validator.roomAndRecordParams), validateBody(validator.roomBlock.update), controller.updateRoomBlock);
adminRouter.delete("/rooms/:roomId/blocks/:id", allow("rooms.delete"), validateParams(validator.roomAndRecordParams), controller.deleteRoomBlock);

adminRouter.get("/rooms/:roomId/rates", allow("rooms.read"), validateParams(validator.roomIdParams), validateQuery(validator.roomRecordQuery), controller.listRoomRates);
adminRouter.post("/rooms/:roomId/rates", allow("rooms.create"), validateParams(validator.roomIdParams), validateBody(validator.roomRate.create), controller.createRoomRate);
adminRouter.patch("/rooms/:roomId/rates/:id", allow("rooms.update"), validateParams(validator.roomAndRecordParams), validateBody(validator.roomRate.update), controller.updateRoomRate);
adminRouter.delete("/rooms/:roomId/rates/:id", allow("rooms.delete"), validateParams(validator.roomAndRecordParams), controller.deleteRoomRate);

module.exports = { adminRouter, publicRouter };