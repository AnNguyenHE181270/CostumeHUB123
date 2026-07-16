const { body, param } = require("express-validator");

const createCategoryValidator = [
  body("name").trim().notEmpty().withMessage("Category name is required")
];

const updateCategoryValidator = [
  param("id").isMongoId().withMessage("Invalid category ID"),
];

const toggleCategoryStatusValidator = [
  param("id").isMongoId().withMessage("Invalid category ID"),
  body("isActive").isBoolean().withMessage("isActive must be a boolean value")
];

module.exports = {
  createCategoryValidator,
  updateCategoryValidator,
  toggleCategoryStatusValidator
};
