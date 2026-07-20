const Rental = require('../models/rental.model');
const Costume = require('../models/costume.model');
const Category = require('../models/category.model');
const User = require('../models/user.model');
const Issue = require('../models/issue.model');
const TransactionHistory = require('../models/transactionHistory.model');

// Helper: xây filter ngày tháng cho createdAt
const buildDateFilter = (startDate, endDate) => {
  const filter = {};
  if (startDate) filter.$gte = new Date(startDate);
  if (endDate) filter.$lte = new Date(endDate);
  return Object.keys(filter).length ? { createdAt: filter } : {};
};

// ─────────────────────────────────────────────────────────────────
// 1. DOANH THU — Theo tháng, so sánh kỳ trước, theo phương thức TT
// ─────────────────────────────────────────────────────────────────
const getRevenueReport = async (startDate, endDate) => {
  const validStatuses = ['delivering', 'delivered', 'renting', 'returning', 'completed', 'overdue'];
  const dateFilter = buildDateFilter(startDate, endDate);

  const orders = await Rental.find(
    { status: { $in: validStatuses }, ...dateFilter },
    'totalAmount createdAt paymentMethod'
  );

  const totalRevenue = orders.reduce((s, o) => s + o.totalAmount, 0);
  const orderCount = orders.length;

  // Theo tháng
  const monthlyMap = {};
  orders.forEach(o => {
    const d = new Date(o.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthlyMap[key] = (monthlyMap[key] || 0) + o.totalAmount;
  });
  const revenueByMonth = Object.entries(monthlyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, total]) => ({ month, total }));

  // Theo phương thức thanh toán
  const paymentMap = {};
  orders.forEach(o => {
    const pm = o.paymentMethod || 'Unknown';
    if (!paymentMap[pm]) paymentMap[pm] = { count: 0, total: 0 };
    paymentMap[pm].count++;
    paymentMap[pm].total += o.totalAmount;
  });
  const revenueByPaymentMethod = Object.entries(paymentMap).map(([method, v]) => ({
    method, count: v.count, total: v.total,
  }));

  return { totalRevenue, orderCount, revenueByMonth, revenueByPaymentMethod };
};

// ─────────────────────────────────────────────────────────────────
// 2. TOP TRANG PHỤC — thuê nhiều nhất, doanh thu cao nhất
// ─────────────────────────────────────────────────────────────────
const getTopCostumesReport = async (startDate, endDate, limit = 20) => {
  const validStatuses = ['delivering', 'delivered', 'renting', 'returning', 'completed', 'overdue'];
  const dateFilter = buildDateFilter(startDate, endDate);

  const orders = await Rental.find(
    { status: { $in: validStatuses }, ...dateFilter },
    'items totalAmount'
  ).populate('items.costume', 'name categoryId');

  const costumeMap = {}; // costumeId -> { name, category, rentalCount, revenue }

  orders.forEach(order => {
    order.items.forEach(item => {
      const id = item.costume?._id?.toString();
      if (!id) return;
      if (!costumeMap[id]) {
        costumeMap[id] = {
          costumeId: id,
          name: item.costume?.name || 'Không rõ',
          rentalCount: 0,
          revenue: 0,
        };
      }
      costumeMap[id].rentalCount += item.quantity || 1;
      costumeMap[id].revenue += (item.rentalPricePerDay || 0) * (item.quantity || 1);
    });
  });

  const list = Object.values(costumeMap);
  const topByRental = [...list].sort((a, b) => b.rentalCount - a.rentalCount).slice(0, limit);
  const topByRevenue = [...list].sort((a, b) => b.revenue - a.revenue).slice(0, limit);

  return { topByRental, topByRevenue };
};

