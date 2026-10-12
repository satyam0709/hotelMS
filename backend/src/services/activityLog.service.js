const prisma = require("../prisma/client");

async function createActivityLog({
  client = prisma,
  userId = null,
  module,
  action,
  entityType = null,
  entityId = null,
  metadata,
  request,
}) {
  const data = {
    userId,
    module,
    action,
    entityType,
    entityId,
    ipAddress: request?.ip ? String(request.ip).slice(0, 80) : null,
    userAgent: request?.get("user-agent") || null,
    createdAt: new Date(),
  };
  if (metadata !== undefined) data.metadataJson = metadata;

  return client.activityLog.create({ data });
}

module.exports = { createActivityLog };