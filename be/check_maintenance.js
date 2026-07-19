const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });

const Category = require('./models/category.model');
const Costume = require('./models/costume.model');

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB.");

  const costumes = await Costume.find({});
  console.log(`Total costumes in DB: ${costumes.length}`);

  // Chuyển 4 sản phẩm cụ thể có biến thể size sang trạng thái 'maintenance' (Bảo trì / Giặt là)
  if (costumes.length > 0) {
    const indices = [0, 2, 4, 6];
    for (const idx of indices) {
      if (costumes[idx]) {
        const costume = costumes[idx];
        if (costume.variants && costume.variants.length > 0) {
          costume.variants[0].status = 'maintenance';
          await costume.save();
          console.log(`Đã đặt Size ${costume.variants[0].size} của "${costume.name}" sang bảo trì.`);
        }
      }
    }
  }

  const maintenanceList = await Costume.find({
    $or: [
      { status: 'maintenance' },
      { 'variants.status': 'maintenance' }
    ]
  }).populate('categoryId', 'name');

  console.log(`\nDanh sách ${maintenanceList.length} trang phục đang bảo trì:`);
  maintenanceList.forEach((c) => {
    const mainVariants = c.variants.filter(v => v.status === 'maintenance').map(v => v.size);
    console.log(`- ${c.name} | Danh mục: ${c.categoryId?.name} | Size bảo trì: ${mainVariants.join(', ') || 'Tất cả'}`);
  });

  mongoose.disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
