const Category = require('../models/category.model');
const HttpError = require('../models/http-error.model');

const getAllCategories = async (queryAll) => {
  const filter = queryAll === 'true' ? {} : { isActive: true };
  return Category.find(filter).sort({ createdAt: 1 });
};

// Chỉ cho phép tối đa 2 cấp danh mục (gốc -> con) — cấm tạo con của con.
const assertParentIsRoot = async (parentId) => {
  if (!parentId) return;
  const parent = await Category.findById(parentId);
  if (!parent) throw new HttpError('Không tìm thấy danh mục cha.', 404);
  if (parent.parentId) throw new HttpError('Không thể tạo danh mục con trong danh mục con. Chỉ hỗ trợ tối đa 2 cấp danh mục.', 400);
};

const createCategory = async ({ name, description, parentId }) => {
  const existing = await Category.findOne({ name });
  if (existing) throw new HttpError('Tên danh mục đã tồn tại!', 422);

  await assertParentIsRoot(parentId);

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
  if (parentId !== undefined) {
    const newParentId = parentId || null;
    if (newParentId) {
      if (newParentId === id) throw new HttpError('Danh mục không thể là cha của chính nó.', 400);
      await assertParentIsRoot(newParentId);
      // Danh mục đang có con thì không thể biến nó thành con của danh mục khác (sẽ tạo ra 3 cấp).
      const hasChildren = await Category.exists({ parentId: id });
      if (hasChildren) throw new HttpError('Danh mục này đang có danh mục con, không thể chuyển thành danh mục con của danh mục khác.', 400);
    }
    category.parentId = newParentId;
  }

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