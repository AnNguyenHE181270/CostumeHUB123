const { body, param } = require("express-validator");

const checkAvailabilityValidator = [
  body("costumeId").isMongoId().withMessage("Invalid costume ID"),
  body("startDate").isISO8601().withMessage("Invalid start date"),
  body("endDate").isISO8601().withMessage("Invalid end date"),
  body("quantity").isInt({ min: 1 }).withMessage("Quantity must be at least 1"),
  body("size").optional().isString().withMessage("Size must be a string")
];

const createOrderValidator = [
  body("startDate").isISO8601().withMessage("Invalid start date"),
  body("endDate").isISO8601().withMessage("Invalid end date"),
  body("items").isArray({ min: 1 }).withMessage("Đơn hàng phải có ít nhất 1 sản phẩm"),
  body("items.*.costume").isMongoId().withMessage("Invalid costume ID"),
  body("items.*.size").notEmpty().withMessage("Size is required"),
  body("items.*.quantity").isInt({ min: 1 }).withMessage("Quantity must be at least 1"),
  body("shippingFee").isFloat({ min: 0 }).withMessage("Invalid shipping fee"),
  body("shippingAddress.receiverName").notEmpty().withMessage("Receiver name is required"),
  body("shippingAddress.receiverPhone").notEmpty().withMessage("Receiver phone is required"),
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

const updateRentalDatesValidator = [
  param("id").isMongoId().withMessage("Invalid order ID"),
  body("startDate").isISO8601().withMessage("Invalid start date"),
  body("endDate").isISO8601().withMessage("Invalid end date")
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
  extendRentalValidator,
  updateRentalDatesValidator // NEW EXPORT
};
