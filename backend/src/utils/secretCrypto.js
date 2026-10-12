const crypto = require("node:crypto");
const env = require("../config/env");

const PREFIX = "v1";

function deriveKey() {
  return crypto.scryptSync(env.jwtSecret, "hotelms-notification-smtp", 32);
}

function encryptSecret(plainText) {
  if (plainText == null || plainText === "") return null;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", deriveKey(), iv);
  const encrypted = Buffer.concat([cipher.update(String(plainText), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${PREFIX}:${iv.toString("hex")}:${tag.toString("hex")}:${encrypted.toString("hex")}`;
}

function decryptSecret(payload) {
  if (!payload) return null;
  const [version, ivHex, tagHex, dataHex] = String(payload).split(":");
  if (version !== PREFIX || !ivHex || !tagHex || !dataHex) {
    throw new Error("Invalid encrypted secret format.");
  }
  const decipher = crypto.createDecipheriv("aes-256-gcm", deriveKey(), Buffer.from(ivHex, "hex"));
  decipher.setAuthTag(Buffer.from(tagHex, "hex"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(dataHex, "hex")),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}

module.exports = { encryptSecret, decryptSecret };
