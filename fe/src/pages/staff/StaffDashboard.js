import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faClipboardList,
  faClock,
  faTruck,
  faKey,
  faExclamationTriangle,
  faTable,
  faSpinner,
  faCalendarAlt,
  faChartPie,
} from "@fortawesome/free-solid-svg-icons";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:9999";

// Màu + label cho từng trạng thái đơn hàng
const STATUS_MAP = {
  pending:         { label: "Chờ duyệt",     bg: "bg-yellow-100", text: "text-yellow-800", color: "#eab308" },
  awaitingPayment: { label: "Chờ thanh toán", bg: "bg-orange-100", text: "text-orange-800", color: "#f97316" },
  preparing:       { label: "Đang xử lý",    bg: "bg-blue-100",   text: "text-blue-800",   color: "#3b82f6" },
  delivering:      { label: "Đang giao",      bg: "bg-indigo-100", text: "text-indigo-800", color: "#6366f1" },
  renting:         { label: "Đang thuê",      bg: "bg-emerald-100",text: "text-emerald-800",color: "#10b981" },
  completed:       { label: "Hoàn tất",       bg: "bg-gray-100",   text: "text-gray-800",   color: "#6b7280" },
  cancelled:       { label: "Đã hủy",         bg: "bg-red-100",    text: "text-red-800",    color: "#ef4444" },
  overdue:         { label: "Quá hạn",         bg: "bg-red-100",    text: "text-red-800",    color: "#dc2626" },
};

// Format tiền VNĐ
const formatPrice = (price) => {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price || 0);
};

// Format ngày
const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
};

