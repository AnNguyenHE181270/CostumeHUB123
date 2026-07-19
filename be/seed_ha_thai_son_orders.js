const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });

const User = require('./models/user.model');
const Costume = require('./models/costume.model');
const Rental = require('./models/rental.model');

async function seedHaThaiSonOrders() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB.");

  // 1. Tìm tài khoản Hà Thái Sơn
  let user = await User.findOne({
    $or: [
      { email: "hason.ls.it@gmail.com" },
      { fullName: /Hà Thái Sơn/i }
    ]
  });

  if (!user) {
    console.log("Không tìm thấy người dùng Hà Thái Sơn, tạo mới...");
    user = await User.create({
      fullName: "Hà Thái Sơn",
      email: "hason.ls.it@gmail.com",
      phone: "0984614762",
      balance: 15000000,
      role: "customer",
    });
  } else {
    user.balance = Math.max(user.balance || 0, 15000000);
    await user.save();
    console.log("Đã tìm thấy tài khoản Hà Thái Sơn:", user._id, user.fullName, user.email);
  }

  const costumes = await Costume.find({});
  if (costumes.length === 0) {
    console.log("Không có costume nào trong CSDL.");
    process.exit(0);
  }

  const address = {
    receiverName: "Hà Thái Sơn",
    receiverPhone: user.phone || "0984614762",
    addressDetail: "Số 88 Phố Hoàng Ngân, Phường Trung Hòa, Quận Cầu Giấy, Hà Nội",
    province: "Hà Nội",
    district: "Quận Cầu Giấy",
    ward: "Phường Trung Hòa",
    note: "Giao giờ hành chính, gọi trước 15 phút"
  };

  // 2. Tạo 4 ĐƠN ĐANG THUÊ (status: 'renting')
  console.log("Đang tạo 4 đơn ĐANG THUÊ (renting)...");
  const rentingOrdersData = [
    { costumeIndex: 0, size: "L", daysAgo: 1, durationDays: 3, note: "Thuê phục vụ sự kiện gala công ty" },
    { costumeIndex: 2, size: "XL", daysAgo: 0, durationDays: 4, note: "Thuê chụp ảnh album gia đình" },
    { costumeIndex: 4, size: "M", daysAgo: 2, durationDays: 3, note: "Thuê dự cưới bạn thân" },
    { costumeIndex: 6, size: "L", daysAgo: 1, durationDays: 5, note: "Thuê đi quay vlog trải nghiệm" }
  ];

  for (let i = 0; i < rentingOrdersData.length; i++) {
    const cfg = rentingOrdersData[i];
    const costume = costumes[cfg.costumeIndex % costumes.length];
    const pricePerDay = costume.pricePerDay || costume.price || 250000;
    const depositPrice = costume.deposit || 500000;

    const startDate = new Date(Date.now() - cfg.daysAgo * 24 * 60 * 60 * 1000);
    const endDate = new Date(startDate.getTime() + cfg.durationDays * 24 * 60 * 60 * 1000);
    const totalRentalPrice = pricePerDay * cfg.durationDays;
    const shippingFee = 35000;
    const totalAmount = totalRentalPrice + depositPrice + shippingFee;

    await Rental.create({
      customerId: user._id,
      items: [{
        costume: costume._id,
        size: cfg.size,
        quantity: 1,
        rentalPricePerDay: pricePerDay,
        depositPrice,
      }],
      startDate,
      endDate,
      rentingAt: startDate,
      deliveredAt: new Date(startDate.getTime() - 4 * 60 * 60 * 1000),
      totalRentalPrice,
      totalDeposit: depositPrice,
      totalAmount,
      shippingFee,
      status: "renting",
      paymentMethod: "WALLET",
      paymentStatus: "paid",
      trackingCode: `GHN${Math.floor(100000000 + Math.random() * 900000000)}`,
      shippingAddress: { ...address, note: cfg.note },
      createdAt: new Date(startDate.getTime() - 24 * 60 * 60 * 1000)
    });
  }

  // 3. Tạo 6 ĐƠN ĐÃ THUÊ HOÀN TẤT (status: 'completed')
  console.log("Đang tạo 6 đơn ĐÃ THUÊ HOÀN TẤT (completed)...");
  const completedOrdersData = [
    { costumeIndex: 1, size: "L", pastDays: 10, durationDays: 2, note: "Đã hoàn cọc 100%" },
    { costumeIndex: 3, size: "M", pastDays: 20, durationDays: 3, note: "Khách trả đồ đúng hạn" },
    { costumeIndex: 5, size: "XL", pastDays: 35, durationDays: 2, note: "Đã kiểm tra nguyên vẹn" },
    { costumeIndex: 7, size: "L", pastDays: 50, durationDays: 4, note: "Trả đồ sạch đẹp" },
    { costumeIndex: 8, size: "M", pastDays: 65, durationDays: 3, note: "Sử dụng chụp concept cổ phục" },
    { costumeIndex: 9, size: "XL", pastDays: 80, durationDays: 2, note: "Đơn thuê hoàn tất tháng trước" }
  ];

  for (let i = 0; i < completedOrdersData.length; i++) {
    const cfg = completedOrdersData[i];
    const costume = costumes[cfg.costumeIndex % costumes.length];
    const pricePerDay = costume.pricePerDay || costume.price || 200000;
    const depositPrice = costume.deposit || 400000;

    const startDate = new Date(Date.now() - cfg.pastDays * 24 * 60 * 60 * 1000);
    const endDate = new Date(startDate.getTime() + cfg.durationDays * 24 * 60 * 60 * 1000);
    const totalRentalPrice = pricePerDay * cfg.durationDays;
    const shippingFee = 35000;
    const totalAmount = totalRentalPrice + depositPrice + shippingFee;

    await Rental.create({
      customerId: user._id,
      items: [{
        costume: costume._id,
        size: cfg.size,
        quantity: 1,
        rentalPricePerDay: pricePerDay,
        depositPrice,
      }],
      startDate,
      endDate,
      actualReturnDate: endDate,
      deliveredAt: startDate,
      rentingAt: startDate,
      totalRentalPrice,
      totalDeposit: depositPrice,
      totalAmount,
      shippingFee,
      status: "completed",
      paymentMethod: "WALLET",
      paymentStatus: "paid",
      refundAmount: depositPrice,
      trackingCode: `GHN${Math.floor(100000000 + Math.random() * 900000000)}`,
      shippingAddress: { ...address, note: cfg.note },
      createdAt: new Date(startDate.getTime() - 24 * 60 * 60 * 1000)
    });
  }

  console.log("Đã khởi tạo thành công 4 đơn ĐANG THUÊ và 6 đơn ĐÃ THUÊ HOÀN TẤT cho tài khoản Hà Thái Sơn!");
  mongoose.disconnect();
}

seedHaThaiSonOrders().catch(err => {
  console.error(err);
  process.exit(1);
});
