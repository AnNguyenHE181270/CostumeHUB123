const mongoose = require('mongoose');
const Costume = require('../models/costume.model');
const Category = require('../models/category.model');
const HttpError = require('../models/http-error.model');

// ── Quản lý tồn kho theo từng unit vật lý (instances[]) ──────────────────────────────
// instances[] là nguồn sự thật; totalStock/availableStock/status trên variant là giá trị
// dẫn xuất, đồng bộ lại qua syncVariantFromInstances sau mỗi lần thay đổi instances.

const generateUnitCode = (size, seq) => `${size}-${String(seq).padStart(3, '0')}`;

const syncVariantFromInstances = (variant) => {
  if (!variant.instances || variant.instances.length === 0) return;
  variant.totalStock = variant.instances.filter((i) => i.status !== 'retired').length;
  variant.availableStock = variant.instances.filter((i) => i.status === 'available').length;
  const hasAvailable = variant.availableStock > 0;
  const hasMaintenance = variant.instances.some((i) => i.status === 'maintenance');
  if (hasAvailable) variant.status = 'available';
  else if (hasMaintenance) variant.status = 'maintenance';
  else variant.status = 'out_of_stock';
};

// Sinh thêm N instance mới (available) cho 1 variant — dùng khi tạo costume mới, tăng totalStock, nhập kho.
const addInstances = (variant, count) => {
  if (!variant.instances) variant.instances = [];
  const existingSeqs = variant.instances
    .map((i) => parseInt((i.unitCode || '').split('-').pop(), 10))
    .filter((n) => !isNaN(n));
  let nextSeq = existingSeqs.length ? Math.max(...existingSeqs) + 1 : 1;
  for (let i = 0; i < count; i++) {
    variant.instances.push({ unitCode: generateUnitCode(variant.size, nextSeq++), status: 'available' });
  }
};

// Dữ liệu cũ (trước khi có instances[]) chỉ có totalStock/availableStock dạng đếm gộp — nếu 1 variant
// chưa có instances nào nhưng đã có totalStock > 0, sinh instances tương ứng trước khi thao tác tiếp,
// để không bị mất tồn kho hiện có. An toàn gọi nhiều lần (bỏ qua nếu đã có instances).
const backfillInstancesFromCounts = (variant) => {
  if (variant.instances && variant.instances.length > 0) return;
  const total = variant.totalStock || 0;
  if (total === 0) return;
  variant.instances = [];
  const available = Math.max(0, Math.min(variant.availableStock || 0, total));
  addInstances(variant, available);
  const busyStatus = variant.status === 'maintenance' ? 'maintenance' : 'rented';
  for (let i = available; i < total; i++) {
    variant.instances.push({ unitCode: generateUnitCode(variant.size, variant.instances.length + 1), status: busyStatus });
  }
};

// Chọn N instance đang rảnh (cũ nhất trước - FIFO) để gán cho 1 đơn thuê. Trả về null nếu không đủ.
const pickAvailableInstances = (variant, count) => {
  const free = (variant.instances || [])
    .filter((i) => i.status === 'available')
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  if (free.length < count) return null;
  return free.slice(0, count);
};

