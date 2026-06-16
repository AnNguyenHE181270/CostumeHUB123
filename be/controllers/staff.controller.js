const Rental = require("../models/rental.model");
const User = require("../models/user.model");
const Costume = require("../models/costume.model");

/**
 * GET /api/staff/dashboard
 * Lấy dữ liệu tổng quan cho Staff Dashboard
 */
const getStaffDashboard = async (req, res) => {
  try {
    const now = new Date();

    // === Mốc thời gian hôm nay ===
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

    // === Mốc 3 ngày tới (cho đơn sắp hết hạn) ===
    const threeDaysLater = new Date(now);
    threeDaysLater.setDate(threeDaysLater.getDate() + 3);

    // === 1. KPI Cards ===
    const [todayOrders, pendingCount, deliveringCount, rentingCount, totalOrders] = await Promise.all([
      Rental.countDocuments({ createdAt: { $gte: todayStart, $lt: todayEnd } }),
      Rental.countDocuments({ status: "pending" }),
      Rental.countDocuments({ status: "delivering" }),
      Rental.countDocuments({ status: "renting" }),
      Rental.countDocuments({}),
    ]);

    // === 2. Phân bổ đơn theo trạng thái (cho Donut Chart) ===
    const statusDistribution = await Rental.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // === 3. Đơn sắp đến hạn trả (đang thuê + endDate trong 3 ngày tới) ===
    const upcomingReturns = await Rental.find({
      status: "renting",
      endDate: { $gte: now, $lte: threeDaysLater },
    })
      .populate("customerId", "fullName email phone")
      .populate("items.costume", "name images")
      .sort({ endDate: 1 })
      .limit(10)
      .lean();

    // === 4. Đơn hàng gần đây (10 đơn mới nhất) ===
    const recentOrders = await Rental.find({})
      .populate("customerId", "fullName email phone avatar")
      .populate("items.costume", "name images")
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    // === 5. Đơn quá hạn (đang thuê + endDate đã qua) ===
    const overdueCount = await Rental.countDocuments({
      status: "renting",
      endDate: { $lt: now },
    });

    // === Format response ===
    res.status(200).json({
      success: true,
      data: {
        kpi: {
          todayOrders,
          pendingCount,
          deliveringCount,
          rentingCount,
          totalOrders,
          overdueCount,
        },
        statusDistribution: statusDistribution.map((s) => ({
          status: s._id,
          count: s.count,
        })),
        upcomingReturns: upcomingReturns.map((r) => ({
          _id: r._id,
          customer: r.customerId
            ? { fullName: r.customerId.fullName, phone: r.customerId.phone }
            : { fullName: "N/A", phone: "" },
          items: (r.items || []).map((item) => ({
            name: item.costume?.name || "Sản phẩm",
            image: item.costume?.images?.[0] || "",
            size: item.size,
            quantity: item.quantity,
          })),
          startDate: r.startDate,
          endDate: r.endDate,
          totalAmount: r.totalAmount,
          status: r.status,
        })),
        recentOrders: recentOrders.map((r) => ({
          _id: r._id,
          customer: r.customerId
            ? { fullName: r.customerId.fullName, avatar: r.customerId.avatar }
            : { fullName: "N/A", avatar: "" },
          items: (r.items || []).map((item) => ({
            name: item.costume?.name || "Sản phẩm",
            image: item.costume?.images?.[0] || "",
          })),
          totalAmount: r.totalAmount,
          status: r.status,
          createdAt: r.createdAt,
          startDate: r.startDate,
          endDate: r.endDate,
        })),
      },
    });
  } catch (error) {
    console.error("Staff Dashboard Error:", error);
    res.status(500).json({ success: false, message: "Lỗi khi tải dữ liệu dashboard" });
  }
};

module.exports = { getStaffDashboard };
