const express = require("express");
const { createIssue, getIssueByRentalId, cancelIssue } = require("../controllers/issue.controller");
const { checkAuth } = require("../middlewares/check-auth.middleware");
const upload = require("../middlewares/upload.middleware");

const router = express.Router();

router.post("/create", checkAuth, upload.uploadIssue, createIssue);
router.get("/rental/:rentalId", checkAuth, getIssueByRentalId);
router.put("/:id/cancel", checkAuth, cancelIssue);

module.exports = router;
