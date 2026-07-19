const mongoose = require('mongoose');
const Costume = require('../models/costume.model');
const Category = require('../models/category.model');
const HttpError = require('../models/http-error.model');

const getAllCostumes = async (query) => {
  const { categoryId, subCategoryIds, minPrice, maxPrice, status, sort, page = 1, limit = 9, search } = query;
  const filter = { status: { $ne: 'hidden' } };

  const activeCategories = await Category.find({ isActive: true }).select('_id');
  const activeCategoryIds = activeCategories.map((c) => c._id.toString());

  let allTargetCategoryIds = [];
  if (categoryId) allTargetCategoryIds.push(categoryId);
  if (subCategoryIds) {
    const ids = subCategoryIds.split(',').filter(Boolean);
    allTargetCategoryIds.push(...ids);
  }

  const toObjectId = (id) => {
    try { return new mongoose.Types.ObjectId(id); } catch (e) { return id; }
  };

  if (allTargetCategoryIds.length > 0) {
    const normalizedIds = allTargetCategoryIds.map(toObjectId);
    const childCategories = await Category.find({
      parentId: { $in: normalizedIds },
      isActive: true,
    });
    const childIds = childCategories.map((c) => c._id.toString());
    const finalIds = [...new Set([...allTargetCategoryIds, ...childIds])]
      .filter((id) => activeCategoryIds.includes(id));

    if (finalIds.length === 0) {
      // If the requested category filter only includes inactive categories, return empty set.
      filter.categoryId = { $in: [] };
    } else {
      filter.categoryId = { $in: finalIds.map(toObjectId) };
    }
  } else {
    filter.categoryId = { $in: activeCategoryIds.map(toObjectId) };
  }

  if (minPrice || maxPrice) {
    filter.pricePerDay = {};
    if (minPrice) filter.pricePerDay.$gte = Number(minPrice);
    if (maxPrice) filter.pricePerDay.$lte = Number(maxPrice);
  }

  if (status) {
    if (status === 'all') {
      delete filter.status;
    } else {
      const statuses = status.split(',').filter(Boolean);
      if (statuses.length > 0) filter.status = { $in: statuses };
    }
  } else {
    // Không truyền status (khách duyệt web mặc định) -> chỉ hiện sản phẩm sẵn sàng cho thuê,
    // không dựa vào availableStock đơn thuần vì sản phẩm đang bảo trì/giặt là vẫn có thể còn availableStock > 0.
    filter.status = 'available';
    filter['variants.availableStock'] = { $gt: 0 };
  }

  if (search) filter.name = { $regex: search, $options: 'i' };

  const sortMap = {
    price_asc: { pricePerDay: 1, _id: 1 },
    price_desc: { pricePerDay: -1, _id: -1 },
    popular: { totalRentals: -1, _id: -1 },
    name_asc: { name: 1, _id: 1 },
    name_desc: { name: -1, _id: -1 },
    oldest: { createdAt: 1, _id: 1 },
    newest: { createdAt: -1, _id: -1 },
  };
  const sortOption = sortMap[sort] || { createdAt: -1, _id: -1 };

  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.max(1, Math.min(50, parseInt(limit)));
  const skip = (pageNum - 1) * limitNum;

  const [costumes, totalItems] = await Promise.all([
    Costume.find(filter).populate('categoryId', 'name').sort(sortOption).skip(skip).limit(limitNum),
    Costume.countDocuments(filter),
  ]);

  return {
    costumes,
    pagination: {
      currentPage: pageNum,
      totalPages: Math.ceil(totalItems / limitNum),
      totalItems,
      limit: limitNum,
    },
  };
};

const getCostumeById = async (id) => {
  const costume = await Costume.findById(id).populate('categoryId', 'name');
  if (!costume) throw new HttpError('Costume not found.', 404);
  return costume;
};

const createCostume = async (data, userId) => {
  const {
    name, slug, sku, categoryId, description, images, size, color, condition,
    pricePerDay, price, deposit, minRentalDays, lateFeePerDay, status, specifications, variants,
  } = data;

  let processedVariants = [];
  if (variants && Array.isArray(variants)) {
    processedVariants = variants.map((v) => ({ ...v, availableStock: v.totalStock || 0 }));
  }

  const newCostume = new Costume({
    name, slug, sku, categoryId, description,
    images: images || [],
    size, color, condition,
    pricePerDay: pricePerDay || 0,
    price: price || 0,
    deposit: deposit || 0,
    minRentalDays: minRentalDays || 1,
    lateFeePerDay: lateFeePerDay || 0,
    status: status || 'available',
    specifications: specifications || {},
    variants: processedVariants,
    createdBy: userId,
  });

  await newCostume.save();
  return newCostume;
};

