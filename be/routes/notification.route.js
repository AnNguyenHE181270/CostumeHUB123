const express = require('express');
const { getMyNotifications, markRead, markAllRead } = require('../controllers/notification.controller');
const { checkAuth } = require('../middlewares/check-auth.middleware');
const validate = require('../middlewares/validate.middleware');
const { markReadValidator } = require('../validators/notification.validator');

const router = express.Router();

router.get('/', checkAuth, getMyNotifications);
router.put('/read-all', checkAuth, markAllRead);
router.put('/:id/read', checkAuth, markReadValidator, validate, markRead);

module.exports = router;
