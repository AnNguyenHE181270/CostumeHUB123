const ChatRoom = require("../models/chat-room.model");
const User = require("../models/user.model");
const Role = require("../models/role.model");
const HttpError = require("../models/http-error.model");

const createOrGetRoom = async (req, res) => {
  try {
    let { userId, staffId } = req.body;

    if (!userId) {
      return res.status(400).json({
        message: "userId is required",
      });
    }

    // check user tồn tại
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (!staffId) {
      let targetRole = await Role.findOne({ name: "staff" });
      if (!targetRole) {
        targetRole = await Role.findOne({ name: "owner" });
      }
      if (!targetRole) {
        return res.status(404).json({ message: "No staff or owner role found" });
      }
      
      // Lấy danh sách tất cả staff
      const staffs = await User.find({ role: targetRole._id, status: "active" });
      
      if (!staffs || staffs.length === 0) {
        return res.status(404).json({ message: "No staff available to chat" });
      }

      // Đếm số phòng chat đang active của mỗi staff
      let selectedStaff = staffs[0];
      let minRooms = Infinity;

      for (const staff of staffs) {
        const roomCount = await ChatRoom.countDocuments({ staffId: staff._id, status: "active" });
        if (roomCount < minRooms) {
          minRooms = roomCount;
          selectedStaff = staff;
        }
      }

      staffId = selectedStaff._id.toString();
    }

    const staff = await User.findById(staffId);

    if (!staff) {
      return res.status(404).json({
        message: "Staff not found",
      });
    }

    // check room đã tồn tại chưa
    let room = await ChatRoom.findOne({
      userId,
      staffId,
    });

    // nếu chưa có thì tạo mới
    if (!room) {
      room = await ChatRoom.create({
        userId,
        staffId,
        status: "active",
        isActive: true,
      });
    }

    return res.status(200).json({
      data: room,
    });

  } catch (err) {
    return res.status(500).json({
      message: err.message,
    });
  }
};

const getRoomsByUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const rooms = await ChatRoom.find({ userId })
      .populate("staffId", "name role")
      .sort({ lastMessageAt: -1 });

    return res.status(200).json({
      success: true,
      data: rooms,
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

const getRoomsByStaff = async (req, res) => {
  try {
    const { staffId } = req.params;

    const rooms = await ChatRoom.find({ staffId })
      .populate("userId", "fullName avatar role")
      .sort({ lastMessageAt: -1 });

    return res.status(200).json({
      data: rooms,
    });

  } catch (err) {
    return res.status(500).json({
      message: err.message,
    });
  }
};

const closeRoom = async (req, res) => {
  try {
    const { roomId } = req.params;

    const room = await ChatRoom.findByIdAndUpdate(
      roomId,
      {
        status: "closed",
        isActive: false,
      },
      { new: true }
    );

    if (!room) {
      return res.status(404).json({
        message: "Room not found",
      });
    }

    return res.status(200).json({
      data: room,
    });

  } catch (err) {
    return res.status(500).json({
      message: err.message,
    });
  }
};

module.exports = {
  createOrGetRoom,
  getRoomsByUser,
  getRoomsByStaff,
  closeRoom,
};