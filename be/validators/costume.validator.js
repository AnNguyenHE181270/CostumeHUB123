const { body, param } = require("express-validator");

const getCostumeByIdValidator = [
  param("id").isMongoId().withMessage("Invalid costume ID")
];

const createCostumeValidator = [
  body("name").trim().notEmpty().withMessage("Costume name is required"),
];

const updateCostumeValidator = [
  param("id").isMongoId().withMessage("Invalid costume ID"),
];

const deleteCostumeValidator = [
  param("id").isMongoId().withMessage("Invalid costume ID")
];

module.exports = {
  getCostumeByIdValidator,
  createCostumeValidator,
  updateCostumeValidator,
  deleteCostumeValidator
};