// Tính số ngày còn lại
const daysRemaining = (endDate) => {
  if (!endDate) return 0;
  const diff = new Date(endDate) - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

export default function StaffDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const token = localStorage.getItem("token") || sessionStorage.getItem("token");
        const res = await fetch(`${API_URL}/api/staff/dashboard`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (json.success) {
          setData(json.data);
        } else {
          setError(json.message || "Không thể tải dữ liệu");
        }
      } catch (err) {
        setError("Lỗi kết nối máy chủ");
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="bg-[#faf9f7] min-h-screen flex items-center justify-center">
        <FontAwesomeIcon icon={faSpinner} className="text-3xl text-[#1a1a1a] animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#faf9f7] min-h-screen flex items-center justify-center">
        <p className="text-red-500 text-sm">{error}</p>
      </div>
    );
  }

  const { kpi, statusDistribution, upcomingReturns, recentOrders } = data;

  // === Donut chart calculation ===
  const totalForChart = statusDistribution.reduce((sum, s) => sum + s.count, 0);
  const donutSegments = [];
  let cumulativePercent = 0;
  statusDistribution.forEach((s) => {
    const percent = totalForChart > 0 ? (s.count / totalForChart) * 100 : 0;
    donutSegments.push({
      ...s,
      percent,
      offset: cumulativePercent,
      color: STATUS_MAP[s.status]?.color || "#9ca3af",
      label: STATUS_MAP[s.status]?.label || s.status,
    });
    cumulativePercent += percent;
  });

  // CSS conic-gradient cho donut chart
  const conicStops = donutSegments
    .map((seg) => `${seg.color} ${seg.offset}% ${seg.offset + seg.percent}%`)
    .join(", ");

  // KPI cards config
  const kpiCards = [
    { title: "Đơn hôm nay",  value: kpi.todayOrders,     icon: faCalendarAlt,        iconBg: "bg-blue-50",    iconColor: "text-blue-600" },
    { title: "Chờ duyệt",    value: kpi.pendingCount,     icon: faClock,              iconBg: "bg-yellow-50",  iconColor: "text-yellow-600" },
    { title: "Đang giao",    value: kpi.deliveringCount,  icon: faTruck,              iconBg: "bg-indigo-50",  iconColor: "text-indigo-600" },
    { title: "Đang thuê",    value: kpi.rentingCount,     icon: faKey,                iconBg: "bg-emerald-50", iconColor: "text-emerald-600" },
  ];

  return (
    <div className="bg-[#faf9f7] min-h-screen flex flex-col">

      {/* === 1. GLOBAL TOOLBAR === */}
      <div className="bg-white border-b border-[#eaeaea] px-6 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold text-[#1a1a1a]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            Tổng Quan
          </h1>
          <span className="text-xs bg-[#f5f5f5] text-[#555] px-2 py-1 rounded">Staff</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-[#999]">
            {new Date().toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" })}
          </span>
        </div>
      </div>

      {/* === 2. DASHBOARD CANVAS === */}
      <div className="flex-1 p-6 overflow-y-auto">

        <h2 className="text-sm font-semibold text-[#999] uppercase tracking-wider mb-4" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
          Quản lý đơn hàng
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {/* === KPI CARDS === */}
          {kpiCards.map((card, i) => (
            <div key={i} className="bg-white border border-[#eaeaea] rounded-lg shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
              <div className={`w-12 h-12 rounded-lg ${card.iconBg} flex items-center justify-center`}>
                <FontAwesomeIcon icon={card.icon} className={`text-lg ${card.iconColor}`} />
              </div>
              <div>
                <p className="text-sm text-[#999] mb-0.5">{card.title}</p>
                <p className="text-2xl font-bold text-[#1a1a1a]">{card.value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-8">

          {/* === DONUT CHART: Phân bổ trạng thái === */}
          <div className="bg-white border border-[#eaeaea] rounded-lg shadow-sm p-5 flex flex-col items-center">
            <div className="flex items-center justify-between w-full mb-5">
              <h3 className="text-sm font-medium text-[#555] flex items-center gap-2">
                <FontAwesomeIcon icon={faChartPie} className="text-[#999]" />
                Phân bổ đơn theo trạng thái
              </h3>
            </div>

            {/* Donut */}
            <div className="relative w-36 h-36 mb-5">
              <div
                className="w-full h-full rounded-full"
                style={{
                  background: totalForChart > 0 ? `conic-gradient(${conicStops})` : "#eaeaea",
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-inner">
                  <span className="text-xl font-bold text-[#1a1a1a]">{totalForChart}</span>
                </div>
              </div>
            </div>

            {/* Legend */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
              {donutSegments.map((seg, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: seg.color }} />
                  <span className="text-[#555]">{seg.label}</span>
                  <span className="text-[#999] ml-auto">{seg.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* === BẢNG: Đơn sắp đến hạn trả === */}
          <div className="bg-white border border-[#eaeaea] rounded-lg shadow-sm p-5 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-[#555] flex items-center gap-2">
                <FontAwesomeIcon icon={faExclamationTriangle} className="text-amber-500" />
                Đơn sắp đến hạn trả
                {kpi.overdueCount > 0 && (
                  <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs font-medium ml-2">
                    {kpi.overdueCount} quá hạn
                  </span>
                )}
              </h3>
            </div>

            {upcomingReturns.length === 0 ? (
              <p className="text-sm text-[#999] text-center py-8">Không có đơn nào sắp đến hạn trả</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-[#eaeaea] text-[#999] text-xs uppercase tracking-wider">
                      <th className="pb-3 pr-4">Khách hàng</th>
                      <th className="pb-3 pr-4">Sản phẩm</th>
                      <th className="pb-3 pr-4">Ngày trả</th>
                      <th className="pb-3 pr-4 text-center">Còn lại</th>
                      <th className="pb-3 text-right">Tổng tiền</th>
                    </tr>
                  </thead>
                  <tbody className="text-[#555]">
                    {upcomingReturns.map((order) => {
                      const days = daysRemaining(order.endDate);
                      return (
                        <tr key={order._id} className="border-b border-[#f0f0f0] hover:bg-[#faf9f7] transition-colors">
                          <td className="py-3 pr-4">
                            <p className="font-medium text-[#1a1a1a] text-sm">{order.customer.fullName}</p>
                            <p className="text-xs text-[#999]">{order.customer.phone}</p>
                          </td>
                          <td className="py-3 pr-4">
                            {order.items.map((item, j) => (
                              <span key={j} className="block text-sm">{item.name} ({item.size}) ×{item.quantity}</span>
                            ))}
                          </td>
                          <td className="py-3 pr-4 text-sm">{formatDate(order.endDate)}</td>
                          <td className="py-3 pr-4 text-center">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                              days <= 0 ? "bg-red-100 text-red-700" : days <= 1 ? "bg-orange-100 text-orange-700" : "bg-yellow-100 text-yellow-700"
                            }`}>
                              {days <= 0 ? "Quá hạn" : `${days} ngày`}
                            </span>
                          </td>
                          <td className="py-3 text-right text-sm font-medium">{formatPrice(order.totalAmount)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* === BẢNG: Đơn hàng gần đây === */}
        <div className="bg-white border border-[#eaeaea] rounded-lg shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-[#555] flex items-center gap-2">
              <FontAwesomeIcon icon={faTable} className="text-[#999]" />
              Đơn hàng gần đây
            </h3>
            <span className="text-xs text-[#999]">Tổng cộng: {kpi.totalOrders} đơn</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[#eaeaea] text-[#999] text-xs uppercase tracking-wider">
                  <th className="pb-3 pr-4">Khách hàng</th>
                  <th className="pb-3 pr-4">Sản phẩm</th>
                  <th className="pb-3 pr-4">Ngày tạo</th>
                  <th className="pb-3 pr-4">Thời gian thuê</th>
                  <th className="pb-3 pr-4 text-right">Tổng tiền</th>
                  <th className="pb-3 text-center">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="text-[#555]">
                {recentOrders.map((order) => {
                  const statusInfo = STATUS_MAP[order.status] || { label: order.status, bg: "bg-gray-100", text: "text-gray-700" };
                  return (
                    <tr key={order._id} className="border-b border-[#f0f0f0] hover:bg-[#faf9f7] transition-colors">
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-3">
                          {order.customer.avatar ? (
                            <img src={order.customer.avatar} alt="" className="w-8 h-8 rounded-full object-cover border border-[#eaeaea]" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-[#eaeaea] flex items-center justify-center text-xs font-semibold text-[#555]">
                              {order.customer.fullName?.charAt(0) || "?"}
                            </div>
                          )}
                          <span className="font-medium text-[#1a1a1a]">{order.customer.fullName}</span>
                        </div>
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2">
                          {order.items[0]?.image && (
                            <img src={order.items[0].image} alt="" className="w-8 h-10 rounded object-cover border border-[#eaeaea]" />
                          )}
                          <div>
                            <p className="text-sm line-clamp-1">{order.items[0]?.name || "—"}</p>
                            {order.items.length > 1 && (
                              <p className="text-xs text-[#999]">+{order.items.length - 1} sản phẩm khác</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-sm">{formatDate(order.createdAt)}</td>
                      <td className="py-3 pr-4 text-sm">
                        {formatDate(order.startDate)} — {formatDate(order.endDate)}
                      </td>
                      <td className="py-3 pr-4 text-right text-sm font-medium">{formatPrice(order.totalAmount)}</td>
                      <td className="py-3 text-center">
                        <span className={`${statusInfo.bg} ${statusInfo.text} px-2.5 py-1 rounded-full text-xs font-medium`}>
                          {statusInfo.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {recentOrders.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-[#999] text-sm">Chưa có đơn hàng nào</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
