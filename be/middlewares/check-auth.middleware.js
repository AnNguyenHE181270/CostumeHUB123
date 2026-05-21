// middleware/check-auth.js
const jwt = require("jsonwebtoken");

const HttpError = require("../models/http-error.model");

const checkAuth = (req, res, next) => {
  // Cho phép preflight CORS đi qua
  if (req.method === "OPTIONS") {
    return next();
  }

  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return next(new HttpError("Authentication failed!", 401));
    }

    // Format đúng: Authorization: Bearer <token>
    const parts = authHeader.split(" ");

    if (parts.length !== 2 || parts[0] !== "Bearer") {
      return next(new HttpError("Invalid authorization format!", 401));
    }

    const token = parts[1];

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

    req.userData = {
      id: decodedToken.id,
      email: decodedToken.email,
      role: decodedToken.role,
    };

    next();
  } catch (err) {
    return next(new HttpError("Authentication failed!", 401));
  }
};

module.exports = checkAuth;