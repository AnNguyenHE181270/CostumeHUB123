// Chính sách giá thuê: 1-3 ngày đầu giữ nguyên giá, từ ngày thứ 4 trở đi mỗi ngày tăng thêm 5% giá thuê.
const FREE_DAYS = 3;
const SURCHARGE_PER_EXTRA_DAY = 0.05;

function getRentalPriceFactor(rentalDays) {
  const extraDays = Math.max(0, (rentalDays || 0) - FREE_DAYS);
  return 1 + extraDays * SURCHARGE_PER_EXTRA_DAY;
}

module.exports = { getRentalPriceFactor };
