// Chạy 1 lần: node migrations/2026-07-23-reconcile-rental-instance-codes.js
// Đối soát đơn thuê đang hoạt động với instances[] trong kho, sau refactor "instances[] là nguồn
// sự thật duy nhất" (2026-07-23):
//   1. Với mỗi costume+size, số unit 'rented' trong kho phải ĐÚNG BẰNG tổng quantity của các đơn
//      active (pending/delivering/delivered/renting/returning/overdue). Thiếu -> đánh dấu thêm
//      unit available (cũ nhất trước); thừa -> nhả về available.
//   2. Gán instanceCodes cho các item đơn cũ chưa có — để khi hủy/trả/khiếu nại các đơn này,
//      hệ thống nhả ra đúng unit thay vì phải fallback.
// An toàn chạy lại nhiều lần (lần 2 sẽ không còn gì để sửa).
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
require('dotenv').config();
const mongoose = require('mongoose');
const Costume = require('../models/costume.model');
const Rental = require('../models/rental.model');
const {
  backfillInstancesFromCounts,
  syncVariantFromInstances,
  syncCostumeStatusFromVariants,
} = require('../services/costume.service');

const ACTIVE_STATUSES = ['pending', 'delivering', 'delivered', 'renting', 'returning', 'overdue'];

(async () => {
  await mongoose.connect(process.env.MONGO_URI, { family: 4 });
  console.log('Connected. Loading active rentals...');

  const rentals = await Rental.find({ status: { $in: ACTIVE_STATUSES } });

  // Gom nhu cầu theo costume+size: tổng qty và danh sách item cần gán codes
  const demand = new Map(); // key `${costumeId}|${size}` -> { qty, items: [{ rental, item }] }
  for (const rental of rentals) {
    for (const item of rental.items) {
      if (!item.costume) continue;
      const key = `${item.costume.toString()}|${item.size}`;
      if (!demand.has(key)) demand.set(key, { qty: 0, items: [] });
      const d = demand.get(key);
      d.qty += item.quantity;
      d.items.push({ rental, item });
    }
  }

  const costumeIds = [...new Set([...demand.keys()].map((k) => k.split('|')[0]))];
  const costumes = await Costume.find({ _id: { $in: costumeIds } });
  const costumeMap = new Map(costumes.map((c) => [c._id.toString(), c]));

  let marked = 0, released = 0, codesAssigned = 0, shortages = 0;
  const changedCostumes = new Set();
  const changedRentals = new Set();

  for (const [key, d] of demand) {
    const [costumeId, size] = key.split('|');
    const costume = costumeMap.get(costumeId);
    if (!costume) { console.warn(`⚠ Không tìm thấy costume ${costumeId} (đơn tham chiếu size ${size})`); continue; }
    const variant = costume.variants.find((v) => v.size === size);
    if (!variant) { console.warn(`⚠ ${costume.name} không có size ${size} (đơn cũ tham chiếu)`); continue; }

    backfillInstancesFromCounts(variant);
    const rented = () => variant.instances.filter((i) => i.status === 'rented');
    const availables = () =>
      variant.instances
        .filter((i) => i.status === 'available')
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    // 1. Cân số unit 'rented' về đúng tổng qty đơn active
    let diff = d.qty - rented().length;
    if (diff > 0) {
      const free = availables();
      if (free.length < diff) {
        shortages++;
        console.warn(`⚠ ${costume.name} size ${size}: cần đánh dấu thêm ${diff} unit nhưng chỉ còn ${free.length} available — đánh dấu hết mức có thể.`);
      }
      free.slice(0, diff).forEach((inst) => { inst.status = 'rented'; marked++; });
    } else if (diff < 0) {
      rented()
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
        .slice(0, -diff)
        .forEach((inst) => { inst.status = 'available'; released++; });
      console.log(`↩ ${costume.name} size ${size}: nhả ${-diff} unit 'rented' thừa (không còn đơn active nào giữ).`);
    }

    // 2. Gán instanceCodes cho item chưa có — dùng các code rented chưa bị đơn khác claim
    const claimed = new Set();
    d.items.forEach(({ item }) => (item.instanceCodes || []).forEach((c) => claimed.add(c)));
    const freeCodes = rented().map((i) => i.unitCode).filter((c) => !claimed.has(c));
    for (const { rental, item } of d.items) {
      if (item.instanceCodes && item.instanceCodes.length > 0) continue;
      const take = freeCodes.splice(0, item.quantity);
      if (take.length > 0) {
        item.instanceCodes = take;
        codesAssigned += take.length;
        changedRentals.add(rental);
      }
    }

    syncVariantFromInstances(variant);
    changedCostumes.add(costume);
  }

  for (const costume of changedCostumes) {
    syncCostumeStatusFromVariants(costume);
    await costume.save();
  }
  for (const rental of changedRentals) await rental.save();

  console.log(`Xong: đánh dấu thêm ${marked} unit rented, nhả ${released} unit thừa, gán ${codesAssigned} instanceCodes cho ${changedRentals.size} đơn, ${shortages} chỗ thiếu hàng vật lý.`);
  await mongoose.disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
