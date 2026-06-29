const cron = require('node-cron');
const User = require('../models/user.model');
const Rental = require('../models/rental.model');

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

const checkOverdueRentals = async () => {
  console.log(" Đang quét kiểm tra các đơn hàng quá hạn trả đồ...");
  try {
    const now = new Date();
    
    const result = await Rental.updateMany(
      {
        status: "renting",
        endDate: { $lt: now }
      },
      {
        $set: { status: "overdue" } // Chuyển sang trạng thái quá hạn
      }
    );

    if (result.modifiedCount > 0) {
      console.log(`Đã tự động cập nhật ${result.modifiedCount} đơn hàng thành trạng thái 'overdue' (quá hạn).`);
    } else {
      console.log(`Không có đơn hàng nào bị quá hạn mới.`);
    }
  } catch (error) {
    console.error("Lỗi khi kiểm tra đơn hàng quá hạn:", error);
  }
};

const startCronJobs = () => {
  cleanupPendingUsers();
  checkOverdueRentals(); 

  cron.schedule('0 0 * * *', cleanupPendingUsers);
  cron.schedule('0 0 * * *', checkOverdueRentals);

  console.log("Cron jobs initialized.");
};

module.exports = startCronJobs;
