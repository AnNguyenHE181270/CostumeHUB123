const express = require("express");
const router = express.Router();

const {
  checkAuth,
} = require("../middlewares/check-auth.middleware");

const {
  getMessagesByRoom,
  sendMessage,
  getMessagesPaginated,
  markMessagesSeen,
} = require("../controllers/message.controller");

router.use(checkAuth);
router.get("/:roomId", getMessagesByRoom);
router.post("/", sendMessage);
router.get("/:roomId/paginate", getMessagesPaginated);
router.patch("/seen", markMessagesSeen);
module.exports = router;