require("dotenv").config();
const mongoose = require("mongoose");
const ChatRoom = require("./models/chat-room.model.js");

mongoose.connect(process.env.MONGO_URI).then(async () => {
  try {
    await ChatRoom.collection.dropIndex("userId_1_staffId_1");
    console.log("Index dropped successfully");
  } catch(e) {
    console.error("Error dropping index:", e);
  }
  process.exit(0);
});
