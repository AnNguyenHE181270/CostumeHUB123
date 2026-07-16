const { body, param } = require("express-validator");

const registerValidator = [
  body("fullName")
    .trim()
    .notEmpty()
    .withMessage("Full name is required")
    .isLength({ min: 2, max: 50 })
    .withMessage("Full name must be between 2 and 50 characters"),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email format"),

  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),

  body("phone")
    .notEmpty()
    .withMessage("Phone is required")
    .isMobilePhone()
    .withMessage("Invalid phone number"),

  body("gender")
    .notEmpty()
    .withMessage("Gender is required")
    .isIn(["male", "female", "other"])
    .withMessage("Gender must be male, female, or other"),

  body("dateOfBirth")
    .notEmpty()
    .withMessage("Date of birth is required")
    .isISO8601()
    .toDate()
    .withMessage("Invalid date of birth")
    .custom((value) => {
      if (value > new Date()) {
        throw new Error("Date of birth cannot be in the future");
      }
      return true;
    }),
];

const verifyOtpValidator = [
  param("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email format")
    .normalizeEmail(),

  body("otp")
    .trim()
    .notEmpty()
    .withMessage("OTP is required")
    .isLength({ min: 6, max: 6 })
    .withMessage("OTP must be 6 characters"),
];

const loginValidator = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email"),

  body("password").notEmpty().withMessage("Password is required"),
];

const forgotPasswordValidator = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email"),
];

const resetPasswordValidator = [
  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
];

const findUserByIdValidator = [
  param("id")
    .isMongoId()
    .withMessage("Invalid user ID"),
];

const updateUserValidator = [
  param("id")
    .isMongoId()
    .withMessage("Invalid user ID"),

  body("fullName")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Full name cannot be empty")
    .isLength({ min: 2, max: 50 })
    .withMessage("Full name must be between 2 and 50 characters"),

  body("email")
    .optional()
    .trim()
    .isEmail()
    .withMessage("Invalid email format"),

  body("phone")
    .optional()
    .isMobilePhone()
    .withMessage("Invalid phone number"),

  body("gender")
    .optional()
    .isIn(["male", "female", "other"])
    .withMessage("Gender must be male, female, or other"),

  body("dateOfBirth")
    .optional()
    .isISO8601()
    .toDate()
    .withMessage("Invalid date of birth")
    .custom((value) => {
      if (value > new Date()) {
        throw new Error("Date of birth cannot be in the future");
      }
      return true;
    }),

  body("status")
    .optional()
    .isIn(["active", "pending", "blocked"])
    .withMessage("Status must be active, pending, or blocked"),

  body("role")
    .optional()
    .isString()
    .withMessage("Role must be a string"),
];


const updateMyProfileValidator = [
  body("fullName")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Full name cannot be empty")
    .isLength({ min: 2, max: 50 })
    .withMessage("Full name must be between 2 and 50 characters"),

  body("phone")
    .optional()
    .isMobilePhone()
    .withMessage("Invalid phone number"),

  body("gender")
    .optional()
    .isIn(["male", "female", "other"])
    .withMessage("Gender must be male, female, or other"),

  body("dateOfBirth")
    .optional()
    .isISO8601()
    .toDate()
    .withMessage("Invalid date of birth")
    .custom((value) => {
      if (value > new Date()) {
        throw new Error("Date of birth cannot be in the future");
      }
      return true;
    }),

  body("avatar")
    .optional()
    .isURL()
    .withMessage("Avatar must be a valid URL"),
];
const createAddressValidator = [
  body("receiverName")
    .trim()
    .notEmpty()
    .withMessage("Receiver name is required")
    .isString()
    .withMessage("Receiver name must be a string"),

  body("receiverPhone")
    .trim()
    .notEmpty()
    .withMessage("Receiver phone is required")
    .isMobilePhone()
    .withMessage("Invalid phone number"),

  body("province")
    .trim()
    .notEmpty()
    .withMessage("Province is required"),

  body("district")
    .trim()
    .notEmpty()
    .withMessage("District is required"),

  body("ward")
    .trim()
    .notEmpty()
    .withMessage("Ward is required"),

  body("addressDetail")
    .trim()
    .notEmpty()
    .withMessage("Address detail is required"),

  body("note")
    .optional()
    .isString()
    .withMessage("Note must be a string"),

  body("isDefault")
    .optional()
    .isBoolean()
    .withMessage("isDefault must be a boolean value"),
];
const updateAddressValidator = [
  param("id")
    .isMongoId()
    .withMessage("Invalid address ID"),

  body("receiverName")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Receiver name cannot be empty")
    .isString()
    .withMessage("Receiver name must be a string"),

  body("receiverPhone")
    .optional()
    .trim()
    .isMobilePhone()
    .withMessage("Invalid phone number"),

  body("province")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Province cannot be empty"),

  body("district")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("District cannot be empty"),

  body("ward")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Ward cannot be empty"),

  body("addressDetail")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Address detail cannot be empty"),

  body("note")
    .optional()
    .isString()
    .withMessage("Note must be a string"),

  body("isDefault")
    .optional()
    .isBoolean()
    .withMessage("isDefault must be a boolean value"),
];

const deleteAddressValidator = [
  param("id")
    .isMongoId()
    .withMessage("Invalid address ID"),
];

const findAddressByIdValidator = [
  param("id")
    .trim()
    .notEmpty()
    .withMessage("Address ID is required")
    .isMongoId()
    .withMessage("Invalid address ID"),
];
module.exports = {
  registerValidator,
  verifyOtpValidator,
  loginValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  findUserByIdValidator,
  updateUserValidator,
  updateMyProfileValidator,
  createAddressValidator,
  updateAddressValidator,
  deleteAddressValidator,
  findAddressByIdValidator
};