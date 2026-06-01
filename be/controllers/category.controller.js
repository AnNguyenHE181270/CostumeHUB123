const Category = require("../models/category.model");
const HttpError = require("../models/http-error.model");

const getAllCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({ isActive: true });
    res.status(200).json({ categories });
  } catch (err) {
    return next(new HttpError(err.message || "Fetching categories failed.", 500));
  }
};

const createCategory = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const existingCategory = await Category.findOne({ name });

    if (existingCategory) {
      return next(new HttpError("Category already exists.", 422));
    }

    const createdCategory = new Category({ name, description });
    await createdCategory.save();

    res.status(201).json({ category: createdCategory });
  } catch (err) {
    return next(new HttpError(err.message || "Creating category failed.", 500));
  }
};

module.exports = {
  getAllCategories,
  createCategory,
};
