const mongoose = require('mongoose');
const Costume = require('../models/costume.model');
const Category = require('../models/category.model');
const HttpError = require('../models/http-error.model');

const getAllCostumes = async (query) => {
  const { categoryId, subCategoryIds, minPrice, maxPrice, status, sort, page = 1, limit = 9, search } = query;
  const filter = { status: { $ne: 'hidden' } };

  let allTargetCategoryIds = [];
  if (categoryId) allTargetCategoryIds.push(categoryId);
  if (subCategoryIds) {
    const ids = subCategoryIds.split(',').filter(Boolean);
    allTargetCategoryIds.push(...ids);
  }

  if (allTargetCategoryIds.length > 0) {
    const toObjectId = (id) => {
      try { return new mongoose.Types.ObjectId(id); } catch (e) { return id; }
    };
    const childCategories = await Category.find({
      $or: [
        { parentId: { $in: allTargetCategoryIds } },
        { 'parentId.$oid': { $in: allTargetCategoryIds } },
        { parentId: { $in: allTargetCategoryIds.map(toObjectId) } },
      ],
    });
    const childIds = childCategories.map((c) => c._id.toString());
    const finalIds = [...new Set([...allTargetCategoryIds, ...childIds])];

    filter.$or = [
      { categoryId: { $in: finalIds } },
      { 'categoryId.$oid': { $in: finalIds } },
      { categoryId: { $in: finalIds.map(toObjectId) } },
    ];
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
    filter['variants.availableStock'] = { $gt: 0 };
  }

  if (search) filter.name = { $regex: search, $options: 'i' };

  const sortMap = {
    price_asc: { pricePerDay: 1 },
    price_desc: { pricePerDay: -1 },
    popular: { totalRentals: -1 },
    name_asc: { name: 1 },
    name_desc: { name: -1 },
    oldest: { createdAt: 1 },
  };
  const sortOption = sortMap[sort] || { createdAt: -1 };

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
      const lockedStatuses = ['hidden', 'maintenance', 'dry_cleaning', 'rented'];
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

module.exports = { getAllCostumes, getCostumeById, createCostume, updateCostume, deleteCostume };
