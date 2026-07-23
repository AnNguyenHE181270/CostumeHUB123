const cron = require('node-cron');
const User = require('../models/user.model');
const Rental = require('../models/rental.model');
const notificationService = require('./notification.service');
const sendEmail = require('./email.service');
const { autoUpdateDeliveredStatus, sendAutoConfirmReminders, sendUpcomingOverdueReminders, buildOrderLink } = require('./rental.service');


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


const checkOverdueRentals = async () => {
  console.log(" Đang quét kiểm tra các đơn hàng quá hạn trả đồ...");
  try {
    const now = new Date();

    const overdueRentals = await Rental.find({
      status: "renting",
      endDate: { $lt: now }
    }).populate('customerId', 'email fullName');

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

      const user = rental.customerId;
      if (user?.email) {
        try {
          await sendEmail({
            to: user.email,
            subject: `CostumeHUB — Đơn hàng #${rental._id.toString().slice(-6).toUpperCase()} đã quá hạn trả`,
            text: `Chào ${user.fullName || 'bạn'}, đơn hàng #${rental._id.toString().slice(-6).toUpperCase()} của bạn đã quá hạn trả. Vui lòng trả hàng sớm để tránh phát sinh thêm phí trễ hạn. Xem đơn tại: ${buildOrderLink(rental._id, 'overdue')}`,
            html: sendEmail.renderEmailHtml({
              heading: 'Đơn hàng của bạn đã quá hạn trả',
              badgeText: 'Quá hạn',
              badgeColor: 'danger',
              bodyHtml: `
                <p>Đơn hàng <b>#${rental._id.toString().slice(-6).toUpperCase()}</b> đã qua ngày hẹn trả (<b>${new Date(rental.endDate).toLocaleDateString('vi-VN')}</b>) mà chưa được hoàn trả.</p>
                <p>Phí trễ hạn đang được tính thêm theo từng ngày. Vui lòng liên hệ cửa hàng hoặc tiến hành trả hàng sớm nhất có thể để hạn chế phát sinh chi phí.</p>
              `,
              ctaText: 'Xem đơn hàng',
              ctaUrl: buildOrderLink(rental._id, 'overdue'),
            }),
          });
        } catch (mailError) {
          console.error('Lỗi khi gửi email báo quá hạn:', mailError);
        }
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

  checkOverdueRentals();
  autoUpdateDeliveredStatus().catch((err) => console.error('Lỗi khi tự động chuyển trạng thái đơn đã giao:', err));
  sendAutoConfirmReminders().catch((err) => console.error('Lỗi khi gửi nhắc nhở tự động xác nhận:', err));
  sendUpcomingOverdueReminders().catch((err) => console.error('Lỗi khi gửi nhắc nhở sắp quá hạn:', err));

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
  cron.schedule('*/15 * * * *', () => {
    sendUpcomingOverdueReminders().catch((err) => console.error('Lỗi khi gửi nhắc nhở sắp quá hạn:', err));
  });

  console.log("Cron jobs initialized.");
};

module.exports = startCronJobs;
