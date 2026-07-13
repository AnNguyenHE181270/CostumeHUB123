const express = require('express');
const { getMyNotifications, markRead, markAllRead } = require('../controllers/notification.controller');
const { checkAuth } = require('../middlewares/check-auth.middleware');

const router = express.Router();

router.get('/', checkAuth, getMyNotifications);
router.put('/read-all', checkAuth, markAllRead);
router.put('/:id/read', checkAuth, markRead);

module.exports = router;
