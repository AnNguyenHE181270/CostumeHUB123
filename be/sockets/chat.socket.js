const Message = require("../models/message.model");
const ChatRoom = require("../models/chat-room.model");
const User = require("../models/user.model");

const onlineUsers = new Map(); // socket.id -> { userId, role, isChatting }
const customerQueue = []; // Hàng đợi khách hàng [{ socketId, userId }]

const checkQueueAndAssign = async (io) => {
  if (customerQueue.length === 0) return;

  // Tìm một nhân viên đang online và chưa hỗ trợ cuộc chat nào (roomCount === 0)
  let assignedStaffSocket = null;

  for (const [sId, data] of onlineUsers.entries()) {
    const isSupportRole =
      data.role === "staff" ||
      data.role === "admin" ||
      data.role === "owner";

    if (isSupportRole) {
      const roomCount = await ChatRoom.countDocuments({
        staffId: data.userId,
        status: "active",
      });

      if (roomCount === 0) {
        assignedStaffSocket = sId;
        break; // Đã tìm được nhân viên rảnh
      }
    }
  }

  // Nếu tất cả nhân viên đều bận thì giữ khách trong hàng đợi
  if (!assignedStaffSocket) {
    return;
  }

  const customer = customerQueue.shift();
  const staffData = onlineUsers.get(assignedStaffSocket);

  try {
    // Tạo phòng chat mới
    const newRoom = await ChatRoom.create({
      userId: customer.userId,
      staffId: staffData.userId,
      status: "active",
      isActive: true,
    });

    // Lấy đầy đủ thông tin staff (tên, avatar)
    const populatedRoom = await ChatRoom.findById(newRoom._id).populate(
      "staffId",
      "fullName avatar"
    );

    const roomIdStr = newRoom._id.toString();

    // Cho khách hàng tham gia phòng chat
    const customerSocket = io.sockets.sockets.get(customer.socketId);
    if (customerSocket) customerSocket.join(roomIdStr);

    // Cho nhân viên tham gia phòng chat
    const staffSocket = io.sockets.sockets.get(assignedStaffSocket);
    if (staffSocket) staffSocket.join(roomIdStr);

    // Thông báo cho cả hai biết đã được ghép phòng chat
    io.to(roomIdStr).emit("chat_assigned", populatedRoom);

    // Cập nhật lại vị trí hàng đợi của các khách còn lại
    customerQueue.forEach((q, index) => {
      io.to(q.socketId).emit("queue_update", {
        position: index + 1,
      });
    });
  } catch (err) {
    console.error("Queue assignment error:", err);
  }
};

