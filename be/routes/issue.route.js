const express = require("express");
const { createIssue, getIssueByRentalId, cancelIssue, getAllIssues, handleIssue } = require("../controllers/issue.controller");
const { checkAuth } = require("../middlewares/check-auth.middleware");
const upload = require("../middlewares/upload.middleware");
const validate = require('../middlewares/validate.middleware');
const { createIssueValidator, getIssueByRentalIdValidator, cancelIssueValidator, handleIssueValidator } = require('../validators/issue.validator');

const router = express.Router();

router.post("/create", checkAuth, upload.uploadIssue, createIssueValidator, validate, createIssue);
router.get("/rental/:rentalId", checkAuth, getIssueByRentalIdValidator, validate, getIssueByRentalId);
router.put("/:id/cancel", checkAuth, cancelIssueValidator, validate, cancelIssue);
router.get("/", checkAuth, getAllIssues);
router.put("/:id/handle", checkAuth, upload.uploadIssue, handleIssueValidator, validate, handleIssue);

module.exports = router;
