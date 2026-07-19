const express = require('express');
const { processChat } = require('../controllers/chat.controller');

const router = express.Router();

router.post('/', processChat);

module.exports = router;
