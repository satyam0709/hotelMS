const multer = require("multer");
const AppError = require("../utils/appError");

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
  "video/mp4",
  "video/webm",
  "video/quicktime",
]);

const MAX_BYTES = 15 * 1024 * 1024; // 15 MB

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: MAX_BYTES, files: 1 },
  fileFilter(req, file, cb) {
    if (!ALLOWED_MIME.has(file.mimetype)) {
      return cb(new AppError(400, "Unsupported file type. Use JPEG, PNG, WebP, GIF, AVIF, MP4, or WebM.", "VALIDATION_ERROR"));
    }
    return cb(null, true);
  },
});

function singleMediaUpload(fieldName = "file") {
  return (req, res, next) => {
    upload.single(fieldName)(req, res, (error) => {
      if (!error) return next();
      if (error instanceof AppError) return next(error);
      if (error instanceof multer.MulterError) {
        if (error.code === "LIMIT_FILE_SIZE") {
          return next(new AppError(400, "File is too large. Maximum size is 15 MB.", "VALIDATION_ERROR"));
        }
        return next(new AppError(400, error.message || "Upload failed.", "VALIDATION_ERROR"));
      }
      return next(error);
    });
  };
}

module.exports = {
  ALLOWED_MIME,
  MAX_BYTES,
  singleMediaUpload,
};
