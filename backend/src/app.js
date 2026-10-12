const compression = require("compression");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const express = require("express");
const helmet = require("helmet");
const morgan = require("morgan");
const env = require("./config/env");
const activityRoutes = require("./routes/activity.routes");
const adminAuthRoutes = require("./routes/adminAuth.routes");
const adminUsersRoutes = require("./routes/adminUsers.routes");
const accommodationRoutes = require("./routes/accommodation.routes");
const availabilityRoutes = require("./routes/availability.routes");
const bookingRoutes = require("./routes/booking.routes");
const paymentRoutes = require("./routes/payment.routes");
const reportRoutes = require("./routes/report.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
const guestRoutes = require("./routes/guest.routes");
const notificationRoutes = require("./routes/notification.routes");
const pricingRoutes = require("./routes/pricing.routes");
const contentRoutes = require("./routes/content.routes");
const realtimeRoutes = require("./routes/realtime.routes");
const { notFoundHandler, errorHandler } = require("./middleware/error.middleware");
const { requireTrustedOrigin } = require("./middleware/originCheck.middleware");
const { sendSuccess } = require("./utils/response");

const app = express();

app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      callback(null, !origin || env.frontendOrigins.includes(origin));
    },
    credentials: true,
  })
);
app.use(
  compression({
    filter(req, res) {
      if (req.headers["x-no-compression"]) return false;
      if (req.path?.includes("/realtime/stream")) return false;
      return compression.filter(req, res);
    },
  })
);
app.use(cookieParser());
app.use(express.json({
  limit: "1mb",
  verify(req, res, buffer) {
    if (req.originalUrl?.includes("/payments/razorpay/webhook")) {
      req.rawBody = buffer;
    }
  },
}));
app.use(express.urlencoded({ extended: true, limit: "100kb" }));
app.use(morgan("dev"));

app.get("/api/health", (req, res) => {
  sendSuccess(res, { status: "ok" });
});

app.use("/api/admin", requireTrustedOrigin);
app.use("/api/admin/auth", adminAuthRoutes);
app.use("/api/admin", adminUsersRoutes);
app.use("/api/admin", activityRoutes);
app.use("/api", contentRoutes.publicRouter);
app.use("/api/admin", contentRoutes.adminRouter);
app.use("/api", accommodationRoutes.publicRouter);
app.use("/api/admin", accommodationRoutes.adminRouter);
app.use("/api", availabilityRoutes.publicRouter);
app.use("/api", bookingRoutes.publicRouter);
app.use("/api/admin", bookingRoutes.adminRouter);
app.use("/api", paymentRoutes.publicRouter);
app.use("/api/admin", paymentRoutes.adminRouter);
app.use("/api/admin", reportRoutes);
app.use("/api/admin", dashboardRoutes);
app.use("/api/admin", guestRoutes);
app.use("/api/admin", notificationRoutes);
app.use("/api/admin", pricingRoutes);
app.use("/api/admin", realtimeRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
