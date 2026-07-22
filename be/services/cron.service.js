const cron = require('node-cron');
const User = require('../models/user.model');
const Rental = require('../models/rental.model');
const notificationService = require('./notification.service');
const { autoUpdateDeliveredStatus, sendAutoConfirmReminders } = require('./rental.service');
const TransactionHistory = require('../models/transactionHistory.model');

const cleanupPendingUsers = async () => {
  console.log(" Đang chạy dọn dẹp tài khoản rác...");
  try {
    // Tìm các tài khoản đã tạo hơn 24 giờ trước
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Xóa các user đang pending, chưa xác thực email và quá hạn 24h
    const result = await User.deleteMany({
      status: "pending",
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

const cleanupPendingTransactions = async () => {
  console.log(" Đang dọn dẹp các giao dịch payOS treo (quá hạn)...");
  try {
    // payOS link hết hạn sau 15 phút, ta lấy 20 phút cho an toàn
    const twentyMinsAgo = new Date(Date.now() - 20 * 60 * 1000);
    const result = await TransactionHistory.updateMany(
      {
        status: "pending",
        createdAt: { $lt: twentyMinsAgo }
      },
      {
        $set: { status: "cancelled" }
      }
    );

    if (result.modifiedCount > 0) {
      console.log(`Đã tự động hủy ${result.modifiedCount} giao dịch payOS quá hạn.`);
    } else {
      console.log(`Không có giao dịch payOS nào quá hạn cần hủy.`);
    }
  } catch (error) {
    console.error("Lỗi khi hủy giao dịch payOS quá hạn:", error);
  }
};

const checkOverdueRentals = async () => {
  console.log(" Đang quét kiểm tra các đơn hàng quá hạn trả đồ...");
  try {
    const now = new Date();

    const overdueRentals = await Rental.find({
      status: "renting",
      endDate: { $lt: now }
    });

    for (const rental of overdueRentals) {
      rental.status = "overdue";
      await rental.save();
      try {
        await notificationService.createNotification({
          userId: rental.customerId,
          type: 'order_status',
          title: `Đơn hàng #${rental._id.toString().slice(-6).toUpperCase()}`,
          message: 'Đơn hàng của bạn đã quá hạn trả. Vui lòng liên hệ cửa hàng để xử lý.',
          link: '/rental-history',
          relatedId: rental._id,
        });
      } catch (notifyError) {
        console.error('[Notification Error]', notifyError);
      }
    }

    if (overdueRentals.length > 0) {
      console.log(`Đã tự động cập nhật ${overdueRentals.length} đơn hàng thành trạng thái 'overdue' (quá hạn).`);
    } else {
      console.log(`Không có đơn hàng nào bị quá hạn mới.`);
    }
  } catch (error) {
    console.error("Lỗi khi kiểm tra đơn hàng quá hạn:", error);
  }
};

const startCronJobs = () => {
  cleanupPendingUsers();
  cleanupPendingTransactions();
  checkOverdueRentals();
  autoUpdateDeliveredStatus().catch((err) => console.error('Lỗi khi tự động chuyển trạng thái đơn đã giao:', err));
  sendAutoConfirmReminders().catch((err) => console.error('Lỗi khi gửi nhắc nhở tự động xác nhận:', err));

  cron.schedule('0 0 * * *', cleanupPendingUsers);
  // Quét đơn quá hạn và đơn đã giao mỗi 15 phút thay vì chỉ 1 lần/ngày lúc 0h — tránh đơn quá hạn
  // buổi sáng phải chờ tới nửa đêm hôm sau mới được đánh dấu, và tự xác nhận "đã nhận hàng" đúng giờ hơn.
  cron.schedule('*/15 * * * *', checkOverdueRentals);
  cron.schedule('*/15 * * * *', () => {
    autoUpdateDeliveredStatus().catch((err) => console.error('Lỗi khi tự động chuyển trạng thái đơn đã giao:', err));
  });
  cron.schedule('*/15 * * * *', () => {
    sendAutoConfirmReminders().catch((err) => console.error('Lỗi khi gửi nhắc nhở tự động xác nhận:', err));
  });
  cron.schedule('*/15 * * * *', cleanupPendingTransactions);

  console.log("Cron jobs initialized.");
};

module.exports = startCronJobs;
