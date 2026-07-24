// Chạy 1 lần: node migrations/2026-07-23-reseed-rentals-post-wallet-removal.js
// Sau khi bỏ luồng thanh toán qua ví (User.balance, TransactionHistory, payos), dữ liệu Rental cũ
// (paymentMethod cũ có thể là 'WALLET' — không còn hợp lệ với enum hiện tại ['VNPAY','Cash']) không
// còn khớp với luồng thu tiền mới. Script này:
//   1. Xoá toàn bộ Rental + Issue hiện có.
//   2. Reset các Costume instance đang 'rented'/'maintenance' (bị khoá bởi đơn cũ) về 'available' —
//      KHÔNG đụng instance 'retired' (hàng hỏng/mất thật, không liên quan gì tới việc xoá đơn).
//   3. Tạo mới 30 đơn thuê thật: dùng đúng 12 khách hàng (role online-customer) và danh sách trang
//      phục thật đang có trong DB, giá/cọc/ngày thuê tối thiểu-tối đa lấy từ chính costume, chia đều
//      cho 8 trạng thái đơn. Ghi thẳng vào DB (không gọi rentalService/gửi email) để không làm phiền
//      khách hàng thật bằng email seed data.
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
require('dotenv').config();
const mongoose = require('mongoose');
const Rental = require('../models/rental.model');
const Issue = require('../models/issue.model');
const Costume = require('../models/costume.model');
const User = require('../models/user.model');
const Role = require('../models/role.model');
const { getRentalPriceFactor } = require('../utils/pricing.util');
const {
  markInstancesRented,
  syncVariantFromInstances,
  syncCostumeStatusFromVariants,
} = require('../services/costume.service');

const STATUS_PLAN = [
  { status: 'pending', count: 4 },
  { status: 'delivering', count: 4 },
  { status: 'delivered', count: 4 },
  { status: 'renting', count: 4 },
  { status: 'returning', count: 3 },
  { status: 'completed', count: 4 },
  { status: 'cancelled', count: 4 },
  { status: 'overdue', count: 3 },
];

const CANCEL_REASONS = [
  'Khách đổi ý không thuê nữa',
  'Đặt nhầm size, đặt lại đơn khác',
  'Tìm được trang phục khác phù hợp hơn',
  'Thay đổi lịch sự kiện nên huỷ đơn',
];

const HANOI_WARDS = [
  { province: 'Hà Nội', district: 'Cầu Giấy', ward: 'Dịch Vọng' },
  { province: 'Hà Nội', district: 'Thanh Xuân', ward: 'Nhân Chính' },
  { province: 'Hà Nội', district: 'Đống Đa', ward: 'Láng Hạ' },
];

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function daysFromNow(n) {
  const d = new Date();
  d.setHours(11, 41, 0, 0);
  d.setDate(d.getDate() + n);
  return d;
}
function hoursFromNow(n) {
  return new Date(Date.now() + n * 60 * 60 * 1000);
}

// Chọn ngẫu nhiên 1 costume còn ít nhất `qty` unit 'available', trả về { costume, variant }.
function pickAvailableCostume(costumes, qty = 1) {
  const candidates = [];
  for (const c of costumes) {
    for (const v of c.variants) {
      const free = (v.instances || []).filter((i) => i.status === 'available').length;
      if (free >= qty) candidates.push({ costume: c, variant: v });
    }
  }
  if (candidates.length === 0) return null;
  return pick(candidates);
}

function buildShippingAddress(user) {
  if (user.addresses && user.addresses.length > 0) {
    const a = pick(user.addresses);
    return {
      receiverName: a.receiverName || user.fullName,
      receiverPhone: a.receiverPhone || user.phone || '0900000000',
      province: a.province, district: a.district, ward: a.ward,
      addressDetail: a.addressDetail,
      note: '',
    };
  }
  const loc = pick(HANOI_WARDS);
  return {
    receiverName: user.fullName || 'Khách hàng',
    receiverPhone: user.phone || '0900000000',
    province: loc.province, district: loc.district, ward: loc.ward,
    addressDetail: `Số ${Math.ceil(Math.random() * 200)} đường ${pick(['Xuân Thuỷ', 'Nguyễn Trãi', 'Láng', 'Cầu Giấy'])}`,
    note: '',
  };
}

// Tính giá + đặt cọc thật theo đúng công thức đang dùng ở createOrder (getRentalPriceFactor).
function priceItem(costume, rentalDays) {
  const factor = getRentalPriceFactor(rentalDays);
  const depositPrice = costume.deposit || costume.price || 0;
  const rentalPrice = Math.round(costume.pricePerDay * factor);
  return { rentalPrice, depositPrice };
}

function clampRentalDays(days, costume) {
  const min = costume.minRentalDays || 1;
  const max = costume.maxRentalDays || 7;
  return Math.min(max, Math.max(min, days));
}

