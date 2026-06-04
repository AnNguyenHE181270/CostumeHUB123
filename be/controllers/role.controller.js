const mongoose = require("mongoose");
const HttpError = require("../models/http-error.model");
const Role = require("../models/role.model");

const getAllRoles = async (req, res, next) => {
  try {
    const roles = await Role.find({});
    return res.status(200).json({
      success: true,
      roles,
    });
  } catch (err) {
    return next(new HttpError(err.message, 500));
  }
};

module.exports = {
  getAllRoles,
};

