const Category = require('../models/category.model');
const HttpError = require('../models/http-error.model');

const getAllCategories = async (queryAll) => {
  const filter = queryAll === 'true' ? {} : { isActive: true };
  return Category.find(filter).sort({ createdAt: 1 });
};

const createCategory = async ({ name, description, parentId }) => {
  const existing = await Category.findOne({ name });
  if (existing) throw new HttpError('Tên danh mục đã tồn tại!', 422);

  const category = new Category({ name, description, parentId: parentId || null });
  await category.save();
  return category;
};

const updateCategory = async (id, { name, description, parentId }) => {
  const category = await Category.findById(id);
  if (!category) throw new HttpError('Không tìm thấy danh mục.', 404);

  if (name) {
    const existing = await Category.findOne({ name, _id: { $ne: id } });
    if (existing) throw new HttpError('Tên danh mục đã tồn tại.', 422);
    category.name = name;
  }
  if (description !== undefined) category.description = description;
  if (parentId !== undefined) category.parentId = parentId || null;

  await category.save();
  return category;
};

const toggleCategoryStatus = async (id, isActive) => {
  const category = await Category.findById(id);
  if (!category) throw new HttpError('Không tìm thấy danh mục.', 404);

  const newStatus = isActive !== undefined ? isActive : !category.isActive;

  if (newStatus && category.parentId) {
    const parent = await Category.findById(category.parentId);
    if (parent && !parent.isActive) {
      throw new HttpError('Không thể khôi phục danh mục con khi danh mục cha đang bị ẩn.', 400);
    }
  }

  category.isActive = newStatus;
  await category.save();

  if (!category.isActive) {
    await Category.updateMany({ parentId: id }, { isActive: false });
  }

  return category;
};

module.exports = { getAllCategories, createCategory, updateCategory, toggleCategoryStatus };