const chatSocket = (io) => {
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // 1. Đăng ký người dùng đang online
    socket.on("register", async ({ userId, role }) => {
      let isChatting = false;

      const isSupportRole =
        role === "staff" ||
        role === "admin" ||
        role === "owner";

      // Nếu là nhân viên thì kiểm tra xem đang hỗ trợ cuộc chat nào không
      if (isSupportRole) {
        const activeRoomsCount = await ChatRoom.countDocuments({
          staffId: userId,
          status: "active",
        });

        if (activeRoomsCount > 0) {
          isChatting = true;
        }
      }

      // Lưu thông tin người dùng online
      onlineUsers.set(socket.id, {
        userId,
        role,
        isChatting,
      });

      // Đếm số tin nhắn chưa đọc để hiển thị badge
      const unreadCount = await Message.countDocuments({
        senderId: { $ne: userId },
        status: { $ne: "seen" },
      });

      socket.emit("unread_count", {
        count: unreadCount,
      });

      // Nếu nhân viên vừa online và đang rảnh thì lấy khách từ hàng đợi
      if (isSupportRole && !isChatting) {
        checkQueueAndAssign(io);
      }
    });

    // 1b. Kiểm tra xem khách có phòng chat đang hoạt động hay không
    socket.on("check_active_room", async (userId) => {
      let room = await ChatRoom.findOne({
        userId,
        status: "active",
      }).populate("staffId", "fullName avatar");

      if (room) {
        socket.join(room._id.toString());

        io.to(socket.id).emit("chat_assigned", room);
      }
    });

    // 2. Khách yêu cầu bắt đầu chat
    socket.on("request_chat", async (userId) => {
      // Tìm xem khách đã có phòng chat đang hoạt động chưa
      let room = await ChatRoom.findOne({
        userId,
        status: "active",
      }).populate("staffId", "fullName avatar");

      if (room) {
        // Kiểm tra nhân viên của phòng đó còn online không
        let isStaffOnline = false;

        if (room.staffId) {
          for (const [sId, data] of onlineUsers.entries()) {
            if (data.userId === room.staffId._id.toString()) {
              isStaffOnline = true;
              break;
            }
          }
        }

        if (isStaffOnline) {
          // Nếu nhân viên còn online thì cho khách vào lại phòng cũ
          socket.join(room._id.toString());

          io.to(socket.id).emit("chat_assigned", room);

          return;
        } else {
          // Nếu nhân viên đã offline thì đóng phòng cũ
          await ChatRoom.findByIdAndUpdate(room._id, {
            status: "closed",
            isActive: false,
          });
        }
      }

      // Giới hạn tối đa 5 khách trong hàng đợi
      if (
        customerQueue.length >= 5 &&
        customerQueue.findIndex((q) => q.userId === userId) === -1
      ) {
        io.to(socket.id).emit("queue_full", {
          message:
            "Hiện tại các tư vấn viên đều bận. Vui lòng thử lại sau ít phút.",
        });

        return;
      }

      // Nếu khách chưa có trong hàng đợi thì thêm vào
      const existingQueueIndex = customerQueue.findIndex(
        (q) => q.userId === userId
      );

      if (existingQueueIndex === -1) {
        customerQueue.push({
          userId,
          socketId: socket.id,
        });
      } else {
        // Nếu đã có thì cập nhật socket.id mới
        customerQueue[existingQueueIndex].socketId = socket.id;
      }

      // Thử ghép ngay với nhân viên nếu có người rảnh
      checkQueueAndAssign(io);

      // Gửi vị trí hiện tại trong hàng đợi cho khách
      const position =
        customerQueue.findIndex((q) => q.userId === userId) + 1;

      if (position > 0) {
        io.to(socket.id).emit("queue_update", {
          position,
        });
      }
    });

    // 3. Tham gia một phòng chat theo roomId
    socket.on("join_room", (roomId) => {
      socket.join(roomId);
    });

    // 4. Gửi tin nhắn
    socket.on("send_message", async (data) => {
      try {
        const { roomId, message, senderId } = data;

        // Lưu tin nhắn vào database
        const msg = await Message.create({
          roomId,
          senderId,
          message,
          status: "sent",
        });

        // Cập nhật tin nhắn cuối cùng của phòng chat
        await ChatRoom.findByIdAndUpdate(roomId, {
          lastMessage: message,
          lastMessageAt: new Date(),
        });

        // Gửi tin nhắn đến tất cả thành viên trong phòng
        io.to(roomId).emit("receive_message", msg);

        // Xác định người nhận để hiển thị thông báo
        const room = await ChatRoom.findById(roomId);

        if (room) {
          const receiverId =
            room.userId.toString() === senderId.toString()
              ? room.staffId.toString()
              : room.userId.toString();

          for (const [sId, uData] of onlineUsers.entries()) {
            if (uData.userId === receiverId) {
              io.to(sId).emit("new_message_notification", {
                roomId,
              });
            }
          }
        }
      } catch (err) {
        console.error(err.message);
      }
    });

    // 5. Đánh dấu tin nhắn đã xem
    socket.on("seen_message", async ({ roomId, userId }) => {
      try {
        await Message.updateMany(
          {
            roomId,
            senderId: { $ne: userId },
            status: { $ne: "seen" },
          },
          {
            $set: {
              status: "seen",
            },
          }
        );

        // Thông báo cho phòng biết tin nhắn đã được xem
        io.to(roomId).emit("message_seen", {
          roomId,
          byUserId: userId,
        });
      } catch (err) {
        console.error("Seen msg error:", err);
      }
    });

    // 6. Đóng cuộc chat
    socket.on("close_chat", async ({ roomId }) => {
      try {
        const room = await ChatRoom.findByIdAndUpdate(roomId, {
          status: "closed",
          isActive: false,
        });

        // Thông báo cho mọi người trong phòng biết cuộc chat đã kết thúc
        io.to(roomId).emit("chat_closed", {
          roomId,
        });

        // Nếu nhân viên không còn phòng chat nào thì đánh dấu là rảnh
        if (room && room.staffId) {
          const activeRoomsCount = await ChatRoom.countDocuments({
            staffId: room.staffId,
            status: "active",
          });

          if (activeRoomsCount === 0) {
            for (const [sId, data] of onlineUsers.entries()) {
              if (data.userId === room.staffId.toString()) {
                data.isChatting = false;
              }
            }
          }
        }

        // Tiếp tục ghép khách tiếp theo trong hàng đợi
        checkQueueAndAssign(io);
      } catch (err) {
        console.error("Close chat error:", err);
      }
    });

    // Người dùng ngắt kết nối
    socket.on("disconnect", () => {
      const user = onlineUsers.get(socket.id);

      // Xóa khỏi danh sách online
      onlineUsers.delete(socket.id);

      // Nếu khách đang ở hàng đợi thì xóa khỏi hàng đợi
      const qIndex = customerQueue.findIndex(
        (q) => q.socketId === socket.id
      );

      if (qIndex !== -1) {
        customerQueue.splice(qIndex, 1);

        // Cập nhật lại vị trí của các khách còn lại
        customerQueue.forEach((q, index) => {
          io.to(q.socketId).emit("queue_update", {
            position: index + 1,
          });
        });
      }

      console.log("User disconnected:", socket.id);
    });
  });
};

module.exports = chatSocket;