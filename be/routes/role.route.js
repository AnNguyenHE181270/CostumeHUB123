const express = require('express')
const router = express.Router();
const {checkAuth, requirePermission} = require("../middlewares/check-auth.middleware")
const {getAllRoles} = require("../controllers/role.controller")
router.get("/get-roles", requirePermission("view_all_roles"), getAllRoles)

module.exports = router