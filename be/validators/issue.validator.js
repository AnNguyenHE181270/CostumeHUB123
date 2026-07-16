const { body, param } = require("express-validator");

const createIssueValidator = [
  body("rentalId").isMongoId().withMessage("Invalid rental ID"),
];

const getIssueByRentalIdValidator = [
  param("rentalId").isMongoId().withMessage("Invalid rental ID")
];

const cancelIssueValidator = [
  param("id").isMongoId().withMessage("Invalid issue ID")
];

const handleIssueValidator = [
  param("id").isMongoId().withMessage("Invalid issue ID")
];

module.exports = {
  createIssueValidator,
  getIssueByRentalIdValidator,
  cancelIssueValidator,
  handleIssueValidator
};
