const { param } = require("express-validator");

const markReadValidator = [
  param("id").isMongoId().withMessage("Invalid notification ID")
];

module.exports = {
  markReadValidator
};
