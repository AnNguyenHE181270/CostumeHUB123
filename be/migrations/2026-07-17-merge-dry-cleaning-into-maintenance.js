// Gộp trạng thái 'dry_cleaning' vào 'maintenance' (không còn phân biệt sửa chữa/giặt là).
// Chạy 1 lần: node migrations/2026-07-17-merge-dry-cleaning-into-maintenance.js
require('dotenv').config();
const mongoose = require('mongoose');
const Costume = require('../models/costume.model');

(async () => {
  await mongoose.connect(process.env.MONGO_URI);

  const topLevel = await Costume.updateMany(
    { status: 'dry_cleaning' },
    { $set: { status: 'maintenance' } }
  );

  const variants = await Costume.updateMany(
    { 'variants.status': 'dry_cleaning' },
    { $set: { 'variants.$[elem].status': 'maintenance' } },
    { arrayFilters: [{ 'elem.status': 'dry_cleaning' }] }
  );

  console.log(`Costume.status đã cập nhật: ${topLevel.modifiedCount}`);
  console.log(`Costume.variants.status đã cập nhật: ${variants.modifiedCount}`);
  await mongoose.disconnect();
  process.exit(0);
})();
