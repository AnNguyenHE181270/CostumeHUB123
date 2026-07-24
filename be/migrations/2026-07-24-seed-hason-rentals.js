// Chạy 1 lần: node migrations/2026-07-24-seed-hason-rentals.js
// Tạo THÊM (không xoá dữ liệu cũ) ~20 đơn thuê thật cho riêng tài khoản hason.ls.it@gmail.com, để có
// dữ liệu test cho: luồng "Xác nhận đã giao" (delivering có trackingCode), luồng quá hạn, và luồng
// trả hàng/hoàn tiền (một số đơn 'renting' có rentingAt trong vòng ISSUE_REPORT_WINDOW_MS gần đây
// để nút "Trả hàng/Hoàn tiền" còn hiển thị được).
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
require('dotenv').config();
const mongoose = require('mongoose');
const Rental = require('../models/rental.model');
const Costume = require('../models/costume.model');
const User = require('../models/user.model');
const { getRentalPriceFactor } = require('../utils/pricing.util');
const { markInstancesRented } = require('../services/costume.service');

const TARGET_EMAIL = 'hason.ls.it@gmail.com';
const ISSUE_REPORT_WINDOW_MS = 3 * 60 * 60 * 1000; // khớp issue.service.js

// Chủ yếu 'delivering' (có mã vận đơn để test xác nhận đã giao), 'renting', 'overdue' — theo đúng yêu cầu.
// Thêm 1 ít 'delivered' vì FE gộp chung tab "Đang giao đến bạn" với 'delivering', hữu ích để test luồng
// "Xác nhận đã nhận hàng" riêng biệt.
const STATUS_PLAN = [
  { status: 'delivering', count: 4 },
  { status: 'delivered', count: 3 },
  { status: 'renting', count: 8 }, // 3 trong số này sẽ có rentingAt gần đây (còn hạn khiếu nại)
  { status: 'overdue', count: 5 },
];
const RENTING_RECENT_COUNT = 3; // số đơn 'renting' cố tình đặt rentingAt trong window khiếu nại

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function daysFromNow(n) {
  const d = new Date();
  d.setHours(11, 0, 0, 0);
  d.setDate(d.getDate() + n);
  return d;
}
function hoursFromNow(n) {
  return new Date(Date.now() + n * 60 * 60 * 1000);
}

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
  return {
    receiverName: user.fullName || 'Khách hàng',
    receiverPhone: user.phone || '0900000000',
    province: 'Hà Nội', district: 'Cầu Giấy', ward: 'Dịch Vọng',
    addressDetail: `Số ${Math.ceil(Math.random() * 200)} đường Xuân Thuỷ`,
    note: '',
  };
}

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

