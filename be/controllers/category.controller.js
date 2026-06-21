const Category = require("../models/category.model");
const HttpError = require("../models/http-error.model");

const getAllCategories = async (req, res, next) => {
  try {
    const filter = req.query.all === 'true' ? {} : { isActive: true };
    const categories = await Category.find(filter).sort({ createdAt: 1 });
    res.status(200).json({ categories });
  } catch (err) {
    return next(new HttpError(err.message || "Fetching categories failed.", 500));
  }
};

const createCategory = async (req, res, next) => {
  try {
    const { name, description, parentId } = req.body;
    const existingCategory = await Category.findOne({ name });

    if (existingCategory) {
      return next(new HttpError("Category already exists.", 422));
    }

    const createdCategory = new Category({
      name,
      description,
      parentId: parentId || null
    });
    await createdCategory.save();

    res.status(201).json({ category: createdCategory });
  } catch (err) {
    return next(new HttpError(err.message || "Creating category failed.", 500));
  }
};

const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, parentId } = req.body;

    const category = await Category.findById(id);
    if (!category) {
      return next(new HttpError("Category not found.", 404));
    }

    if (name) {
      const existingCategory = await Category.findOne({ name, _id: { $ne: id } });
      if (existingCategory) {
        return next(new HttpError("Category name already exists.", 422));
      }
      category.name = name;
    }

    if (description !== undefined) category.description = description;
    if (parentId !== undefined) category.parentId = parentId || null;

    await category.save();
    res.status(200).json({ category });
  } catch (err) {
    return next(new HttpError(err.message || "Updating category failed.", 500));
  }
};

const toggleCategoryStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const category = await Category.findById(id);
    if (!category) {
      return next(new HttpError("Category not found.", 404));
    }

    category.isActive = isActive !== undefined ? isActive : !category.isActive;
    await category.save();

    // Nếu ẩn danh mục cha, tự động ẩn các danh mục con
    if (!category.isActive) {
      await Category.updateMany({ parentId: id }, { isActive: false });
    }

    res.status(200).json({ category });
  } catch (err) {
    return next(new HttpError(err.message || "Toggling category status failed.", 500));
  }
};

module.exports = {
  getAllCategories,
  createCategory,
  updateCategory,
  toggleCategoryStatus
};
