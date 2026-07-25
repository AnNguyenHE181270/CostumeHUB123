// Chạy 1 lần: node migrations/2026-07-25-backfill-costume-total-rentals.js
// Tính lại costume.totalRentals từ lịch sử Rental hiện có (mọi đơn KHÔNG bị hủy), vì field này
// mới được thêm nên các đơn tạo trước đó chưa từng cộng dồn vào costume. An toàn chạy lại nhiều
// lần (luôn ghi đè bằng số tính lại từ đầu, không cộng dồn thêm).
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
require('dotenv').config();
const mongoose = require('mongoose');
const Costume = require('../models/costume.model');
const Rental = require('../models/rental.model');

(async () => {
  await mongoose.connect(process.env.MONGO_URI, { family: 4 });
  console.log('Connected. Aggregating rental counts...');

  const rows = await Rental.aggregate([
    { $match: { status: { $ne: 'cancelled' } } },
    { $unwind: '$items' },
    { $group: { _id: '$items.costume', rentalCount: { $sum: '$items.quantity' } } },
  ]);

  const countByCostumeId = new Map(rows.map((r) => [r._id.toString(), r.rentalCount]));

  const costumes = await Costume.find({});
  let touched = 0;
  for (const costume of costumes) {
    const newCount = countByCostumeId.get(costume._id.toString()) || 0;
    if (costume.totalRentals !== newCount) {
      costume.totalRentals = newCount;
      await costume.save();
      touched++;
    }
  }

  console.log(`Done. Costumes updated: ${touched}/${costumes.length}.`);
  process.exit(0);
})().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
