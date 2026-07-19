const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });

const User = require('./models/user.model');
const Costume = require('./models/costume.model');
const Rental = require('./models/rental.model');

async function seedData() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB.");

  // 1. Tìm tài khoản "Mai" chính xác (mainths180751@fpt.edu.vn)
  let maiUser = await User.findOne({
    $or: [
      { email: "mainths180751@fpt.edu.vn" },
      { email: /mainths180751/i },
      { fullName: /^Mai$/i }
    ]
  });

  if (!maiUser) {
    console.log("Không tìm thấy người dùng Mai, đang tìm tài khoản customer bất kỳ hoặc tạo tài khoản Mai...");
    maiUser = await User.findOne({ role: { $in: ['customer', 'user'] } });
  }

  if (!maiUser) {
    maiUser = await User.create({
      fullName: "Nguyễn Tuyết Mai",
      email: "tuyetmai@gmail.com",
      phone: "0987654321",
      balance: 5000000,
      role: "customer",
    });
    console.log("Đã tạo tài khoản Mai mới:", maiUser._id, maiUser.fullName);
  } else {
    console.log("Đã tìm thấy tài khoản Mai:", maiUser._id, maiUser.fullName, maiUser.email);
  }

  // Lấy tất cả costumes
  const costumes = await Costume.find({});
  if (costumes.length === 0) {
    console.log("Không tìm thấy trang phục nào trong CSDL.");
    process.exit(0);
  }
  console.log(`Tìm thấy ${costumes.length} trang phục.`);

  // 2. Tạo đơn thuê thành công cho TẤT CẢ trang phục để sinh lượt thuê thật
  // ~10-12 trang phục sẽ có > 10 lượt thuê (BEST SELLER)
  console.log("Đang tạo lượt thuê ngẫu nhiên cho tất cả trang phục...");
  
  // Xóa bớt các đơn fake cũ nếu cần, hoặc tạo bổ sung
  for (let i = 0; i < costumes.length; i++) {
    const costume = costumes[i];
    const size = costume.variants?.[0]?.size || costume.size || 'M';
    const pricePerDay = costume.pricePerDay || costume.price || 150000;
    const depositPrice = costume.deposit || 300000;

    // Phân bổ lượt thuê: 10 sản phẩm đầu có 12 - 45 lượt thuê (BEST SELLER)
    // Các sản phẩm còn lại có 2 - 9 lượt thuê
    const targetRentals = i < 10 ? Math.floor(Math.random() * 25) + 15 : Math.floor(Math.random() * 6) + 3;

    // Kiểm tra số lượng đơn hiện có cho costume này
    const existingOrdersCount = await Rental.countDocuments({
      'items.costume': costume._id,
      status: 'completed'
    });

    const needToCreate = targetRentals - existingOrdersCount;
    if (needToCreate > 0) {
      const newOrders = [];
      for (let r = 0; r < needToCreate; r++) {
        const pastDays = Math.floor(Math.random() * 120) + 5;
        const start = new Date(Date.now() - pastDays * 24 * 60 * 60 * 1000);
        const end = new Date(start.getTime() + (Math.floor(Math.random() * 3) + 1) * 24 * 60 * 60 * 1000);
        
        newOrders.push({
          customerId: maiUser._id,
          items: [{
            costume: costume._id,
            size,
            quantity: 1,
            rentalPricePerDay: pricePerDay,
            depositPrice,
          }],
          startDate: start,
          endDate: end,
          actualReturnDate: end,
          totalRentalPrice: pricePerDay * 2,
          totalDeposit: depositPrice,
          totalAmount: pricePerDay * 2 + depositPrice + 30000,
          shippingFee: 30000,
          status: 'completed',
          paymentMethod: 'WALLET',
          paymentStatus: 'paid',
          refundAmount: depositPrice,
          shippingAddress: {
            receiverName: maiUser.fullName || "Tuyết Mai",
            receiverPhone: maiUser.phone || "0987654321",
            addressDetail: "123 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP.HCM",
            province: "TP. Hồ Chí Minh",
            district: "Quận 1",
            ward: "Phường Bến Nghé"
          },
          createdAt: start
        });
      }
      await Rental.insertMany(newOrders);
    }
  }

  console.log("Đã hoàn tất tạo lượt thuê cho tất cả trang phục.");

  // 3. Tạo các đơn hàng cụ thể ĐẦY ĐỦ CÁC TRẠNG THÁI cho tài khoản Mai
  console.log("Đang tạo danh sách đơn hàng test đa dạng trạng thái cho tài khoản Mai...");

  const statusConfigs = [
    {
      status: 'pending',
      title: 'Đơn hàng mới tạo (Đang chờ shop chuẩn bị hàng)',
      daysOffset: 0,
      daysDuration: 2,
      note: 'Dự kiến giao ngày mai'
    },
    {
      status: 'delivering',
      title: 'Đang vận chuyển hỏa tốc (GHN Express)',
      daysOffset: -1,
      daysDuration: 3,
      trackingCode: 'GHN982347102',
      note: 'Tài xế GHN đang giao tới'
    },
    {
      status: 'delivered',
      title: 'Đã giao thành công (Chờ khách bấm xác nhận đã nhận)',
      daysOffset: -2,
      daysDuration: 3,
      deliveredAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      trackingCode: 'GHN883920194',
      note: 'Đã nhận tại lễ tân chung cư'
    },
    {
      status: 'renting',
      title: 'Đang trong thời gian trải nghiệm thuê trang phục',
      daysOffset: -1,
      daysDuration: 4,
      rentingAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      trackingCode: 'GHN771029384',
      note: 'Sử dụng cho sự kiện tiệc tối'
    },
    {
      status: 'returning',
      title: 'Khách đã gửi yêu cầu trả hàng (Đang vận chuyển về shop)',
      daysOffset: -4,
      daysDuration: 3,
      note: 'Gửi qua shipper thu gom'
    },
    {
      status: 'completed',
      title: 'Đơn hàng hoàn tất - Đã kiểm tra & hoàn cọc 100%',
      daysOffset: -15,
      daysDuration: 2,
      actualReturnDate: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000),
      refundAmount: 500000,
      note: 'Trang phục nguyên vẹn'
    },
    {
      status: 'overdue',
      title: 'Đơn hàng quá hạn trả (Shop đã gửi cảnh báo)',
      daysOffset: -7,
      daysDuration: 3,
      lateFee: 200000,
      note: 'Cần liên hệ trả gấp'
    },
    {
      status: 'cancelled',
      title: 'Đơn hàng đã hủy (Khách đã nhận hoàn tiền vào ví)',
      daysOffset: -10,
      daysDuration: 2,
      cancelReason: 'Thay đổi lịch trình dự tiệc',
      note: 'Đã hoàn 100% tiền ví'
    },
    {
      status: 'renting',
      title: 'Bộ trang phục thiết kế thứ 2 đang thuê',
      daysOffset: 0,
      daysDuration: 3,
      note: 'Thuê đi chụp ảnh ngoại cảnh'
    },
    {
      status: 'completed',
      title: 'Đơn hàng thuê Áo Dài hoàn tất tuần trước',
      daysOffset: -25,
      daysDuration: 2,
      actualReturnDate: new Date(Date.now() - 23 * 24 * 60 * 60 * 1000),
      refundAmount: 400000,
      note: 'Đã trả đồ đúng hạn'
    }
  ];

  for (let idx = 0; idx < statusConfigs.length; idx++) {
    const cfg = statusConfigs[idx];
    const costume = costumes[idx % costumes.length];
    const size = costume.variants?.[0]?.size || costume.size || 'S';
    const pricePerDay = costume.pricePerDay || costume.price || 200000;
    const depositPrice = costume.deposit || 400000;

    const startDate = new Date(Date.now() + cfg.daysOffset * 24 * 60 * 60 * 1000);
    const endDate = new Date(startDate.getTime() + cfg.daysDuration * 24 * 60 * 60 * 1000);
    const totalRentalPrice = pricePerDay * cfg.daysDuration;

    await Rental.create({
      customerId: maiUser._id,
      items: [{
        costume: costume._id,
        size,
        quantity: 1,
        rentalPricePerDay: pricePerDay,
        depositPrice,
      }],
      startDate,
      endDate,
      actualReturnDate: cfg.actualReturnDate,
      deliveredAt: cfg.deliveredAt,
      rentingAt: cfg.rentingAt,
      totalRentalPrice,
      totalDeposit: depositPrice,
      totalAmount: totalRentalPrice + depositPrice + 35000,
      shippingFee: 35000,
      status: cfg.status,
      paymentMethod: 'WALLET',
      paymentStatus: cfg.status === 'cancelled' ? 'refunded' : 'paid',
      trackingCode: cfg.trackingCode || '',
      cancelReason: cfg.cancelReason || '',
      lateFee: cfg.lateFee || 0,
      refundAmount: cfg.refundAmount || 0,
      shippingAddress: {
        receiverName: maiUser.fullName || "Nguyễn Tuyết Mai",
        receiverPhone: maiUser.phone || "0987654321",
        addressDetail: "Toà Nhà Landmark 81, 720A Điện Biên Phủ, Phường 22, Quận Bình Thạnh, TP.HCM",
        province: "TP. Hồ Chí Minh",
        district: "Quận Bình Thạnh",
        ward: "Phường 22",
        note: cfg.note
      },
      createdAt: new Date(Date.now() - (idx + 1) * 12 * 60 * 60 * 1000)
    });
  }

  console.log("Đã tạo thành công 10+ đơn hàng đa dạng trạng thái cho tài khoản Mai!");
  mongoose.disconnect();
}

seedData().catch(err => {
  console.error(err);
  process.exit(1);
});