async function buildOrder(status, customers, costumes, usedInstances) {
  const user = pick(customers);
  const pickResult = pickAvailableCostume(costumes, 1);
  if (!pickResult) return null;
  const { costume, variant } = pickResult;

  const preferredDays = pick([1, 2, 3, 4, 5]);
  const rentalDays = clampRentalDays(preferredDays, costume);
  const { rentalPrice, depositPrice } = priceItem(costume, rentalDays);
  const shippingFee = Math.random() < 0.15 ? 0 : pick([20000, 25000, 30000, 35000]);
  const shippingAddress = Math.random() < 0.15
    ? { receiverName: user.fullName, receiverPhone: user.phone || '0900000000', addressDetail: 'Nhận tại cửa hàng' }
    : buildShippingAddress(user);

  const paymentMethod = Math.random() < 0.7 ? 'VNPAY' : 'Cash';

  let startDate, endDate, createdAt, deliveredAt = null, rentingAt = null, actualReturnDate = null;
  let paymentStatus = 'paid';
  let trackingCode = '';
  let cancelReason = '';
  let refundAmount = 0, lateFee = 0, damageFee = 0, damageTier = 'none';
  let needsInstance = true;

  switch (status) {
    case 'pending': {
      // Chỉ pick() offset MỘT LẦN rồi dùng lại cho cả start/end — gọi pick() 2 lần độc lập (bug cũ)
      // có thể ra kết quả endDate < startDate khi 2 lần random lệch nhau.
      const startOffset = pick([1, 2, 3]);
      createdAt = hoursFromNow(-pick([1, 3, 6, 20]));
      startDate = daysFromNow(startOffset);
      endDate = daysFromNow(startOffset + rentalDays - 1);
      paymentStatus = paymentMethod === 'VNPAY' ? pick(['pending', 'paid']) : 'paid';
      break;
    }
    case 'delivering': {
      const startOffset = pick([0, 1]);
      createdAt = hoursFromNow(-pick([10, 20, 30]));
      startDate = daysFromNow(startOffset);
      endDate = daysFromNow(startOffset + rentalDays - 1);
      trackingCode = `GHN${Math.floor(100000 + Math.random() * 899999)}`;
      paymentStatus = 'paid';
      break;
    }
    case 'delivered':
      createdAt = hoursFromNow(-pick([15, 24, 40]));
      startDate = daysFromNow(0);
      endDate = daysFromNow(rentalDays - 1);
      deliveredAt = hoursFromNow(-pick([1, 2, 3]));
      trackingCode = `GHN${Math.floor(100000 + Math.random() * 899999)}`;
      paymentStatus = 'paid';
      break;
    case 'renting': {
      const startedDaysAgo = pick([1, 2]);
      createdAt = hoursFromNow(-(startedDaysAgo * 24 + 6));
      startDate = daysFromNow(-startedDaysAgo);
      endDate = daysFromNow(rentalDays - startedDaysAgo - 1 >= 1 ? rentalDays - startedDaysAgo - 1 : 1);
      deliveredAt = hoursFromNow(-(startedDaysAgo * 24 + 1));
      rentingAt = hoursFromNow(-(startedDaysAgo * 24));
      trackingCode = `GHN${Math.floor(100000 + Math.random() * 899999)}`;
      paymentStatus = 'paid';
      break;
    }
    case 'returning': {
      const startedDaysAgo = rentalDays;
      createdAt = hoursFromNow(-(startedDaysAgo * 24 + 10));
      startDate = daysFromNow(-startedDaysAgo);
      endDate = daysFromNow(0);
      deliveredAt = hoursFromNow(-(startedDaysAgo * 24 + 1));
      rentingAt = hoursFromNow(-(startedDaysAgo * 24));
      trackingCode = `GHN${Math.floor(100000 + Math.random() * 899999)}`;
      paymentStatus = 'paid';
      break;
    }
    case 'completed': {
      const finishedDaysAgo = pick([5, 10, 15, 20]);
      const startedDaysAgo = finishedDaysAgo + rentalDays;
      createdAt = hoursFromNow(-(startedDaysAgo * 24 + 10));
      startDate = daysFromNow(-startedDaysAgo);
      endDate = daysFromNow(-finishedDaysAgo);
      deliveredAt = hoursFromNow(-(startedDaysAgo * 24 + 1));
      rentingAt = hoursFromNow(-(startedDaysAgo * 24));
      trackingCode = `GHN${Math.floor(100000 + Math.random() * 899999)}`;
      paymentStatus = 'paid';
      // Đa số trả đúng hạn, sạch sẽ -> hoàn cọc đủ; 1/4 có phí trễ/hư hỏng nhẹ cho thật.
      if (Math.random() < 0.25) {
        lateFee = pick([20000, 40000]);
        if (Math.random() < 0.5) {
          damageFee = Math.round(depositPrice * 0.2);
          damageTier = 'minor_damage';
        }
      }
      actualReturnDate = hoursFromNow(-(finishedDaysAgo * 24 - 2));
      refundAmount = Math.max(0, depositPrice - lateFee - damageFee);
      needsInstance = false; // đã trả xong, unit về lại 'available'
      break;
    }
    case 'cancelled': {
      const startOffset = pick([2, 3, 4]);
      createdAt = hoursFromNow(-pick([24, 48, 72]));
      startDate = daysFromNow(startOffset);
      endDate = daysFromNow(startOffset + rentalDays - 1);
      cancelReason = pick(CANCEL_REASONS);
      paymentStatus = paymentMethod === 'VNPAY' && Math.random() < 0.6 ? 'refunded' : 'failed';
      needsInstance = false; // đơn huỷ không giữ hàng
      break;
    }
    case 'overdue': {
      const startedDaysAgo = rentalDays + pick([2, 4, 6]);
      createdAt = hoursFromNow(-(startedDaysAgo * 24 + 10));
      startDate = daysFromNow(-startedDaysAgo);
      endDate = daysFromNow(-startedDaysAgo + rentalDays - 1);
      deliveredAt = hoursFromNow(-(startedDaysAgo * 24 + 1));
      rentingAt = hoursFromNow(-(startedDaysAgo * 24));
      trackingCode = `GHN${Math.floor(100000 + Math.random() * 899999)}`;
      paymentStatus = 'paid';
      break;
    }
  }

  let instanceCodes = [];
  if (needsInstance) {
    const codes = markInstancesRented(variant, 1);
    if (!codes) return null;
    instanceCodes = codes;
    usedInstances.add(costume);
  } else if (status === 'completed') {
    // Trả xong từ lâu -> lấy đúng 1 unit đang 'available' đánh dấu unitCode "lịch sử" cho có vết
    // (không đổi status, chỉ để item.instanceCodes trỏ về 1 unit thật của size này).
    const anyAvailable = (variant.instances || []).find((i) => i.status === 'available');
    instanceCodes = anyAvailable ? [anyAvailable.unitCode] : [];
  }

  const rental = new Rental({
    customerId: user._id,
    items: [{
      costume: costume._id,
      size: variant.size,
      quantity: 1,
      rentalPricePerDay: costume.pricePerDay,
      depositPrice,
      instanceCodes,
    }],
    startDate, endDate, deliveredAt, actualReturnDate,
    totalRentalPrice: rentalPrice,
    totalDeposit: depositPrice,
    shippingFee,
    totalAmount: rentalPrice + depositPrice + shippingFee,
    lateFee, damageFee, refundAmount, damageTier,
    status, paymentMethod, paymentStatus,
    shippingAddress, trackingCode, cancelReason,
    rentingAt,
  });
  rental.createdAt = createdAt;
  rental.updatedAt = createdAt;
  return rental;
}