async function buildOrder(status, user, costumes, usedInstances, opts = {}) {
  const pickResult = pickAvailableCostume(costumes, 1);
  if (!pickResult) return null;
  const { costume, variant } = pickResult;

  const preferredDays = pick([2, 3, 4, 5]);
  const rentalDays = clampRentalDays(preferredDays, costume);
  const { rentalPrice, depositPrice } = priceItem(costume, rentalDays);
  const shippingFee = pick([0, 20000, 25000, 30000]);
  const shippingAddress = buildShippingAddress(user);
  const paymentMethod = Math.random() < 0.7 ? 'VNPAY' : 'Cash';

  let startDate, endDate, createdAt, deliveredAt = null, rentingAt = null;
  let trackingCode = '';

  switch (status) {
    case 'delivering': {
      // Chỉ pick() offset MỘT LẦN rồi dùng lại cho cả start/end, tránh bug endDate < startDate.
      const startOffset = pick([0, 1]);
      createdAt = hoursFromNow(-pick([6, 12, 20]));
      startDate = daysFromNow(startOffset);
      endDate = daysFromNow(startOffset + rentalDays - 1);
      trackingCode = `GHN${Math.floor(100000 + Math.random() * 899999)}`;
      break;
    }
    case 'delivered': {
      createdAt = hoursFromNow(-pick([15, 24, 30]));
      startDate = daysFromNow(0);
      endDate = daysFromNow(rentalDays - 1);
      deliveredAt = hoursFromNow(-pick([1, 2, 3]));
      trackingCode = `GHN${Math.floor(100000 + Math.random() * 899999)}`;
      break;
    }
    case 'renting': {
      if (opts.recentRenting) {
        // Trong window khiếu nại (< 3 tiếng) — đủ điều kiện bấm "Trả hàng/Hoàn tiền".
        const rentingHoursAgo = pick([0.5, 1, 1.5]);
        startDate = daysFromNow(0);
        endDate = daysFromNow(rentalDays);
        deliveredAt = hoursFromNow(-(rentingHoursAgo + 0.5));
        rentingAt = hoursFromNow(-rentingHoursAgo);
        createdAt = hoursFromNow(-(rentingHoursAgo + 6));
      } else {
        // Đang thuê bình thường, đã qua window khiếu nại từ lâu, nhưng vẫn còn hạn trả.
        const startedDaysAgo = pick([1, 2]);
        createdAt = hoursFromNow(-(startedDaysAgo * 24 + 6));
        startDate = daysFromNow(-startedDaysAgo);
        endDate = daysFromNow(Math.max(1, rentalDays - startedDaysAgo));
        deliveredAt = hoursFromNow(-(startedDaysAgo * 24 + 1));
        rentingAt = hoursFromNow(-(startedDaysAgo * 24));
      }
      trackingCode = `GHN${Math.floor(100000 + Math.random() * 899999)}`;
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
      break;
    }
  }

  const codes = markInstancesRented(variant, 1);
  if (!codes) return null;
  usedInstances.add(costume);

  const rental = new Rental({
    customerId: user._id,
    items: [{
      costume: costume._id,
      size: variant.size,
      quantity: 1,
      rentalPricePerDay: costume.pricePerDay,
      depositPrice,
      instanceCodes: codes,
    }],
    startDate, endDate, deliveredAt,
    totalRentalPrice: rentalPrice,
    totalDeposit: depositPrice,
    shippingFee,
    totalAmount: rentalPrice + depositPrice + shippingFee,
    status, paymentMethod, paymentStatus: 'paid',
    shippingAddress, trackingCode,
    rentingAt,
  });
  rental.createdAt = createdAt;
  rental.updatedAt = createdAt;
  return rental;
}

(async () => {
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 20000 });
  console.log('Connected.');

  const user = await User.findOne({ email: TARGET_EMAIL });
  if (!user) throw new Error(`Không tìm thấy user với email ${TARGET_EMAIL}`);
  console.log(`Seed cho user: ${user.fullName} (${user._id})`);

  const costumes = await Costume.find({ status: { $ne: 'hidden' } });
  console.log(`Có ${costumes.length} trang phục còn hiển thị để chọn.`);

  const usedInstances = new Set();
  const created = [];
  let recentRentingMade = 0;

  for (const { status, count } of STATUS_PLAN) {
    let made = 0;
    let attempts = 0;
    while (made < count && attempts < count * 6) {
      attempts++;
      const recentRenting = status === 'renting' && recentRentingMade < RENTING_RECENT_COUNT;
      const rental = await buildOrder(status, user, costumes, usedInstances, { recentRenting });
      if (!rental) continue;
      created.push(rental);
      made++;
      if (recentRenting) recentRentingMade++;
    }
    console.log(`  ${status}: tạo ${made}/${count}`);
  }

  for (const costume of usedInstances) {
    await costume.save();
  }
  for (const rental of created) {
    await rental.save();
  }

  console.log(`\nHoàn tất: đã tạo ${created.length} đơn thuê mới cho ${TARGET_EMAIL}.`);
  console.log(`  Trong đó ${recentRentingMade} đơn 'renting' có rentingAt trong vòng ${ISSUE_REPORT_WINDOW_MS / 3600000}h (còn hạn khiếu nại).`);
  const tally = {};
  created.forEach((r) => { tally[r.status] = (tally[r.status] || 0) + 1; });
  console.log(tally);

  await mongoose.disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
