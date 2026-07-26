// Chạy 1 lần: node migrations/2026-07-26-fix-invalid-inspection-status.js
// Một số đơn Rental đang có status="inspection" — giá trị KHÔNG nằm trong enum hợp lệ của schema
// hiện tại (pending/delivering/delivered/renting/returning/completed/cancelled/overdue), chắc chắn
// bị ghi thẳng vào Mongo (không qua app, vì mọi code path của app chỉ gán 1 trong 8 giá trị hợp lệ
// rồi mới .save() — mà .save() validate theo enum sẽ tự chặn giá trị sai). Vì .save() luôn validate
// TOÀN BỘ document, bất kỳ thao tác nào khác trên các đơn này (VD: confirmRefund) cũng bị chặn theo
// ("Rental validation failed: status: `inspection` is not a valid enum value..."). Script này dùng
// updateMany (không qua .save(), không validate lại toàn document) để sửa thẳng các đơn đó về
// "returning" — trạng thái đúng nhất với ý "đơn đã về tay shop, đang chờ kiểm tra đồ trả".
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
require('dotenv').config();
const mongoose = require('mongoose');
const Rental = require('../models/rental.model');

(async () => {
  await mongoose.connect(process.env.MONGO_URI, { family: 4 });
  console.log('Connected. Scanning for invalid status="inspection"...');

  const found = await Rental.countDocuments({ status: 'inspection' });
  console.log(`Tìm thấy ${found} đơn có status="inspection".`);

  if (found > 0) {
    const result = await Rental.updateMany(
      { status: 'inspection' },
      { $set: { status: 'returning' } }
    );
    console.log(`Đã sửa ${result.modifiedCount} đơn sang status="returning".`);
  }

  await mongoose.disconnect();
  process.exit(0);
})().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
