const { body, param } = require("express-validator");

const createOrderValidator = [
];

const updateOrderStatusValidator = [
  param("id").isMongoId().withMessage("Invalid order ID"),
  body("status").notEmpty().withMessage("Status is required")
];

const confirmPreparationValidator = [
  param("id").isMongoId().withMessage("Invalid order ID")
];

const getOrderDetailValidator = [
  param("orderId").isMongoId().withMessage("Invalid order ID")
];

const cancelOrderValidator = [
  param("id").isMongoId().withMessage("Invalid order ID"),
];

const requestReturnValidator = [
  param("id").isMongoId().withMessage("Invalid order ID")
];

const inspectReturnValidator = [
  param("id").isMongoId().withMessage("Invalid order ID")
];

const confirmReceiptValidator = [
  param("id").isMongoId().withMessage("Invalid order ID")
];

const extendRentalValidator = [
  param("id").isMongoId().withMessage("Invalid order ID"),
  body("newEndDate").isISO8601().withMessage("Invalid new end date")
];

module.exports = {
  createOrderValidator,
  updateOrderStatusValidator,
  confirmPreparationValidator,
  getOrderDetailValidator,
  cancelOrderValidator,
  requestReturnValidator,
  inspectReturnValidator,
  confirmReceiptValidator,
  extendRentalValidator
};
