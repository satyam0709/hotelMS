const express = require("express");
const { requireAdminAuth } = require("../middleware/auth.middleware");
const { requireAnyPermission } = require("../middleware/permission.middleware");
const hub = require("../realtime/hub");
const AppError = require("../utils/appError");

const router = express.Router();

router.get(
  "/realtime/stream",
  requireAdminAuth,
  requireAnyPermission(["dashboard.read", "bookings.read"]),
  (req, res, next) => {
    if (hub.clientCount() >= hub.MAX_CLIENTS) {
      return next(new AppError(503, "Too many realtime connections.", "REALTIME_CAPACITY"));
    }

    req.headers["x-no-compression"] = "1";

    res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    if (typeof res.flushHeaders === "function") res.flushHeaders();

    const ok = hub.subscribe(res);
    if (!ok) {
      try {
        res.end();
      } catch {
        // ignore
      }
      return undefined;
    }

    const onClose = () => {
      hub.unsubscribe(res);
    };
    req.on("close", onClose);
    res.on("close", onClose);
    return undefined;
  }
);

module.exports = router;
