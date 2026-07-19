const jwt = require("jsonwebtoken");
const HttpError = require("../models/http-error.model");

const checkAuth = (req, res, next) => {
  if (req.method === "OPTIONS") {
    return next();
  }

  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return next(new HttpError("Authentication failed!", 401));
    }

    const parts = authHeader.split(" ");

    if (parts.length !== 2 || parts[0] !== "Bearer") {
      return next(new HttpError("Invalid authorization format!", 401));
    }

    const token = parts[1];
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

    req.userData = {
      id: decodedToken.id,
      email: decodedToken.email,
      role: decodedToken.role
    };

    next();
  } catch (err) {
    return next(new HttpError("Authentication failed!", 401));
  }
};

const isOnlineCustomer = (req, res, next) => {
  try {
    if (req.userData.role !== "online-customer") {
      return next(new HttpError("Access denied: Online Customer role required!", 403));
    }
    next();
  } catch (err) {
    return next(new HttpError("Authorization failed!", 403));
  }
};

const isStaff = (req, res, next) => {
  try {
    if (req.userData.role !== "staff") {
      return next(new HttpError("Access denied: Staff role required!", 403));
    }
    next();
  } catch (err) {
    return next(new HttpError("Authorization failed!", 403));
  }
};

const isOwner = (req, res, next) => {
  try {
    if (req.userData.role !== "owner") {
      return next(new HttpError("Access denied: Owner role required!", 403));
    }
    next();
  } catch (err) {
    return next(new HttpError("Authorization failed!", 403));
  }
};

const isStaffOrOwner = (req, res, next) => {
  try {
    if (!["staff", "owner"].includes(req.userData.role)) {
      return next(new HttpError("Access denied: Staff or Owner role required!", 403));
    }
    next();
  } catch (err) {
    return next(new HttpError("Authorization failed!", 403));
  }
};

module.exports = {
  checkAuth,
  isOnlineCustomer,
  isStaff,
  isOwner,
  isStaffOrOwner // NEW EXPORT
};