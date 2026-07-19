const StockTransaction = require('../models/stockTransaction.model');
const Costume = require('../models/costume.model');
const HttpError = require('../models/http-error.model');

const REASONS_BY_TYPE = {
  in: ['purchase_new', 'stock_correction_in'],
  out: ['damaged_writeoff', 'lost', 'stock_correction_out'],
};

const createStockTransaction = async ({ costumeId, size, type, reason, quantity, note }, userId) => {
  if (!['in', 'out'].includes(type)) throw new HttpError('Loại giao dịch không hợp lệ.', 400);
  if (!REASONS_BY_TYPE[type].includes(reason)) throw new HttpError('Lý do không hợp lệ với loại giao dịch này.', 400);
  const qty = Number(quantity);
  if (!Number.isInteger(qty) || qty <= 0) throw new HttpError('Số lượng phải là số nguyên dương.', 400);

  const costume = await Costume.findById(costumeId);
  if (!costume) throw new HttpError('Không tìm thấy sản phẩm.', 404);

  const variant = costume.variants.find((v) => v.size === size);
  if (!variant) throw new HttpError(`Sản phẩm không có size ${size}.`, 404);

  const beforeStock = variant.totalStock || 0;
  const rentedCount = Math.max(0, beforeStock - (variant.availableStock || 0));

  let afterStock;
  if (type === 'in') {
    afterStock = beforeStock + qty;
    variant.availableStock = (variant.availableStock || 0) + qty;
  } else {
    afterStock = beforeStock - qty;
    if (afterStock < rentedCount) {
      throw new HttpError(
        `Không thể xuất kho ${qty} chiếc — chỉ còn ${beforeStock - rentedCount} chiếc chưa cho thuê (${rentedCount} chiếc đang được khách thuê).`,
        400
      );
    }
    variant.availableStock = Math.max(0, (variant.availableStock || 0) - qty);
  }
  variant.totalStock = afterStock;

  // Đồng bộ trạng thái sản phẩm nếu vừa hết/vừa có hàng trở lại (giữ nguyên các trạng thái đang bị khoá thủ công)
  const lockedStatuses = ['hidden', 'maintenance', 'rented'];
  const totalAvailable = costume.variants.reduce((sum, v) => sum + (v.availableStock || 0), 0);
  if (totalAvailable === 0 && !lockedStatuses.includes(costume.status)) {
    costume.status = 'out_of_stock';
  } else if (totalAvailable > 0 && costume.status === 'out_of_stock') {
    costume.status = 'available';
  }

  await costume.save();

  const transaction = new StockTransaction({
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
  await transaction.save();

  return { transaction, costume };
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
