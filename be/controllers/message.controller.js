const Message = require("../models/message.model");
const ChatRoom = require("../models/chat-room.model");

const getMessagesByRoom = async (req, res) => {
  try {
    const { roomId } = req.params;

    const messages = await Message.find({ roomId })
      .sort({ createdAt: 1 });

    return res.status(200).json({
      success: true,
      data: messages,
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

const sendMessage = async (req, res) => {
  try {
    const { roomId, senderId, message } = req.body;

    if (!roomId || !senderId || !message) {
      return res.status(400).json({
        message: "Missing fields",
      });
    }

    const msg = await Message.create({
      roomId,
      senderId,
      message,
      status: "sent",
    });

    // update chat room
    await ChatRoom.findByIdAndUpdate(roomId, {
      lastMessage: message,
      lastMessageAt: new Date(),
    });

    return res.status(201).json({
      success: true,
      data: msg,
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

const getMessagesPaginated = async (req, res) => {
  try {
    const { roomId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const skip = (page - 1) * limit;

    const messages = await Message.find({ roomId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return res.status(200).json({
      success: true,
      data: messages.reverse(), // để hiển thị đúng thứ tự chat
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

const markMessagesSeen = async (req, res) => {
  try {
    const { roomId, userId } = req.body;

    await Message.updateMany(
      {
        roomId,
        senderId: { $ne: userId }, // không update tin của chính mình
      },
      {
        status: "seen",
      }
    );

    return res.status(200).json({
      success: true,
      message: "Messages marked as seen",
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

module.exports = {
  getMessagesByRoom,
  sendMessage,
  getMessagesPaginated,
  markMessagesSeen,
};