const prisma = require("../prisma/client");
const AppError = require("../utils/appError");
const { createActivityLog } = require("./activityLog.service");

function fail(statusCode, message, errorCode) {
  throw new AppError(statusCode, message, errorCode);
}

function pagination(query = {}) {
  const page = query.page || 1;
  const limit = query.limit || 20;
  return { page, limit, skip: (page - 1) * limit };
}

function paginated(items, total, page, limit) {
  return { items, pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 } };
}

function money(value) {
  if (value == null) return null;
  return Number(Number(value).toFixed(2));
}

function asDate(value) {
  if (!value) return null;
  return new Date(`${value}T00:00:00.000Z`);
}

async function audited(req, { module, action, entityType, entityId, metadata }, operation) {
  return prisma.$transaction(async (tx) => {
    const result = await operation(tx);
    await createActivityLog({
      client: tx,
      userId: req.admin.id,
      module,
      action,
      entityType,
      entityId: typeof entityId === "function" ? entityId(result) : entityId,
      metadata: typeof metadata === "function" ? metadata(result) : metadata,
      request: req,
    });
    return result;
  });
}

const couponSelect = {
  id: true,
  code: true,
  description: true,
  discountType: true,
  discountValue: true,
  minBookingAmount: true,
  maxDiscountAmount: true,
  validFrom: true,
  validTo: true,
  usageLimit: true,
  usedCount: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
};

const taxSelect = {
  id: true,
  name: true,
  percentage: true,
  isDefault: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  _count: { select: { rooms: true } },
};

function mapCoupon(row) {
  return {
    ...row,
    discountValue: money(row.discountValue),
    minBookingAmount: money(row.minBookingAmount),
    maxDiscountAmount: money(row.maxDiscountAmount),
  };
}

function mapTax(row) {
  const { _count, ...rest } = row;
  return {
    ...rest,
    percentage: money(row.percentage),
    roomCount: _count?.rooms ?? 0,
  };
}

async function listCoupons(query = {}) {
  const { page, limit, skip } = pagination(query);
  const search = query.search || query.q;
  const where = { deletedAt: null };
  if (query.isActive !== undefined) where.isActive = query.isActive;
  if (search) {
    where.OR = [
      { code: { contains: search } },
      { description: { contains: search } },
    ];
  }
  const [items, total] = await prisma.$transaction([
    prisma.coupon.findMany({ where, orderBy: { createdAt: "desc" }, skip, take: limit, select: couponSelect }),
    prisma.coupon.count({ where }),
  ]);
  return paginated(items.map(mapCoupon), total, page, limit);
}

async function getCoupon(id) {
  const item = await prisma.coupon.findFirst({ where: { id, deletedAt: null }, select: couponSelect });
  if (!item) fail(404, "Coupon not found.", "NOT_FOUND");
  return mapCoupon(item);
}

function couponData(input) {
  const data = { ...input };
  if (Object.hasOwn(data, "validFrom")) data.validFrom = asDate(data.validFrom);
  if (Object.hasOwn(data, "validTo")) data.validTo = asDate(data.validTo);
  return data;
}

async function createCoupon(body, req) {
  return audited(req, {
    module: "coupons", action: "create", entityType: "Coupon", entityId: (row) => row.id,
  }, async (tx) => {
    const existing = await tx.coupon.findFirst({
      where: { code: body.code, deletedAt: null },
      select: { id: true },
    });
    if (existing) fail(409, "Coupon code already exists.", "CONFLICT");
    const created = await tx.coupon.create({ data: couponData(body), select: couponSelect });
    return mapCoupon(created);
  });
}

async function updateCoupon(id, body, req) {
  return audited(req, {
    module: "coupons", action: "update", entityType: "Coupon", entityId: id,
    metadata: { changedFields: Object.keys(body) },
  }, async (tx) => {
    const current = await tx.coupon.findFirst({ where: { id, deletedAt: null }, select: { id: true } });
    if (!current) fail(404, "Coupon not found.", "NOT_FOUND");
    if (body.code) {
      const clash = await tx.coupon.findFirst({
        where: { code: body.code, deletedAt: null, id: { not: id } },
        select: { id: true },
      });
      if (clash) fail(409, "Coupon code already exists.", "CONFLICT");
    }
    const updated = await tx.coupon.update({ where: { id }, data: couponData(body), select: couponSelect });
    return mapCoupon(updated);
  });
}

async function deleteCoupon(id, req) {
  return audited(req, {
    module: "coupons", action: "delete", entityType: "Coupon", entityId: id,
  }, async (tx) => {
    const current = await tx.coupon.findFirst({ where: { id, deletedAt: null }, select: { id: true } });
    if (!current) fail(404, "Coupon not found.", "NOT_FOUND");
    return tx.coupon.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
      select: { id: true, deletedAt: true },
    });
  });
}

async function listTaxRates(query = {}) {
  const { page, limit, skip } = pagination(query);
  const search = query.search || query.q;
  const where = { deletedAt: null };
  if (query.isActive !== undefined) where.isActive = query.isActive;
  if (search) where.name = { contains: search };
  const [items, total] = await prisma.$transaction([
    prisma.taxRate.findMany({
      where,
      orderBy: [{ isDefault: "desc" }, { name: "asc" }],
      skip,
      take: limit,
      select: taxSelect,
    }),
    prisma.taxRate.count({ where }),
  ]);
  return paginated(items.map(mapTax), total, page, limit);
}

async function getTaxRate(id) {
  const item = await prisma.taxRate.findFirst({ where: { id, deletedAt: null }, select: taxSelect });
  if (!item) fail(404, "Tax rate not found.", "NOT_FOUND");
  return mapTax(item);
}

async function createTaxRate(body, req) {
  return audited(req, {
    module: "tax_rates", action: "create", entityType: "TaxRate", entityId: (row) => row.id,
  }, async (tx) => {
    if (body.isDefault) {
      await tx.taxRate.updateMany({ where: { deletedAt: null, isDefault: true }, data: { isDefault: false } });
    }
    const created = await tx.taxRate.create({ data: body, select: taxSelect });
    return mapTax(created);
  });
}

async function updateTaxRate(id, body, req) {
  return audited(req, {
    module: "tax_rates", action: "update", entityType: "TaxRate", entityId: id,
    metadata: { changedFields: Object.keys(body) },
  }, async (tx) => {
    const current = await tx.taxRate.findFirst({ where: { id, deletedAt: null }, select: { id: true } });
    if (!current) fail(404, "Tax rate not found.", "NOT_FOUND");
    if (body.isDefault === true) {
      await tx.taxRate.updateMany({
        where: { deletedAt: null, isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }
    const updated = await tx.taxRate.update({ where: { id }, data: body, select: taxSelect });
    return mapTax(updated);
  });
}

async function deleteTaxRate(id, req) {
  return audited(req, {
    module: "tax_rates", action: "delete", entityType: "TaxRate", entityId: id,
  }, async (tx) => {
    const current = await tx.taxRate.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, _count: { select: { rooms: true } } },
    });
    if (!current) fail(404, "Tax rate not found.", "NOT_FOUND");
    if (current._count.rooms > 0) {
      fail(409, "Cannot delete a tax rate assigned to rooms. Reassign rooms first.", "CONFLICT");
    }
    return tx.taxRate.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false, isDefault: false },
      select: { id: true, deletedAt: true },
    });
  });
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
