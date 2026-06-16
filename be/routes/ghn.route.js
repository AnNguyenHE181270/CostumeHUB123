const express = require('express');
const router = express.Router();
const ghnController = require('../controllers/ghn.controller');

router.get('/provinces', ghnController.getProvinces);
router.get('/districts', ghnController.getDistricts);
router.get('/wards', ghnController.getWards);

module.exports = router;
