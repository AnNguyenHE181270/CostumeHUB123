const express = require("express");
const router = express.Router();
const { checkAuth, isOwner } = require("../middlewares/check-auth.middleware");
const { getAllRoles } = require("../controllers/role.controller");

router.use(checkAuth);

router.get("/get-roles", isOwner, getAllRoles);

module.exports = router;