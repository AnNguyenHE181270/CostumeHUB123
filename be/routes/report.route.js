const express = require('express');
const { getFullReport } = require('../controllers/report.controller');
const { checkAuth, isOwner } = require('../middlewares/check-auth.middleware');

const router = express.Router();

// GET /api/reports/full?startDate=...&endDate=...
router.get('/full', checkAuth, isOwner, getFullReport);

module.exports = router;
