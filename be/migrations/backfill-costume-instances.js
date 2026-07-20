// Chạy 1 lần: node migrations/backfill-costume-instances.js
// Sinh instances[] (từng unit vật lý cụ thể) cho mọi variant hiện có, dựa trên totalStock/availableStock/status
// hiện tại — để không mất tồn kho khi bắt đầu quản lý theo từng unit. An toàn chạy lại nhiều lần (bỏ qua
// variant đã có instances rồi).
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
require('dotenv').config();
const mongoose = require('mongoose');
const Costume = require('../models/costume.model');
const { backfillInstancesFromCounts, syncVariantFromInstances } = require('../services/costume.service');

(async () => {
  await mongoose.connect(process.env.MONGO_URI, { family: 4 });
  console.log('Connected. Scanning costumes...');

  const costumes = await Costume.find({});
  let touchedCostumes = 0;
  let touchedVariants = 0;
  let totalInstancesCreated = 0;

  for (const costume of costumes) {
    let changed = false;
    for (const variant of costume.variants) {
      const before = variant.instances?.length || 0;
      backfillInstancesFromCounts(variant);
      const after = variant.instances?.length || 0;
      if (after > before) {
        touchedVariants++;
        totalInstancesCreated += after - before;
        changed = true;
      }
      // Đồng bộ lại status dẫn xuất từ instances (VD: variant có 8/13 unit rảnh phải là 'available',
      // không phải 'maintenance' như dữ liệu cũ trước khi có instance riêng biệt).
      const oldStatus = variant.status;
      syncVariantFromInstances(variant);
      if (variant.status !== oldStatus) changed = true;
    }

    // Đồng bộ lại status tổng thể của costume theo đúng logic dùng ở completeMaintenance/inspectReturn.
    const hasAvailableVariant = costume.variants.some((v) => (v.status === 'available' || !v.status) && (v.availableStock || 0) > 0);
    const oldCostumeStatus = costume.status;
    if (!['hidden'].includes(costume.status)) {
      if (hasAvailableVariant) {
        costume.status = 'available';
      } else {
        const allMaintenance = costume.variants.every((v) => v.status === 'maintenance');
        costume.status = allMaintenance ? 'maintenance' : 'out_of_stock';
      }
    }
    if (costume.status !== oldCostumeStatus) changed = true;

    if (changed) {
      await costume.save();
      touchedCostumes++;
    }
  }

  console.log(`Done. Costumes updated: ${touchedCostumes}, variants backfilled: ${touchedVariants}, instances created: ${totalInstancesCreated}.`);
  process.exit(0);
})().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
