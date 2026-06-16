const express = require("express");
const router = express.Router();
const { checkAuth, isStaff } = require("../middlewares/check-auth.middleware");
const { getStaffDashboard } = require("../controllers/staff.controller");

// GET /api/staff/dashboard — Dữ liệu tổng quan cho Staff Dashboard
router.get("/dashboard", checkAuth, isStaff, getStaffDashboard);

module.exports = router;
