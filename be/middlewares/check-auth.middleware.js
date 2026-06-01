const jwt = require("jsonwebtoken");
const HttpError = require("../models/http-error.model");
const userModel = require("../models/user.model");

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
      role: decodedToken.role ,
      permissions: decodedToken.permissions
    };

    next();
  } catch (err) {
    return next(new HttpError("Authentication failed!", 401));
  }
};

const requirePermission = (permission) => (req, res, next) => {
  try {
    const permissions = req.userData.permissions 

    if (!permissions.includes(permission)) {
      return next(new HttpError("Access denied!", 403))
    }

    next()
  } catch (err) {
    return next(new HttpError("Authorization failed!", 403))
  }
}

module.exports = {
  checkAuth,
  requirePermission
};
