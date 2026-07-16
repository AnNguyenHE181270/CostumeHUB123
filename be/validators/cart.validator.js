const { body, param } = require("express-validator");

const addCartValidator = [
  body("costumeId").notEmpty().withMessage("Costume ID is required"),
];

const updateCartValidator = [
  param("costumeId").notEmpty().withMessage("Costume ID in param is required"),
];

const removeCartItemValidator = [
  body("costumeId").notEmpty().withMessage("Costume ID is required")
];

module.exports = {
  addCartValidator,
  updateCartValidator,
  removeCartItemValidator
};