(async () => {
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 20000 });
  console.log('Connected.');

  const delRental = await Rental.deleteMany({});
  const delIssue = await Issue.deleteMany({});
  console.log(`Đã xoá ${delRental.deletedCount} Rental, ${delIssue.deletedCount} Issue.`);

  const allCostumes = await Costume.find({});
  let resetCount = 0;
  for (const costume of allCostumes) {
    let changed = false;
    for (const variant of costume.variants) {
      for (const inst of variant.instances || []) {
        if (inst.status === 'rented' || inst.status === 'maintenance') {
          inst.status = 'available';
          inst.note = '';
          resetCount++;
          changed = true;
        }
      }
      if (changed) syncVariantFromInstances(variant);
    }
    if (changed) {
      syncCostumeStatusFromVariants(costume);
      await costume.save();
    }
  }
  console.log(`Đã reset ${resetCount} unit (rented/maintenance -> available) do gắn với đơn cũ đã xoá.`);

  const customerRole = await Role.findOne({ name: 'online-customer' });
  const customers = await User.find({ role: customerRole._id });
  const costumes = await Costume.find({ status: { $ne: 'hidden' } });
  console.log(`Dùng ${customers.length} khách hàng thật, ${costumes.length} trang phục thật để tạo đơn mới.`);

  const usedInstances = new Set();
  const created = [];
  for (const { status, count } of STATUS_PLAN) {
    let made = 0;
    let attempts = 0;
    while (made < count && attempts < count * 5) {
      attempts++;
      const rental = await buildOrder(status, customers, costumes, usedInstances);
      if (!rental) continue;
      created.push(rental);
      made++;
    }
    console.log(`  ${status}: tạo ${made}/${count}`);
  }

  for (const costume of usedInstances) {
    await costume.save();
  }
  for (const rental of created) {
    await rental.save();
  }

  console.log(`\nHoàn tất: đã tạo ${created.length} đơn thuê mới, chia theo trạng thái:`);
  const tally = {};
  created.forEach((r) => { tally[r.status] = (tally[r.status] || 0) + 1; });
  console.log(tally);

  await mongoose.disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
