const { body } = require("express-validator");

const createPaymentUrlValidator = [
  body("amount").isNumeric().withMessage("Amount must be a number")
];

module.exports = {
  createPaymentUrlValidator
};