const updateCostume = async (id, data) => {
  const costume = await Costume.findById(id);
  if (!costume) throw new HttpError('Costume not found.', 404);

  const fields = [
    'name', 'slug', 'sku', 'categoryId', 'description', 'images',
    'size', 'color', 'condition', 'pricePerDay', 'price', 'deposit',
    'minRentalDays', 'lateFeePerDay', 'status', 'specifications',
  ];
  fields.forEach((f) => { if (data[f] !== undefined) costume[f] = data[f]; });

  if (data.variants && Array.isArray(data.variants)) {
    const newVariants = data.variants.map((incoming) => {
      const incomingId = incoming._id ? incoming._id.toString() : null;
      const existing = costume.variants.find(
        (v) =>
          (incoming.sku && v.sku && v.sku === incoming.sku) ||
          (incomingId && v._id && v._id.toString() === incomingId)
      );

      if (existing) {
        const existingData = existing.toObject();
        const oldTotal = existingData.totalStock || 0;
        const oldAvailable = existingData.availableStock || 0;
        const rentedCount = Math.max(0, oldTotal - oldAvailable);
        const safeNewTotal = Math.max(rentedCount, incoming.totalStock ?? oldTotal);
        const diff = safeNewTotal - oldTotal;
        return { ...existingData, totalStock: safeNewTotal, availableStock: Math.max(0, oldAvailable + diff) };
      }
      return { ...incoming, availableStock: incoming.totalStock || 0 };
    });
    costume.variants = newVariants;

    if (data.status === undefined) {
      const totalAvailable = newVariants.reduce((sum, v) => sum + (v.availableStock || 0), 0);
      const lockedStatuses = ['hidden', 'maintenance', 'rented'];
      if (totalAvailable === 0 && !lockedStatuses.includes(costume.status)) {
        costume.status = 'out_of_stock';
      } else if (totalAvailable > 0 && costume.status === 'out_of_stock') {
        costume.status = 'available';
      }
    }
  }

  await costume.save();
  return costume;
};

const deleteCostume = async (id) => {
  const costume = await Costume.findById(id);
  if (!costume) throw new HttpError('Costume not found.', 404);
  costume.status = 'hidden';
  await costume.save();
};

// Staff xác nhận đã bảo trì/giặt là xong -> sản phẩm sẵn sàng cho thuê lại.
const getMaintenanceCostumes = async () => {
  return Costume.find({
    $or: [
      { status: 'maintenance' },
      { 'variants.status': 'maintenance' }
    ]
  })
    .populate('categoryId', 'name')
    .sort({ updatedAt: -1 });
};

const completeMaintenance = async (id, size) => {
  const costume = await Costume.findById(id);
  if (!costume) throw new HttpError('Không tìm thấy sản phẩm.', 404);

  if (size) {
    const variant = costume.variants.find((v) => v.size === size);
    if (variant) {
      variant.status = 'available';
    }
  } else {
    // Hoàn tất tất cả các biến thể đang ở trạng thái bảo trì của trang phục này
    costume.variants.forEach((v) => {
      if (v.status === 'maintenance') {
        v.status = 'available';
      }
    });
  }

  // Cập nhật lại status costume tổng thể
  const hasMaintenance = costume.variants.some((v) => v.status === 'maintenance');
  const hasAvailable = costume.variants.some(
    (v) => (v.status === 'available' || !v.status) && (v.availableStock || 0) > 0
  );

  if (hasAvailable) {
    costume.status = 'available';
  } else if (hasMaintenance) {
    costume.status = 'maintenance';
  } else {
    costume.status = 'out_of_stock';
  }

  await costume.save();
  return costume;
};

module.exports = {
  getAllCostumes,
  getCostumeById,
  createCostume,
  updateCostume,
  deleteCostume,
  getMaintenanceCostumes,
  completeMaintenance,
};
