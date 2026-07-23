const mongoose = require('mongoose');
const StockTransaction = require('../models/stockTransaction.model');
const Costume = require('../models/costume.model');
const HttpError = require('../models/http-error.model');
const {
  backfillInstancesFromCounts,
  addInstances,
  syncVariantFromInstances,
  syncCostumeStatusFromVariants,
} = require('./costume.service');

const REASONS_BY_TYPE = {
  in: ['purchase_new', 'stock_correction_in'],
  out: ['damaged_writeoff', 'lost', 'stock_correction_out'],
};

const createStockTransaction = async ({ costumeId, size, type, reason, quantity, note }, userId) => {
  if (!mongoose.Types.ObjectId.isValid(costumeId)) throw new HttpError('Mã sản phẩm không hợp lệ.', 400);
  if (!['in', 'out'].includes(type)) throw new HttpError('Loại giao dịch không hợp lệ.', 400);
  if (!REASONS_BY_TYPE[type].includes(reason)) throw new HttpError('Lý do không hợp lệ với loại giao dịch này.', 400);
  const qty = Number(quantity);
  if (!Number.isInteger(qty) || qty <= 0) throw new HttpError('Số lượng phải là số nguyên dương.', 400);

  // Đọc + kiểm tra tồn kho + trừ/thêm instance + lưu phải nguyên tử trong 1 transaction — tránh 2 người
  // cùng thao tác Nhập/Xuất kho cùng lúc trên cùng 1 size ghi đè lẫn nhau (lost update).
  const session = await mongoose.startSession();
  let transaction, costumeResult, beforeStock, afterStock;
  try {
    await session.withTransaction(async () => {
      const costume = await Costume.findById(costumeId).session(session);
      if (!costume) throw new HttpError('Không tìm thấy sản phẩm.', 404);

      const variant = costume.variants.find((v) => v.size === size);
      if (!variant) throw new HttpError(`Sản phẩm không có size ${size}.`, 404);

      backfillInstancesFromCounts(variant);

      beforeStock = variant.totalStock || 0;

      if (type === 'in') {
        // Nhập thêm hàng mới -> sinh thêm unit vật lý mới (available) — Case restock.
        addInstances(variant, qty);
        afterStock = beforeStock + qty;
      } else {
        afterStock = beforeStock - qty;
        const freeCount = variant.instances.filter((i) => i.status === 'available').length;
        if (qty > freeCount) {
          const rentedUnits = variant.instances.filter((i) => i.status === 'rented').length;
          const maintenanceUnits = variant.instances.filter((i) => i.status === 'maintenance').length;
          throw new HttpError(
            `Không thể xuất kho ${qty} chiếc — chỉ còn ${freeCount} chiếc sẵn sàng (${rentedUnits} chiếc đang được khách thuê, ${maintenanceUnits} chiếc đang bảo trì).`,
            400
          );
        }
        // Xuất kho (hỏng/mất/điều chỉnh giảm) -> loại vĩnh viễn (retired) đúng N unit đang rảnh, cũ nhất trước.
        variant.instances
          .filter((i) => i.status === 'available')
          .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
          .slice(0, qty)
          .forEach((inst) => { inst.status = 'retired'; });
      }
      syncVariantFromInstances(variant);

      // Đồng bộ trạng thái sản phẩm tổng thể theo cùng một luật với mọi luồng khác ('hidden' được giữ nguyên)
      syncCostumeStatusFromVariants(costume);

      await costume.save({ session });

      transaction = new StockTransaction({
        costumeId,
        size,
        type,
        reason,
        quantity: qty,
        note: note || '',
        beforeStock,
        afterStock,
        performedBy: userId,
      });
      await transaction.save({ session });
      costumeResult = costume;
    });
  } finally {
    await session.endSession();
  }

  return { transaction, costume: costumeResult };
};

const getStockHistory = async ({ costumeId, type, reason, page = 1, limit = 20 }) => {
  const filter = {};
  if (costumeId) filter.costumeId = costumeId;
  if (type && ['in', 'out'].includes(type)) filter.type = type;
  if (reason) filter.reason = reason;

  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.max(1, Math.min(100, parseInt(limit)));
  const skip = (pageNum - 1) * limitNum;

  const [transactions, totalItems] = await Promise.all([
    StockTransaction.find(filter)
      .populate('costumeId', 'name images')
      .populate('performedBy', 'fullName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    StockTransaction.countDocuments(filter),
  ]);

  return {
    transactions,
    pagination: {
      currentPage: pageNum,
      totalPages: Math.ceil(totalItems / limitNum),
      totalItems,
      limit: limitNum,
    },
  };
};

const getStockSummary = async () => {
  const since = new Date();
  since.setDate(since.getDate() - 30);
  const rows = await StockTransaction.aggregate([
    { $match: { createdAt: { $gte: since } } },
    { $group: { _id: '$type', totalQty: { $sum: '$quantity' }, count: { $sum: 1 } } },
  ]);
  const summary = { in: { totalQty: 0, count: 0 }, out: { totalQty: 0, count: 0 } };
  rows.forEach((r) => { summary[r._id] = { totalQty: r.totalQty, count: r.count }; });
  return summary;
};

module.exports = { createStockTransaction, getStockHistory, getStockSummary };
