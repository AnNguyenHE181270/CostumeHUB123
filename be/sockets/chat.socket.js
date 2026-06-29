const Message = require("../models/message.model");
const ChatRoom = require("../models/chat-room.model");

const chatSocket = (io) => {
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // join room
    socket.on("join_room", (roomId) => {
      socket.join(roomId);
    });

    // send message
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

        io.to(roomId).emit("receive_message", msg);

      } catch (err) {
        console.error(err.message);
      }
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });
};

module.exports = chatSocket;