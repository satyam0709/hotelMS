const prisma = require("../prisma/client");

function pagination(query = {}) {
  const page = query.page || 1;
  const limit = query.limit || 20;
  return { page, limit, skip: (page - 1) * limit };
}

function paginated(items, total, page, limit) {
  return { items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
}

function dayStart(value) {
  return new Date(`${value}T00:00:00.000Z`);
}

function dayEnd(value) {
  return new Date(`${value}T23:59:59.999Z`);
}

async function listActivity(query = {}) {
  const { page, limit, skip } = pagination(query);
  const search = query.search || query.q;
  const where = {};
  if (query.module) where.module = query.module;
  if (query.action) where.action = query.action;
  if (query.entityType) where.entityType = query.entityType;
  if (query.userId) where.userId = query.userId;
  if (query.from || query.to) {
    where.createdAt = {
      ...(query.from ? { gte: dayStart(query.from) } : {}),
      ...(query.to ? { lte: dayEnd(query.to) } : {}),
    };
  }
  if (search) {
    where.OR = [
      { module: { contains: search } },
      { action: { contains: search } },
      { entityType: { contains: search } },
      { entityId: { contains: search } },
      { user: { is: { name: { contains: search } } } },
      { user: { is: { email: { contains: search } } } },
    ];
  }

  const [items, total] = await prisma.$transaction([
    prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      select: {
        id: true,
        userId: true,
        module: true,
        action: true,
        entityType: true,
        entityId: true,
        metadataJson: true,
        ipAddress: true,
        userAgent: true,
        createdAt: true,
        user: { select: { id: true, name: true, email: true, username: true } },
      },
    }),
    prisma.activityLog.count({ where }),
  ]);
  return paginated(items, total, page, limit);
}

module.exports = { listActivity };
