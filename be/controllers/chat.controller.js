const chatService = require('../services/chat.service');
const HttpError = require('../models/http-error.model');

const processChat = async (req, res, next) => {
  try {
    const { message, history } = req.body;
    
    if (!message) {
      return next(new HttpError("Message is required", 400));
    }

    const result = await chatService.processChat(message, history || []);
    
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  processChat
};
