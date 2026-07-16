const { body, param } = require("express-validator");

const checkAvailabilityValidator = [
  body("costumeId").isMongoId().withMessage("Invalid costume ID"),
  body("startDate").isISO8601().withMessage("Invalid start date"),
  body("endDate").isISO8601().withMessage("Invalid end date"),
  body("quantity").isInt({ min: 1 }).withMessage("Quantity must be at least 1"),
  body("size").optional().isString().withMessage("Size must be a string")
];

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
  checkAvailabilityValidator,
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
