const cron = require('node-cron');
const User = require('../models/user.model');

const cleanupPendingUsers = async () => {
  console.log(" Đang chạy dọn dẹp tài khoản rác...");
  try {
    // Tìm các tài khoản đã tạo hơn 24 giờ trước
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000); 

    // Xóa các user đang pending, chưa xác thực email và quá hạn 24h
    const result = await User.deleteMany({
      status: "pending",
      isEmailVerified: false,
      createdAt: { $lt: yesterday }
    });

    if (result.deletedCount > 0) {
      console.log(`Đã dọn dẹp thành công ${result.deletedCount} tài khoản rác.`);
    } else {
      console.log(`Không có tài khoản rác nào cần dọn.`);
    }
  } catch (error) {
    console.error("Lỗi khi chạy dọn dẹp tài khoản rác:", error);
  }
};

const startCronJobs = () => {
  cleanupPendingUsers();

  cron.schedule('0 0 * * *', cleanupPendingUsers);

  console.log("Cron jobs initialized.");
};

module.exports = startCronJobs;
