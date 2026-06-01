const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });
const Category = require('./models/category.model');

const categoriesData = [
  {
    name: 'Đồ du lịch',
    description: 'Trang phục dành cho các chuyến đi chơi, khám phá.',
    children: ['Đi biển', 'Leo núi', 'Dã ngoại']
  },
  {
    name: 'Áo dài nữ',
    description: 'Bộ sưu tập áo dài truyền thống và hiện đại.',
    children: ['Áo dài truyền thống', 'Áo dài cách tân', 'Áo dài cưới']
  },
  {
    name: 'Váy tiệc',
    description: 'Trang phục dự tiệc sang trọng, lộng lẫy.',
    children: ['Váy dạ hội', 'Váy cocktail', 'Váy công chúa']
  },
  {
    name: 'Set nữ',
    description: 'Các set đồ bộ thời trang, tiện lợi.',
    children: ['Set đồ công sở', 'Set dạo phố']
  },
  {
    name: 'Trang phục nghi lễ',
    description: 'Trang phục cho các dịp lễ nghi trọng đại.',
    children: ['Đồ tốt nghiệp', 'Cổ phục Việt Nam']
  }
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Đã kết nối MongoDB.");

    // Tùy chọn: Xóa toàn bộ danh mục cũ trước khi seed
    // await Category.deleteMany({});
    // console.log("Đã xóa danh mục cũ.");

    for (const parentData of categoriesData) {
      // Tìm hoặc tạo danh mục cha
      let parentCategory = await Category.findOne({ name: parentData.name });
      if (!parentCategory) {
        parentCategory = new Category({
          name: parentData.name,
          description: parentData.description,
          parentId: null
        });
        await parentCategory.save();
        console.log(`Đã tạo cha: ${parentCategory.name}`);
      }

      // Tạo các danh mục con
      for (const childName of parentData.children) {
        let childCategory = await Category.findOne({ name: childName });
        if (!childCategory) {
          childCategory = new Category({
            name: childName,
            description: `Danh mục con của ${parentData.name}`,
            parentId: parentCategory._id
          });
          await childCategory.save();
          console.log(`  -> Đã tạo con: ${childCategory.name}`);
        }
      }
    }

    console.log("✅ Seed dữ liệu danh mục thành công!");
  } catch (error) {
    console.error("Lỗi seed dữ liệu:", error);
  } finally {
    mongoose.disconnect();
  }
}

seed();