// ─────────────────────────────────────────────────────────────────
// 3. VÒNG ĐỜI ĐƠN — tỷ lệ, thời gian thuê trung bình
// ─────────────────────────────────────────────────────────────────
const getRentalLifecycleReport = async (startDate, endDate) => {
  const dateFilter = buildDateFilter(startDate, endDate);

  const orders = await Rental.find(
    dateFilter,
    'status startDate endDate actualReturnDate lateFee damageFee'
  );

  const total = orders.length;
  const statusCount = {};
  let totalDays = 0;
  let daysCount = 0;
  let totalLateFee = 0;
  let totalDamageFee = 0;

  orders.forEach(o => {
    statusCount[o.status] = (statusCount[o.status] || 0) + 1;

    if (o.startDate && o.endDate) {
      const days = Math.ceil((new Date(o.endDate) - new Date(o.startDate)) / (1000 * 60 * 60 * 24));
      if (days > 0) { totalDays += days; daysCount++; }
    }

    totalLateFee += o.lateFee || 0;
    totalDamageFee += o.damageFee || 0;
  });

  const avgRentalDays = daysCount > 0 ? (totalDays / daysCount).toFixed(1) : 0;

  const lifecycle = [
    { status: 'completed', label: 'Hoàn tất', count: statusCount['completed'] || 0 },
    { status: 'cancelled', label: 'Đã huỷ', count: statusCount['cancelled'] || 0 },
    { status: 'overdue', label: 'Quá hạn', count: statusCount['overdue'] || 0 },
    { status: 'renting', label: 'Đang thuê', count: statusCount['renting'] || 0 },
    { status: 'pending', label: 'Chờ xử lý', count: statusCount['pending'] || 0 },
    { status: 'delivering', label: 'Đang giao', count: statusCount['delivering'] || 0 },
    { status: 'returning', label: 'Đang trả', count: statusCount['returning'] || 0 },
  ];

  return {
    total,
    lifecycle,
    avgRentalDays: parseFloat(avgRentalDays),
    totalLateFee,
    totalDamageFee,
    completionRate: total > 0 ? ((statusCount['completed'] || 0) / total * 100).toFixed(1) : 0,
    cancelRate: total > 0 ? ((statusCount['cancelled'] || 0) / total * 100).toFixed(1) : 0,
    overdueRate: total > 0 ? ((statusCount['overdue'] || 0) / total * 100).toFixed(1) : 0,
  };
};

// ─────────────────────────────────────────────────────────────────
// 4. TỒN KHO — theo từng costume/size
// ─────────────────────────────────────────────────────────────────
const getInventoryDetailReport = async () => {
  const costumes = await Costume.find({}, 'name variants categoryId').populate('categoryId', 'name');

  const rows = [];
  let grandTotal = 0, grandAvailable = 0, grandRented = 0;

  costumes.forEach(c => {
    const variants = c.variants && c.variants.length > 0 ? c.variants : [];
    variants.forEach(v => {
      const total = v.totalStock || 0;
      const available = v.availableStock || 0;
      const rented = Math.max(0, total - available);
      const utilPct = total > 0 ? ((rented / total) * 100).toFixed(1) : '0.0';

      grandTotal += total;
      grandAvailable += available;
      grandRented += rented;

      rows.push({
        name: c.name || '',
        category: c.categoryId?.name || '',
        size: v.size || '—',
        sku: v.sku || '—',
        totalStock: total,
        availableStock: available,
        rentedStock: rented,
        utilizationPct: parseFloat(utilPct),
        status: v.status || 'unknown',
      });
    });
  });

  // Hot/cold: sort by rentedStock desc
  const hotCold = [...rows].sort((a, b) => b.rentedStock - a.rentedStock);

  return {
    summary: { grandTotal, grandAvailable, grandRented },
    rows,
    hotCostumes: hotCold.slice(0, 10),
    coldCostumes: hotCold.slice(-10).reverse(),
  };
};

// ─────────────────────────────────────────────────────────────────
// 5. KHÁCH HÀNG — top thuê nhiều / chi tiêu nhiều, khách mới
// ─────────────────────────────────────────────────────────────────
const getCustomerReport = async (startDate, endDate, limit = 15) => {
  const dateFilter = buildDateFilter(startDate, endDate);
  const validStatuses = ['delivering', 'delivered', 'renting', 'returning', 'completed', 'overdue'];

  const orders = await Rental.find(
    { status: { $in: validStatuses }, ...dateFilter },
    'customerId totalAmount createdAt'
  ).populate('customerId', 'fullName email phone');

  const customerMap = {};
  orders.forEach(o => {
    const id = o.customerId?._id?.toString();
    if (!id) return;
    if (!customerMap[id]) {
      customerMap[id] = {
        customerId: id,
        fullName: o.customerId?.fullName || 'Khách hàng',
        email: o.customerId?.email || '',
        phone: o.customerId?.phone || '',
        rentalCount: 0,
        totalSpent: 0,
      };
    }
    customerMap[id].rentalCount++;
    customerMap[id].totalSpent += o.totalAmount || 0;
  });

  const list = Object.values(customerMap);
  const topByRental = [...list].sort((a, b) => b.rentalCount - a.rentalCount).slice(0, limit);
  const topBySpending = [...list].sort((a, b) => b.totalSpent - a.totalSpent).slice(0, limit);

  // Khách mới trong kỳ — đếm từ Rental (unique customerId)
  const newCustomerFilter = buildDateFilter(startDate, endDate);
  let newCustomers = 0;
  try {
    const newRentals = await Rental.find(newCustomerFilter, 'customerId').lean();
    const uniqueIds = new Set(newRentals.map(r => r.customerId?.toString()).filter(Boolean));
    newCustomers = uniqueIds.size;
  } catch (_) { newCustomers = 0; }

  return { topByRental, topBySpending, newCustomers, totalUniqueCustomers: list.length };
};

