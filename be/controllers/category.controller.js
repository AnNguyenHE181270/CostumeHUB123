const categoryService = require('../services/category.service');
const HttpError = require('../models/http-error.model');

const getAllCategories = async (req, res, next) => {
  try {
    const categories = await categoryService.getAllCategories(req.query.all);
    res.status(200).json({ categories });
  } catch (err) {
    next(err instanceof HttpError ? err : new HttpError(err.message || 'Fetching categories failed.', 500));
  }
};

const createCategory = async (req, res, next) => {
  try {
    const category = await categoryService.createCategory(req.body);
    res.status(201).json({ category });
  } catch (err) {
    next(err instanceof HttpError ? err : new HttpError(err.message || 'Creating category failed.', 500));
  }
};

const updateCategory = async (req, res, next) => {
  try {
    const category = await categoryService.updateCategory(req.params.id, req.body);
    res.status(200).json({ category });
  } catch (err) {
    next(err instanceof HttpError ? err : new HttpError(err.message || 'Updating category failed.', 500));
  }
};

const toggleCategoryStatus = async (req, res, next) => {
  try {
    const category = await categoryService.toggleCategoryStatus(req.params.id, req.body.isActive);
    res.status(200).json({ category });
  } catch (err) {
    next(err instanceof HttpError ? err : new HttpError(err.message || 'Toggling category status failed.', 500));
  }
};

module.exports = { getAllCategories, createCategory, updateCategory, toggleCategoryStatus };
