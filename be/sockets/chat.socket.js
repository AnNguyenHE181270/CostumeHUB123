const Message = require("../models/message.model");
const ChatRoom = require("../models/chat-room.model");
const User = require("../models/user.model");

const onlineUsers = new Map(); // socket.id -> { userId, role, isChatting }
const customerQueue = []; // [ { socketId, userId } ]

const checkQueueAndAssign = async (io) => {
  if (customerQueue.length === 0) return;
  
  // Find available staff
  let assignedStaffSocket = null;
  for (const [sId, data] of onlineUsers.entries()) {
    const isSupportRole = data.role === "staff" || data.role === "admin" || data.role === "owner";
    if (isSupportRole) {
      assignedStaffSocket = sId;
      break;
    }
  }

  if (assignedStaffSocket) {
    const customer = customerQueue.shift();
    const staffData = onlineUsers.get(assignedStaffSocket);

    try {
      const newRoom = await ChatRoom.create({
        userId: customer.userId,
        staffId: staffData.userId,
        status: "active",
        isActive: true,
      });

      const populatedRoom = await ChatRoom.findById(newRoom._id).populate("staffId", "fullName avatar");

      const roomIdStr = newRoom._id.toString();

      // Ensure customer socket joins
      const customerSocket = io.sockets.sockets.get(customer.socketId);
      if (customerSocket) customerSocket.join(roomIdStr);
      
      // Ensure staff socket joins
      const staffSocket = io.sockets.sockets.get(assignedStaffSocket);
      if (staffSocket) staffSocket.join(roomIdStr);

      io.to(roomIdStr).emit("chat_assigned", populatedRoom);
      
      // Update queue for remaining customers
      customerQueue.forEach((q, index) => {
        io.to(q.socketId).emit("queue_update", { position: index + 1 });
      });
    } catch (err) {
      console.error("Queue assignment error:", err);
    }
  }
};

const chatSocket = (io) => {
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // 1. Register user online
    socket.on("register", async ({ userId, role }) => {
      let isChatting = false;
      const isSupportRole = role === "staff" || role === "admin" || role === "owner";
      
      // If support role, check if they already have an active room
      if (isSupportRole) {
        const activeRoomsCount = await ChatRoom.countDocuments({ staffId: userId, status: "active" });
        if (activeRoomsCount > 0) {
          isChatting = true;
        }
      }

      onlineUsers.set(socket.id, { userId, role, isChatting });
      
      // Fetch unread count to init badge
      const unreadCount = await Message.countDocuments({
        senderId: { $ne: userId },
        status: { $ne: "seen" }
      });
      socket.emit("unread_count", { count: unreadCount });

      // If support connects and is free, try to take from queue
      if (isSupportRole && !isChatting) {
        checkQueueAndAssign(io);
      }
    });

    // 1b. Check Active Room (for background notifications without queuing)
    socket.on("check_active_room", async (userId) => {
      let room = await ChatRoom.findOne({ userId, status: "active" }).populate("staffId", "fullName avatar");
      if (room) {
        socket.join(room._id.toString());
        io.to(socket.id).emit("chat_assigned", room);
      }
    });

    // 2. Request Chat
    socket.on("request_chat", async (userId) => {
      // Find active room for this user
      let room = await ChatRoom.findOne({ userId, status: "active" }).populate("staffId", "fullName avatar");

      if (room) {
        // Check if staff is online
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
          socket.join(room._id.toString());
          io.to(socket.id).emit("chat_assigned", room);
          return;
        } else {
          // Staff went offline. Close old room so they get a new one.
          await ChatRoom.findByIdAndUpdate(room._id, { status: "closed", isActive: false });
        }
      }
      
      // Check queue limit
      if (customerQueue.length >= 5 && customerQueue.findIndex(q => q.userId === userId) === -1) {
        io.to(socket.id).emit("queue_full", { message: "Hiện tại các tư vấn viên đều bận. Vui lòng thử lại sau ít phút." });
        return;
      }
      
      // If no active room, add to queue
      // Prevent duplicates in queue
      const existingQueueIndex = customerQueue.findIndex(q => q.userId === userId);
      if (existingQueueIndex === -1) {
        customerQueue.push({ userId, socketId: socket.id });
      } else {
        customerQueue[existingQueueIndex].socketId = socket.id;
      }
      
      // Try to assign immediately
      checkQueueAndAssign(io);
      
      // Send queue update
      const position = customerQueue.findIndex(q => q.userId === userId) + 1;
      if (position > 0) {
        io.to(socket.id).emit("queue_update", { position });
      }
    });

    // 3. Join Room explicitly
    socket.on("join_room", (roomId) => {
      socket.join(roomId);
    });

    // 4. Send Message
    socket.on("send_message", async (data) => {
      try {
        const { roomId, message, senderId } = data;

        const msg = await Message.create({
          roomId,
          senderId,
          message,
          status: "sent",
        });

        await ChatRoom.findByIdAndUpdate(roomId, {
          lastMessage: message,
          lastMessageAt: new Date(),
        });

        // Broadcast to room
        io.to(roomId).emit("receive_message", msg);

        // Find receiver to send notification badge
        const room = await ChatRoom.findById(roomId);
        if (room) {
          const receiverId = room.userId.toString() === senderId.toString() ? room.staffId.toString() : room.userId.toString();
          for (const [sId, uData] of onlineUsers.entries()) {
            if (uData.userId === receiverId) {
              io.to(sId).emit("new_message_notification", { roomId });
            }
          }
        }
      } catch (err) {
        console.error(err.message);
      }
    });

    // 5. Seen Message
    socket.on("seen_message", async ({ roomId, userId }) => {
      try {
        await Message.updateMany(
          { roomId, senderId: { $ne: userId }, status: { $ne: "seen" } },
          { $set: { status: "seen" } }
        );
        io.to(roomId).emit("message_seen", { roomId, byUserId: userId });
      } catch (err) {
        console.error("Seen msg error:", err);
      }
    });

    // 6. Close Chat (Staff or Customer)
    socket.on("close_chat", async ({ roomId }) => {
      try {
        const room = await ChatRoom.findByIdAndUpdate(roomId, { status: "closed", isActive: false });
        io.to(roomId).emit("chat_closed", { roomId });
        
        // Mark staff as free if they have no other active rooms
        if (room && room.staffId) {
          const activeRoomsCount = await ChatRoom.countDocuments({ staffId: room.staffId, status: "active" });
          if (activeRoomsCount === 0) {
            for (const [sId, data] of onlineUsers.entries()) {
              if (data.userId === room.staffId.toString()) {
                data.isChatting = false;
              }
            }
          }
        }

        checkQueueAndAssign(io);
      } catch (err) {
        console.error("Close chat error:", err);
      }
    });

    // Disconnect
    socket.on("disconnect", () => {
      const user = onlineUsers.get(socket.id);
      onlineUsers.delete(socket.id);
      
      const qIndex = customerQueue.findIndex(q => q.socketId === socket.id);
      if (qIndex !== -1) {
        customerQueue.splice(qIndex, 1);
        customerQueue.forEach((q, index) => {
          io.to(q.socketId).emit("queue_update", { position: index + 1 });
        });
      }
      console.log("User disconnected:", socket.id);
    });
  });
};

module.exports = chatSocket;