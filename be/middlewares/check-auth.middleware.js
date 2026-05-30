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
      roles: decodedToken.roles || [],
    };

    next();
  } catch (err) {
    return next(new HttpError("Authentication failed!", 401));
  }
};

const checkStoreOwner = (req, res, next) => {
  try {
    if (!req.userData.roles.includes("store-owner")) {
      return next(new HttpError("Access denied! Store-owner only.", 403));
    }

    next();
  } catch (err) {
    return next(new HttpError("Authorization failed!", 403));
  }
};

const checkReceptionist = (req, res, next) => {
  try {
    if (!req.userData.roles.includes("receptionist")) {
      return next(new HttpError("Access denied! Receptionist only.", 403));
    }

    next();
  } catch (err) {
    return next(new HttpError("Authorization failed!", 403));
  }
};

const checkOnlineCustomer = (req, res, next) => {
  try {
    if (!req.userData.roles.includes("online-customer")) {
      return next(new HttpError("Access denied! Online customer only.", 403));
    }

    next();
  } catch (err) {
    return next(new HttpError("Authorization failed!", 403));
  }
};

module.exports = {
  checkAuth,
  checkStoreOwner,
  checkReceptionist,
  checkOnlineCustomer,
};