// ─────────────────────────────────────────────────────────────────
// 6. KHIẾU NẠI (Issue) — tỷ lệ, lý do phổ biến, hoàn tiền
// ─────────────────────────────────────────────────────────────────
const getIssueReport = async (startDate, endDate) => {
  const dateFilter = buildDateFilter(startDate, endDate);

  const [issues, totalRentals] = await Promise.all([
    Issue.find(dateFilter, 'reason resolution status note createdAt'),
    Rental.countDocuments(buildDateFilter(startDate, endDate)),
  ]);

  const total = issues.length;
  const issueRate = totalRentals > 0 ? ((total / totalRentals) * 100).toFixed(1) : 0;

  const statusCount = {};
  const resolutionCount = {};
  issues.forEach(i => {
    statusCount[i.status] = (statusCount[i.status] || 0) + 1;
    resolutionCount[i.resolution] = (resolutionCount[i.resolution] || 0) + 1;
  });

  const statusBreakdown = Object.entries(statusCount).map(([status, count]) => ({ status, count }));
  const resolutionBreakdown = [
    { resolution: 'Đổi trả (return_refund)', count: resolutionCount['return_refund'] || 0 },
    { resolution: 'Đổi hàng (exchange)', count: resolutionCount['exchange'] || 0 },
  ];

  return {
    total,
    totalRentals,
    issueRate: parseFloat(issueRate),
    statusBreakdown,
    resolutionBreakdown,
  };
};

// ─────────────────────────────────────────────────────────────────
// 7. VÍ ĐIỆN TỬ — TopUpTransaction
// ─────────────────────────────────────────────────────────────────
const getWalletReport = async (startDate, endDate) => {
  const dateFilter = buildDateFilter(startDate, endDate);

  const txns = await TransactionHistory.find(dateFilter, 'amount status createdAt');

  const total = txns.length;
  const success = txns.filter(t => t.status === 'success');
  const failed = txns.filter(t => t.status === 'failed');
  const pending = txns.filter(t => t.status === 'pending');

  const totalTransaction = success.reduce((s, t) => s + (t.amount || 0), 0);

  return {
    total,
    successCount: success.length,
    failedCount: failed.length,
    pendingCount: pending.length,
    totalTransaction,
    successRate: total > 0 ? ((success.length / total) * 100).toFixed(1) : 0,
  };
};

// ─────────────────────────────────────────────────────────────────
// FULL REPORT — gộp tất cả vào 1 request
// ─────────────────────────────────────────────────────────────────
const getFullReport = async (startDate, endDate) => {
  const [revenue, topCostumes, lifecycle, inventory, customers, issues, wallet] = await Promise.all([
    getRevenueReport(startDate, endDate),
    getTopCostumesReport(startDate, endDate),
    getRentalLifecycleReport(startDate, endDate),
    getInventoryDetailReport(),
    getCustomerReport(startDate, endDate),
    getIssueReport(startDate, endDate),
    getWalletReport(startDate, endDate),
  ]);

  return { revenue, topCostumes, lifecycle, inventory, customers, issues, wallet };
};

module.exports = {
  getFullReport,
  getRevenueReport,
  getTopCostumesReport,
  getRentalLifecycleReport,
  getInventoryDetailReport,
  getCustomerReport,
  getIssueReport,
  getWalletReport,
};
