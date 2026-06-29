const express = require("express");
const router = express.Router();

const {
  checkAuth,
  isOwner,
} = require("../middlewares/check-auth.middleware");


router.use(checkAuth);
const {
  createOrGetRoom,
  getRoomsByUser,
  getRoomsByStaff,
  closeRoom,
} = require("../controllers/chat-room.controller");


router.post("/room", createOrGetRoom);
router.get("/user/:userId", getRoomsByUser);
router.get("/staff/:staffId", getRoomsByStaff);
router.patch("/close/:roomId", isOwner, closeRoom);

module.exports = router;