const getAllCostumes = async (query) => {
  const { categoryId, subCategoryIds, minPrice, maxPrice, status, sort, page = 1, limit = 9, search } = query;

  // By default, exclude hidden costumes unless 'hidden' is explicitly requested
  let includeHidden = false;
  if (status) {
    const statuses = status.split(',').filter(Boolean);
    if (statuses.includes('hidden')) {
      includeHidden = true;
    }
  }

  const filter = includeHidden ? {} : { status: { $ne: 'hidden' } };

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
    if (status === 'all' || status === '') {
      filter.status = includeHidden ? { $in: ['available', 'out_of_stock', 'maintenance', 'rented', 'hidden'] } : { $ne: 'hidden' };
    } else if (status === 'available') {
      filter.status = includeHidden ? { $in: ['available', 'hidden'] } : { $ne: 'hidden' };
      filter['variants.availableStock'] = { $gt: 0 };
    } else if (status === 'out_of_stock') {
      filter.status = includeHidden ? { $in: ['out_of_stock', 'hidden'] } : { $ne: 'hidden' };
      filter['variants'] = { $not: { $elemMatch: { availableStock: { $gt: 0 } } } };
    } else {
      const statuses = status.split(',').filter(Boolean);
      const filteredStatuses = includeHidden ? statuses : statuses.filter((s) => s !== 'hidden');
      if (filteredStatuses.length > 0) {
        filter.status = { $in: filteredStatuses };
      } else {
        filter.status = { $ne: 'hidden' };
      }
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
    pricePerDay, price, deposit, minRentalDays, maxRentalDays, lateFeePerDay, status, specifications, variants,
  } = data;

  let processedVariants = [];
  if (variants && Array.isArray(variants)) {
    processedVariants = variants.map((v) => {
      const variant = { ...v, availableStock: 0, totalStock: 0, instances: [] };
      addInstances(variant, v.totalStock || 0);
      syncVariantFromInstances(variant);
      return variant;
    });
  }

  const newCostume = new Costume({
    name, slug, sku, categoryId, description,
    images: images || [],
    size, color, condition,
    pricePerDay: pricePerDay || 0,
    price: price || 0,
    deposit: deposit || 0,
    minRentalDays: minRentalDays || 1,
    maxRentalDays: maxRentalDays || 7,
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
    'minRentalDays', 'maxRentalDays', 'lateFeePerDay', 'status', 'specifications',
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

        const variant = { ...existingData, instances: existingData.instances || [] };
        if (incoming.lowStockThreshold !== undefined) variant.lowStockThreshold = Number(incoming.lowStockThreshold) || 0;
        backfillInstancesFromCounts(variant); // dữ liệu cũ chưa có instances -> sinh trước khi áp diff
        if (diff > 0) {
          addInstances(variant, diff);
        } else if (diff < 0) {
          // Giảm tồn kho thủ công -> loại bỏ (retired) các instance đang rảnh, mới nhập gần đây nhất
          // trước; không bao giờ đụng tới instance đang cho thuê/bảo trì.
          variant.instances
            .filter((i) => i.status === 'available')
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, -diff)
            .forEach((inst) => { inst.status = 'retired'; });
        }
        syncVariantFromInstances(variant);
        return variant;
      }
      const variant = { ...incoming, availableStock: 0, totalStock: 0, instances: [] };
      addInstances(variant, incoming.totalStock || 0);
      syncVariantFromInstances(variant);
      return variant;
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
  // Lưu ý: variant.status là trạng thái dẫn xuất tổng của cả size (available ngay khi CÓ ÍT NHẤT 1 unit rảnh),
  // nên phải kiểm tra thêm instances.status để không bỏ sót costume còn unit đang bảo trì dù variant đã "available".
  return Costume.find({
    $or: [
      { status: 'maintenance' },
      { 'variants.status': 'maintenance' },
      { 'variants.instances.status': 'maintenance' }
    ]
  })
    .populate('categoryId', 'name')
    .sort({ updatedAt: -1 });
};

// unitCode: hoàn tất đúng 1 unit vật lý cụ thể (khuyến khích dùng — chính xác nhất).
// size (không kèm unitCode): hoàn tất tất cả unit đang bảo trì của riêng size đó.
// Không truyền gì: hoàn tất tất cả unit đang bảo trì trên toàn bộ costume (hành vi mặc định cũ).
const completeMaintenance = async (id, size, unitCode) => {
  const costume = await Costume.findById(id);
  if (!costume) throw new HttpError('Không tìm thấy sản phẩm.', 404);

  const clearMaintenance = (variant) => {
    backfillInstancesFromCounts(variant);
    variant.instances.forEach((i) => {
      if (i.status === 'maintenance') { i.status = 'available'; i.note = ''; }
    });
    syncVariantFromInstances(variant);
  };

  if (unitCode) {
    const variant = size
      ? costume.variants.find((v) => v.size === size)
      : costume.variants.find((v) => (v.instances || []).some((i) => i.unitCode === unitCode));
    if (!variant) throw new HttpError('Không tìm thấy size/variant tương ứng.', 404);
    backfillInstancesFromCounts(variant);
    const instance = variant.instances.find((i) => i.unitCode === unitCode);
    if (!instance) throw new HttpError(`Không tìm thấy unit ${unitCode}.`, 404);
    if (instance.status === 'maintenance') {
      instance.status = 'available';
      instance.note = '';
    }
    syncVariantFromInstances(variant);
  } else if (size) {
    const variant = costume.variants.find((v) => v.size === size);
    if (variant) clearMaintenance(variant);
  } else {
    // Hoàn tất tất cả các biến thể đang ở trạng thái bảo trì của trang phục này
    costume.variants.forEach((variant) => {
      const hasMaintenanceInstance = variant.status === 'maintenance' || (variant.instances || []).some((i) => i.status === 'maintenance');
      if (hasMaintenanceInstance) clearMaintenance(variant);
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
  // Instance helpers — dùng lại ở rental.service.js và stockTransaction.service.js
  generateUnitCode,
  syncVariantFromInstances,
  addInstances,
  pickAvailableInstances,
  backfillInstancesFromCounts,
};
