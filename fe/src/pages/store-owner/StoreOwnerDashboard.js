import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEllipsisV, faDownload, faCalendarAlt, faChartBar, faTable,
  faFilePdf, faFileWord, faFileExcel, faSpinner, faChevronDown,
  faChartLine, faBoxes, faExclamationTriangle, faMotorcycle,
  faCheckCircle, faTimesCircle, faClock, faWarehouse, faFire,
  faSnowflake, faUsers, faArrowUp, faArrowDown, faMinus,
} from "@fortawesome/free-solid-svg-icons";
import { useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  LineElement, PointElement, Title, Tooltip, Legend, ArcElement, Filler,
} from 'chart.js';
import * as XLSX from "xlsx";

ChartJS.register(
  CategoryScale, LinearScale, BarElement, LineElement, PointElement,
  Title, Tooltip, Legend, ArcElement, Filler
);

const CATEGORY_COLORS = ['#3b82f6','#f59e0b','#10b981','#ef4444','#8b5cf6','#ec4899','#14b8a6','#f97316'];
const API = "http://localhost:9999";

const fmtVND = (n) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n || 0);
const fmtNum = (n) => new Intl.NumberFormat("vi-VN").format(n || 0);
const fmtPct = (n) => `${parseFloat(n || 0).toFixed(1)}%`;

const TABS = [
  { id: "revenue",    label: "Doanh thu",      icon: faChartLine,         color: "blue"   },
  { id: "operations", label: "Vận hành thuê",   icon: faMotorcycle,        color: "amber"  },
  { id: "inventory",  label: "Tồn kho",         icon: faBoxes,             color: "emerald"},
  { id: "issues",     label: "Khiếu nại",       icon: faExclamationTriangle, color: "rose" },
];

const TAB_COLORS = {
  blue:    { active: "bg-blue-600 text-white border-blue-600",   idle: "text-blue-600 border-blue-200 bg-blue-50 hover:bg-blue-100"    },
  amber:   { active: "bg-amber-500 text-white border-amber-500", idle: "text-amber-600 border-amber-200 bg-amber-50 hover:bg-amber-100" },
  emerald: { active: "bg-emerald-600 text-white border-emerald-600", idle: "text-emerald-600 border-emerald-200 bg-emerald-50 hover:bg-emerald-100" },
  rose:    { active: "bg-rose-600 text-white border-rose-600",   idle: "text-rose-600 border-rose-200 bg-rose-50 hover:bg-rose-100"    },
};

// ── KPI stat card ──────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, sub, color = "blue", trend }) {
  const bg = { blue: "bg-blue-50 text-blue-600", amber: "bg-amber-50 text-amber-500",
    emerald: "bg-emerald-50 text-emerald-600", rose: "bg-rose-50 text-rose-600",
    purple: "bg-purple-50 text-purple-600", orange: "bg-orange-50 text-orange-500",
    teal: "bg-teal-50 text-teal-600", slate: "bg-slate-100 text-slate-500" };
  return (
    <div className="bg-white border border-[#eaeaea] rounded-xl p-4 flex flex-col gap-2 shadow-sm">
      <div className="flex items-center justify-between">
        <span className={`w-9 h-9 rounded-lg ${bg[color] || bg.blue} flex items-center justify-center text-sm flex-shrink-0`}>
          <FontAwesomeIcon icon={icon} />
        </span>
        {trend !== undefined && (
          <span className={`text-xs font-semibold flex items-center gap-1 ${trend > 0 ? "text-emerald-600" : trend < 0 ? "text-rose-500" : "text-slate-400"}`}>
            <FontAwesomeIcon icon={trend > 0 ? faArrowUp : trend < 0 ? faArrowDown : faMinus} className="text-[10px]" />
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div>
        <div className="text-xl font-bold text-[#1a1a1a] leading-tight">{value}</div>
        <div className="text-xs text-[#999] mt-0.5">{label}</div>
        {sub && <div className="text-[10px] text-[#bbb] mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

// ── Section title ──────────────────────────────────────────────────────────────
function SectionTitle({ children }) {
  return (
    <h3 className="text-[11px] font-bold text-[#999] uppercase tracking-widest mb-3 mt-2 flex items-center gap-2">
      <span className="w-3 h-px bg-[#ddd] inline-block" />
      {children}
      <span className="flex-1 h-px bg-[#f0f0f0] inline-block" />
    </h3>
  );
}

// ── Simple rank list ───────────────────────────────────────────────────────────
function RankList({ items, valueKey, labelKey, formatValue, maxItems = 7, accentColor = "#3b82f6" }) {
  if (!items?.length) return <p className="text-xs text-[#bbb] py-4 text-center">Không có dữ liệu</p>;
  const max = items[0][valueKey] || 1;
  return (
    <div className="flex flex-col gap-2">
      {items.slice(0, maxItems).map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-5 text-[10px] font-bold text-[#ccc] flex-shrink-0 text-right">#{i + 1}</span>
          <span className="text-xs text-[#444] w-36 truncate flex-shrink-0">{item[labelKey]}</span>
          <div className="flex-1 bg-[#f5f5f5] rounded-full h-1.5">
            <div className="h-1.5 rounded-full transition-all duration-500" style={{ width: `${Math.round((item[valueKey] || 0) / max * 100)}%`, backgroundColor: accentColor }} />
          </div>
          <span className="text-xs font-bold text-[#333] w-20 text-right flex-shrink-0">{formatValue ? formatValue(item[valueKey]) : item[valueKey]}</span>
        </div>
      ))}
    </div>
  );
}

// ── Status pill ────────────────────────────────────────────────────────────────
const STATUS_STYLES = {
  completed: "bg-emerald-100 text-emerald-700", cancelled: "bg-rose-100 text-rose-600",
  overdue: "bg-orange-100 text-orange-700", renting: "bg-blue-100 text-blue-700",
  pending: "bg-gray-100 text-gray-600", delivering: "bg-amber-100 text-amber-700",
  returning: "bg-purple-100 text-purple-700", delivered: "bg-teal-100 text-teal-700",
};
function StatusPill({ status }) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${STATUS_STYLES[status] || "bg-gray-100 text-gray-600"}`}>
      {status}
    </span>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
export default function FrappeStyleDashboard() {
  const { token } = useAuth();

  // ── State ──────────────────────────────────────────────────────────────────
  const [activeTab,      setActiveTab]      = useState("revenue");
  const [initialLoading, setInitialLoading] = useState(true);
  const [tabLoading,     setTabLoading]     = useState(false);
  const [excelExporting, setExcelExporting] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showDateMenu,   setShowDateMenu]   = useState(false);
  const [dateRange,      setDateRange]      = useState("Tất cả thời gian");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate,   setCustomEndDate]   = useState("");

  // Legacy dashboard data (tab Doanh thu - top section)
  const [revenue,                    setRevenue]                    = useState(0);
  const [activeOrdersCount,          setActiveOrdersCount]          = useState(0);
  const [totalActiveCostumes,        setTotalActiveCostumes]        = useState(0);
  const [inventoryUtilizationPercentage, setInventoryUtilizationPercentage] = useState(0);
  const [totalStock,                 setTotalStock]                 = useState(0);
  const [currentlyRented,            setCurrentlyRented]            = useState(0);
  const [categoryData,               setCategoryData]               = useState([]);
  const [recentOrders,               setRecentOrders]               = useState([]);
  const [revenueByMonth,             setRevenueByMonth]             = useState([]);

  // Full report data (API /reports/full)
  const [reportData, setReportData] = useState(null);

  const menuRef = useRef(null);

  // ── Date helpers ────────────────────────────────────────────────────────────
  const getDateParams = useCallback(() => {
    const now = new Date();
    let start = null, end = new Date();
    if (dateRange === "Hôm nay") start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    else if (dateRange === "7 ngày qua") start = new Date(now.getTime() - 7 * 86400000);
    else if (dateRange === "30 ngày qua") start = new Date(now.getTime() - 30 * 86400000);
    else if (dateRange === "Tháng này") start = new Date(now.getFullYear(), now.getMonth(), 1);
    else if (dateRange === "Tất cả thời gian") { start = null; end = null; }
    else if (dateRange.startsWith("Từ") && customStartDate && customEndDate) {
      start = new Date(customStartDate); end = new Date(customEndDate);
    }
    return { startDate: start ? start.toISOString() : "", endDate: end ? end.toISOString() : "" };
  }, [dateRange, customStartDate, customEndDate]);

  // ── Fetch legacy dashboard ─────────────────────────────────────────────────
  const fetchDashboardData = useCallback(async () => {
    try {
      const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
      const { startDate, endDate } = getDateParams();
      const q = `?startDate=${startDate}&endDate=${endDate}`;
      const [resRev, resActive, resInv, resOrders] = await Promise.all([
        fetch(`${API}/api/rentals/dashboard/revenue${q}`, { headers }),
        fetch(`${API}/api/rentals/dashboard/active-rentals${q}`, { headers }),
        fetch(`${API}/api/rentals/dashboard/inventory-utilization${q}`, { headers }),
        fetch(`${API}/api/rentals${q}`, { headers }),
      ]);
      if (resRev.ok) {
        const d = await resRev.json();
        setRevenue(d.totalRevenue || 0);
        setRevenueByMonth(d.revenueByMonth || []);
      }
      if (resActive.ok) {
        const d = await resActive.json();
        setActiveOrdersCount(d.activeOrdersCount || 0);
        setTotalActiveCostumes(d.totalActiveCostumes || 0);
      }
      if (resInv.ok) {
        const d = await resInv.json();
        setInventoryUtilizationPercentage(d.utilizationPercentage || 0);
        setTotalStock(d.totalStock || 0);
        setCurrentlyRented(d.currentlyRented || 0);
        setCategoryData(d.categoryBreakdown || []);
      }
      if (resOrders.ok) {
        const d = await resOrders.json();
        const arr = Array.isArray(d) ? d : (d.rentals || d.data || []);
        setRecentOrders(arr.slice(0, 5));
      }
    } catch (err) { console.error("Dashboard fetch error:", err); }
  }, [token, getDateParams]);

  // ── Fetch full report ──────────────────────────────────────────────────────
  const fetchFullReport = useCallback(async () => {
    try {
      const { startDate, endDate } = getDateParams();
      const q = `?startDate=${startDate}&endDate=${endDate}`;
      const res = await fetch(`${API}/api/reports/full${q}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setReportData(await res.json());
    } catch (err) { console.error("Full report error:", err); }
  }, [token, getDateParams]);

  // ── Initial + date change ──────────────────────────────────────────────────
  useEffect(() => {
    if (!token) return;
    setTabLoading(true);
    Promise.all([fetchDashboardData(), fetchFullReport()]).finally(() => {
      setInitialLoading(false);
      setTabLoading(false);
    });
  }, [token, fetchDashboardData, fetchFullReport]);

  const handleApplyCustomDate = () => {
    if (customStartDate && customEndDate) {
      setDateRange(`Từ ${new Date(customStartDate).toLocaleDateString("vi-VN")} đến ${new Date(customEndDate).toLocaleDateString("vi-VN")}`);
      setShowDateMenu(false);
    }
  };

  // Click outside to close menus
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowExportMenu(false); setShowDateMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Export helpers ─────────────────────────────────────────────────────────
  const fetchFullReportData = async () => {
    const { startDate, endDate } = getDateParams();
    const q = `?startDate=${startDate}&endDate=${endDate}`;
    const res = await fetch(`${API}/api/reports/full${q}`, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error("Không thể tải dữ liệu báo cáo toàn diện");
    return res.json();
  };

  const buildFullHTML = (r, now) => {
    const s = (num, title) => `<div style="font-size:13px;font-weight:bold;text-transform:uppercase;letter-spacing:1px;margin-top:26px;margin-bottom:8px;padding:5px 10px;background:#f5f5f5;border-left:4px solid #1a1a1a;">${num}. ${title}</div>`;
    const kpi = (cells) => `<table style="width:100%;border-collapse:collapse;margin-bottom:10px;"><tr>${cells.map(c => `<td style="padding:10px;background:#f9f9f9;border:1px solid #eaeaea;text-align:center;"><div style="font-size:11px;color:#777;text-transform:uppercase;">${c.label}</div><div style="font-size:15px;font-weight:bold;margin-top:3px;">${c.value}</div></td>`).join("")}</tr></table>`;
    const tbl = (headers, rows) => `<table style="width:100%;border-collapse:collapse;font-size:12px;margin-bottom:8px;"><thead><tr>${headers.map(h => `<th style="background:#1a1a1a;color:#fff;padding:7px 8px;text-align:left;">${h}</th>`).join("")}</tr></thead><tbody>${rows.map((rowArr, i) => `<tr style="background:${i % 2 ? "#fafafa" : "#fff"}">${rowArr.map(c => `<td style="border-bottom:1px solid #eaeaea;padding:6px 8px;">${c}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
    const data = r || reportData || {};
    const { revenue: rev, lifecycle, topCostumes, customers, issues, wallet, inventory } = data;
    const revenueTrend = revenueByMonth.length ? revenueByMonth : (rev?.revenueByMonth || []);
    const categories = categoryData || [];
    const orders = recentOrders || [];

    let title = "BÁO CÁO DASHBOARD";
    let tabTitle = "Dashboard";
    let bodyContent = "";

    if (activeTab === "revenue") {
      title = "BÁO CÁO DOANH THU & TÀI CHÍNH";
      tabTitle = "Doanh thu";
      bodyContent = `
        ${s(1,"Tổng quan tài chính")}${kpi([
          {label:"Tổng doanh thu",value:fmtVND(revenue)},
          {label:"Số đơn phát sinh",value:`${fmtNum(activeOrdersCount)} đơn`},
          {label:"Trang phục đang thuê",value:`${fmtNum(currentlyRented)} bộ`},
          {label:"Tổng kho",value:`${fmtNum(totalStock)} bộ`}
        ])}
        ${s(2,"Doanh thu theo phương thức thanh toán")}${rev?.revenueByPaymentMethod?.length ? tbl(["Phương thức","Số đơn","Doanh thu"],rev.revenueByPaymentMethod.map(p=>[p.method,fmtNum(p.count),fmtVND(p.total)])) : "<p style='color:#999;font-size:12px;'>Không có dữ liệu</p>"}
        ${s(3,"Xu hướng doanh thu theo tháng")}${revenueTrend?.length ? tbl(["Tháng","Doanh thu"],revenueTrend.map(m=>[`T${Number(m.month.split("-")[1])}/${m.month.split("-")[0]}`,fmtVND(m.total)])) : "<p style='color:#999;font-size:12px;'>Không có dữ liệu</p>"}
        ${s(4,"Top trang phục thuê nhiều nhất")}${topCostumes?.topByRental?.length?tbl(["#","Tên trang phục","Lượt thuê","Doanh thu"],topCostumes.topByRental.slice(0,10).map((c,i)=>[i+1,c.name,fmtNum(c.rentalCount),fmtVND(c.revenue)])) : "<p style='color:#999;font-size:12px;'>Không có dữ liệu</p>"}
        ${s(5,"Top trang phục doanh thu cao nhất")}${topCostumes?.topByRevenue?.length?tbl(["#","Tên trang phục","Doanh thu"],topCostumes.topByRevenue.slice(0,10).map((c,i)=>[i+1,c.name,fmtVND(c.revenue)])) : "<p style='color:#999;font-size:12px;'>Không có dữ liệu</p>"}
        ${s(6,"Cơ cấu trang phục theo danh mục")}${categories?.length?tbl(["Danh mục","Số lượng thuê"],categories.map(c=>[c.parentName||c.name||"N/A",fmtNum(c.rentedCount||0)])) : "<p style='color:#999;font-size:12px;'>Không có dữ liệu</p>"}
        ${s(7,"Đơn thuê gần đây")}${orders?.length?tbl(["Mã đơn","Khách hàng","Thời gian","Tổng tiền","Trạng thái"],orders.map(o=>[`#${o._id?.slice(-6).toUpperCase()}`,o.shippingAddress?.receiverName||o.customerId?.fullName||"Khách hàng",`${new Date(o.startDate).toLocaleDateString("vi-VN")} → ${new Date(o.endDate).toLocaleDateString("vi-VN")}`,fmtVND(o.totalAmount),o.status||"N/A"])) : "<p style='color:#999;font-size:12px;'>Không có dữ liệu</p>"}
      `;
    } else if (activeTab === "operations") {
      title = "BÁO CÁO VẬN HÀNH THUÊ";
      tabTitle = "Vận hành";
      bodyContent = `
        ${s(1,"Tổng quan vận hành")}${kpi([
          {label:"Tỷ lệ hoàn tất",value:fmtPct(lifecycle?.completionRate)},
          {label:"Tỷ lệ huỷ đơn",value:fmtPct(lifecycle?.cancelRate)},
          {label:"Tỷ lệ quá hạn",value:fmtPct(lifecycle?.overdueRate)},
          {label:"Thời gian thuê TB",value:`${lifecycle?.avgRentalDays||0} ngày`}
        ])}
        ${s(2,"Phí phát sinh trong kỳ")}${kpi([
          {label:"Phí trễ hạn (lateFee)",value:fmtVND(lifecycle?.totalLateFee)},
          {label:"Phí hư hỏng (damageFee)",value:fmtVND(lifecycle?.totalDamageFee)},
          {label:"Tổng phí phát sinh",value:fmtVND((lifecycle?.totalLateFee||0)+(lifecycle?.totalDamageFee||0))}
        ])}
        ${s(3,"Phân tích trạng thái đơn hàng")}${lifecycle?.lifecycle?.length?tbl(["Trạng thái đơn hàng","Mô tả","Số đơn","Tỷ lệ"],lifecycle.lifecycle.map(l=>[l.status,l.label,fmtNum(l.count),lifecycle.total>0?fmtPct(l.count/lifecycle.total*100):"0%"])) : "<p style='color:#999;font-size:12px;'>Không có dữ liệu</p>"}
      `;
    } else if (activeTab === "inventory") {
      title = "BÁO CÁO TỒN KHO CHI TIẾT";
      tabTitle = "Tồn kho";
      bodyContent = `
        ${s(1,"Tổng quan tồn kho")}${kpi([
          {label:"Tổng kho",value:`${fmtNum(inventory?.summary?.grandTotal||totalStock)} bộ`},
          {label:"Sẵn sàng cho thuê",value:`${fmtNum(inventory?.summary?.grandAvailable||(totalStock-currentlyRented))} bộ`},
          {label:"Đang thuê",value:`${fmtNum(inventory?.summary?.grandRented||currentlyRented)} bộ`},
          {label:"Tỷ lệ khai thác",value:fmtPct(inventory?.summary?.grandTotal>0?(inventory.summary.grandRented/inventory.summary.grandTotal*100):inventoryUtilizationPercentage)}
        ])}
        ${s(2,"Trang phục cháy hàng — đang thuê nhiều (Hot)")}${inventory?.hotCostumes?.length?tbl(["#","Tên trang phục","Size","Đang thuê","Tổng kho","Tỷ lệ khai thác"],inventory.hotCostumes.map((c,i)=>[i+1,c.name,c.size,fmtNum(c.rentedStock),fmtNum(c.totalStock),`${c.utilizationPct}%`])) : "<p style='color:#999;font-size:12px;'>Không có dữ liệu</p>"}
        ${s(3,"Trang phục ế hàng — ít thuê nhất (Cold)")}${inventory?.coldCostumes?.length?tbl(["#","Tên trang phục","Size","Đang thuê","Tổng kho","Tỷ lệ khai thác"],inventory.coldCostumes.map((c,i)=>[i+1,c.name,c.size,fmtNum(c.rentedStock),fmtNum(c.totalStock),`${c.utilizationPct}%`])) : "<p style='color:#999;font-size:12px;'>Không có dữ liệu</p>"}
        ${s(4,"Chi tiết tồn kho theo size")}${inventory?.rows?.length?tbl(["Tên trang phục","Danh mục","Size","SKU","Tổng kho","Sẵn sàng","Đang thuê","Tỷ lệ khai thác"],inventory.rows.map(row=>[row.name,row.category,row.size,row.sku,fmtNum(row.totalStock),fmtNum(row.availableStock),fmtNum(row.rentedStock),`${row.utilizationPct}%`])) : "<p style='color:#999;font-size:12px;'>Không có dữ liệu</p>"}
      `;
    } else if (activeTab === "issues") {
      title = "BÁO CÁO KHIẾU NẠI & VÍ";
      tabTitle = "Khiếu nại";
      bodyContent = `
        ${s(1,"Tổng quan khiếu nại & Ví")}${kpi([
          {label:"Tổng đơn khiếu nại",value:`${issues?.total||0} đơn`},
          {label:"Tỷ lệ đơn có Issue",value:fmtPct(issues?.issueRate)},
          {label:"Tổng đơn thuê",value:`${fmtNum(issues?.totalRentals||0)} đơn`},
          {label:"Khách hàng duy nhất",value:`${fmtNum(customers?.totalUniqueCustomers||0)} người`}
        ])}
        ${s(2,"Phân loại theo trạng thái khiếu nại")}${issues?.statusBreakdown?.length?tbl(["Trạng thái","Số đơn khiếu nại","Tỷ lệ"],issues.statusBreakdown.map(s=>[s.status,fmtNum(s.count),issues.total>0?fmtPct(s.count/issues.total*100):"0%"])) : "<p style='color:#999;font-size:12px;'>Không có dữ liệu</p>"}
        ${s(3,"Phân loại theo giải pháp xử lý")}${issues?.resolutionBreakdown?.length?tbl(["Giải pháp","Số đơn giải quyết","Tỷ lệ"],issues.resolutionBreakdown.map(s=>[s.resolution,fmtNum(s.count),issues.total>0?fmtPct(s.count/issues.total*100):"0%"])) : "<p style='color:#999;font-size:12px;'>Không có dữ liệu</p>"}
        ${s(4,"Top khách hàng chi tiêu nhiều nhất")}${customers?.topBySpending?.length?tbl(["#","Họ tên","Số lần thuê","Tổng chi tiêu"],customers.topBySpending.slice(0,10).map((c,i)=>[i+1,c.fullName,fmtNum(c.rentalCount),fmtVND(c.totalSpent)])) : "<p style='color:#999;font-size:12px;'>Không có dữ liệu</p>"}
        ${s(5,"Báo cáo ví điện tử - nạp ví")}${kpi([
          {label:"Tổng giao dịch nạp",value:`${fmtNum(wallet?.total)} lần`},
          {label:"Thành công",value:`${fmtNum(wallet?.successCount)} lần (${wallet?.successRate||0}%)`},
          {label:"Thất bại",value:`${fmtNum(wallet?.failedCount)} lần`},
          {label:"Tổng tiền nạp thành công",value:fmtVND(wallet?.totalTransaction)}
        ])}
      `;
    }

    return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Báo cáo ${tabTitle} - CostumeHUB</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;color:#1a1a1a;line-height:1.6;padding:40px 50px}</style></head><body>
    <div style="text-align:center;border-bottom:3px solid #1a1a1a;padding-bottom:14px;margin-bottom:22px;">
      <div style="font-size:11px;font-weight:bold;text-transform:uppercase;letter-spacing:2px;color:#555;">Hệ thống quản lý trang phục</div>
      <div style="font-size:24px;font-weight:bold;">CostumeHUB</div>
      <div style="font-size:15px;font-weight:600;margin-top:3px;">${title}</div>
      <div style="font-size:13px;color:#555;margin-top:5px;">Kỳ: <strong>${dateRange}</strong> — Ngày xuất: ${now}</div>
    </div>
    ${bodyContent}
    <table style="width:100%;border-collapse:collapse;margin-top:50px;"><tr>
      <td style="border:none;text-align:center;width:50%;font-size:13px;"><div style="font-weight:bold;margin-bottom:55px;">Người lập báo cáo</div><div style="font-style:italic;color:#777;font-size:12px;">(Ký và ghi rõ họ tên)</div></td>
      <td style="border:none;text-align:center;width:50%;font-size:13px;"><div style="font-weight:bold;margin-bottom:55px;">Chủ cửa hàng phê duyệt</div><div style="font-style:italic;color:#777;font-size:12px;">(Ký tên, đóng dấu)</div></td>
    </tr></table>
    <div style="margin-top:36px;text-align:center;font-size:10px;color:#bbb;border-top:1px solid #eaeaea;padding-top:10px;">Tài liệu tạo tự động bởi CostumeHUB — ${now}</div>
    </body></html>`;
  };

  const handleExportPDF = async () => {
    setShowExportMenu(false); setExcelExporting(true);
    const tabName = activeTab === "revenue" ? "Doanh_thu" : activeTab === "operations" ? "Van_hanh" : activeTab === "inventory" ? "Ton_kho" : "Khieu_nai";
    try { const r = await fetchFullReportData(); const now = new Date().toLocaleString("vi-VN"); const w = window.open("","_blank"); w.document.write(buildFullHTML(r,now)); w.document.close(); setTimeout(()=>{w.focus();w.print();},400); }
    catch(e){console.error(e);} finally{setExcelExporting(false);}
  };
  const handleExportDOC = async () => {
    setShowExportMenu(false); setExcelExporting(true);
    const tabName = activeTab === "revenue" ? "Doanh_thu" : activeTab === "operations" ? "Van_hanh" : activeTab === "inventory" ? "Ton_kho" : "Khieu_nai";
    try { const r = await fetchFullReportData(); const now = new Date().toLocaleString("vi-VN"); const html = buildFullHTML(r,now); const blob = new Blob(["\ufeff"+html],{type:"application/msword"}); const url=URL.createObjectURL(blob); const a=document.createElement("a"); a.href=url; a.download=`Bao_cao_${tabName}_CostumeHUB_${new Date().toISOString().slice(0,10)}.doc`; document.body.appendChild(a);a.click();document.body.removeChild(a);URL.revokeObjectURL(url); }
    catch(e){console.error(e);} finally{setExcelExporting(false);}
  };
  const handleExportExcel = async () => {
    setShowExportMenu(false); setExcelExporting(true);
    try {
      const r = await fetchFullReportData();
      const now = new Date().toLocaleString("vi-VN");
      const { revenue: rev, topCostumes, lifecycle, inventory, customers, issues, wallet } = r;
      const wb = XLSX.utils.book_new();

      if (activeTab === "revenue") {
        const ws1 = XLSX.utils.aoa_to_sheet([
          ["BÁO CÁO TỔNG QUAN DOANH THU - COSTUMEHUB"],
          [`Kỳ: ${dateRange}`],
          [`Ngày: ${now}`],
          [],
          ["CHỈ SỐ", "GIÁ TRỊ", "GHI CHÚ"],
          ["Tổng doanh thu", revenue || 0, fmtVND(revenue)],
          ["Số đơn phát sinh", activeOrdersCount || 0, ""],
          ["Trang phục đang thuê", currentlyRented || 0, ""],
          ["Tổng kho", totalStock || 0, ""],
          ["Hiệu suất tồn kho", `${inventoryUtilizationPercentage || 0}%`, ""]
        ]);
        ws1["!cols"] = [{ wch: 36 }, { wch: 20 }, { wch: 24 }];
        XLSX.utils.book_append_sheet(wb, ws1, "Tong quan");

        if (rev?.revenueByPaymentMethod?.length) {
          const ws = XLSX.utils.json_to_sheet(rev.revenueByPaymentMethod.map(p => ({
            "Phương thức": p.method,
            "Số đơn": p.count,
            "Doanh thu (đ)": p.total,
            "Doanh thu": fmtVND(p.total)
          })));
          ws["!cols"] = [{ wch: 16 }, { wch: 10 }, { wch: 18 }, { wch: 22 }];
          XLSX.utils.book_append_sheet(wb, ws, "Theo phuong thuc TT");
        }

        const revenueTrend = revenueByMonth.length ? revenueByMonth : (rev?.revenueByMonth || []);
        if (revenueTrend?.length) {
          const ws = XLSX.utils.json_to_sheet(revenueTrend.map(m => {
            const [y, mo] = m.month.split("-");
            return {
              "Tháng": `Tháng ${Number(mo)}/${y}`,
              "Doanh thu (đ)": m.total,
              "Doanh thu": fmtVND(m.total)
            };
          }));
          ws["!cols"] = [{ wch: 16 }, { wch: 18 }, { wch: 22 }];
          XLSX.utils.book_append_sheet(wb, ws, "Doanh thu theo thang");
        }

        if (topCostumes?.topByRental?.length) {
          const ws = XLSX.utils.json_to_sheet(topCostumes.topByRental.slice(0, 10).map((c, i) => ({
            "Hạng": i + 1,
            "Tên": c.name,
            "Lượt thuê": c.rentalCount,
            "Doanh thu (đ)": c.revenue,
            "Doanh thu": fmtVND(c.revenue)
          })));
          ws["!cols"] = [{ wch: 6 }, { wch: 32 }, { wch: 12 }, { wch: 18 }, { wch: 22 }];
          XLSX.utils.book_append_sheet(wb, ws, "Top thue nhieu");
        }

        if (topCostumes?.topByRevenue?.length) {
          const ws = XLSX.utils.json_to_sheet(topCostumes.topByRevenue.slice(0, 10).map((c, i) => ({
            "Hạng": i + 1,
            "Tên": c.name,
            "Doanh thu (đ)": c.revenue,
            "Doanh thu": fmtVND(c.revenue)
          })));
          ws["!cols"] = [{ wch: 6 }, { wch: 32 }, { wch: 18 }, { wch: 22 }];
          XLSX.utils.book_append_sheet(wb, ws, "Top doanh thu cao");
        }

        if (categoryData?.length) {
          const ws = XLSX.utils.json_to_sheet(categoryData.map(c => ({
            "Danh mục": c.name,
            "Danh mục cha": c.parentName || "—",
            "Số lượng thuê": c.rentedCount || 0
          })));
          ws["!cols"] = [{ wch: 24 }, { wch: 24 }, { wch: 16 }];
          XLSX.utils.book_append_sheet(wb, ws, "Theo danh muc");
        }

        if (recentOrders?.length) {
          const ws = XLSX.utils.json_to_sheet(recentOrders.map(o => ({
            "Mã đơn": `#${o._id?.slice(-6).toUpperCase()}`,
            "Khách hàng": o.shippingAddress?.receiverName || o.customerId?.fullName || "Khách hàng",
            "Thời gian": `${new Date(o.startDate).toLocaleDateString("vi-VN")} → ${new Date(o.endDate).toLocaleDateString("vi-VN")}`,
            "Tổng tiền": fmtVND(o.totalAmount),
            "Trạng thái": o.status
          })));
          ws["!cols"] = [{ wch: 12 }, { wch: 24 }, { wch: 28 }, { wch: 16 }, { wch: 14 }];
          XLSX.utils.book_append_sheet(wb, ws, "Don thue gan day");
        }

        XLSX.writeFile(wb, `Bao_cao_Doanh_thu_CostumeHUB_${new Date().toISOString().slice(0, 10)}.xlsx`);

      } else if (activeTab === "operations") {
        const ws1 = XLSX.utils.aoa_to_sheet([
          ["BÁO CÁO VẬN HÀNH THUÊ - COSTUMEHUB"],
          [`Kỳ: ${dateRange}`],
          [`Ngày: ${now}`],
          [],
          ["CHỈ SỐ", "GIÁ TRỊ", "GHI CHÚ"],
          ["Tỷ lệ hoàn tất", `${lifecycle?.completionRate || 0}%`, ""],
          ["Tỷ lệ huỷ đơn", `${lifecycle?.cancelRate || 0}%`, ""],
          ["Tỷ lệ quá hạn", `${lifecycle?.overdueRate || 0}%`, ""],
          ["Thời gian thuê TB", `${lifecycle?.avgRentalDays || 0} ngày`, ""]
        ]);
        ws1["!cols"] = [{ wch: 36 }, { wch: 20 }, { wch: 24 }];
        XLSX.utils.book_append_sheet(wb, ws1, "Tong quan");

        const wsFees = XLSX.utils.aoa_to_sheet([
          ["BÁO CÁO PHÍ PHÁT SINH - COSTUMEHUB"],
          [`Kỳ: ${dateRange}`],
          [`Ngày: ${now}`],
          [],
          ["KHOẢN PHÍ", "SỐ TIỀN", "GHI CHÚ"],
          ["Phí trễ hạn", lifecycle?.totalLateFee || 0, fmtVND(lifecycle?.totalLateFee)],
          ["Phí hư hỏng", lifecycle?.totalDamageFee || 0, fmtVND(lifecycle?.totalDamageFee)],
          ["Tổng phí phát sinh", (lifecycle?.totalLateFee || 0) + (lifecycle?.totalDamageFee || 0), fmtVND((lifecycle?.totalLateFee || 0) + (lifecycle?.totalDamageFee || 0))]
        ]);
        wsFees["!cols"] = [{ wch: 36 }, { wch: 20 }, { wch: 24 }];
        XLSX.utils.book_append_sheet(wb, wsFees, "Phi phat sinh");

        if (lifecycle?.lifecycle?.length) {
          const ws = XLSX.utils.json_to_sheet(lifecycle.lifecycle.map(l => ({
            "Trạng thái": l.status,
            "Mô tả": l.label,
            "Số đơn": l.count,
            "Tỷ lệ": lifecycle.total > 0 ? `${(l.count / lifecycle.total * 100).toFixed(1)}%` : "0%"
          })));
          ws["!cols"] = [{ wch: 16 }, { wch: 20 }, { wch: 12 }, { wch: 12 }];
          XLSX.utils.book_append_sheet(wb, ws, "Trang thai don hang");
        }

        XLSX.writeFile(wb, `Bao_cao_Van_hanh_CostumeHUB_${new Date().toISOString().slice(0, 10)}.xlsx`);

      } else if (activeTab === "inventory") {
        const ws1 = XLSX.utils.aoa_to_sheet([
          ["BÁO CÁO TỒN KHO - COSTUMEHUB"],
          [`Kỳ: ${dateRange}`],
          [`Ngày: ${now}`],
          [],
          ["CHỈ SỐ", "GIÁ TRỊ", "GHI CHÚ"],
          ["Tổng kho", inventory?.summary?.grandTotal || totalStock || 0, "bộ"],
          ["Sẵn sàng cho thuê", inventory?.summary?.grandAvailable || (totalStock - currentlyRented) || 0, "bộ"],
          ["Đang thuê", inventory?.summary?.grandRented || currentlyRented || 0, "bộ"],
          ["Tỷ lệ khai thác", inventory?.summary?.grandTotal > 0 ? `${((inventory.summary.grandRented / inventory.summary.grandTotal) * 100).toFixed(1)}%` : `${inventoryUtilizationPercentage || 0}%`, ""]
        ]);
        ws1["!cols"] = [{ wch: 36 }, { wch: 20 }, { wch: 24 }];
        XLSX.utils.book_append_sheet(wb, ws1, "Tong quan");

        const hotRows = (inventory?.hotCostumes || []).map((c, i) => ({
          "Phân loại": "🔥 Cháy hàng",
          "Hạng": i + 1,
          "Tên": c.name,
          "Size": c.size,
          "SKU": c.sku,
          "Tổng kho": c.totalStock,
          "Đang thuê": c.rentedStock,
          "Tỷ lệ": `${c.utilizationPct}%`
        }));
        const coldRows = (inventory?.coldCostumes || []).map((c, i) => ({
          "Phân loại": "🧊 Ế hàng",
          "Hạng": i + 1,
          "Tên": c.name,
          "Size": c.size,
          "SKU": c.sku,
          "Tổng kho": c.totalStock,
          "Đang thuê": c.rentedStock,
          "Tỷ lệ": `${c.utilizationPct}%`
        }));
        if (hotRows.length || coldRows.length) {
          const ws = XLSX.utils.json_to_sheet([...hotRows, ...coldRows]);
          ws["!cols"] = [{ wch: 14 }, { wch: 8 }, { wch: 30 }, { wch: 8 }, { wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 12 }];
          XLSX.utils.book_append_sheet(wb, ws, "Hot vs Cold");
        }

        if (inventory?.rows?.length) {
          const ws = XLSX.utils.json_to_sheet(inventory.rows.map(row => ({
            "Tên trang phục": row.name,
            "Danh mục": row.category,
            "Size": row.size,
            "SKU": row.sku,
            "Tổng kho": row.totalStock,
            "Sẵn sàng": row.availableStock,
            "Đang thuê": row.rentedStock,
            "Tỷ lệ": `${row.utilizationPct}%`
          })));
          ws["!cols"] = [{ wch: 28 }, { wch: 18 }, { wch: 8 }, { wch: 14 }, { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 12 }];
          XLSX.utils.book_append_sheet(wb, ws, "Ton kho theo size");
        }

        XLSX.writeFile(wb, `Bao_cao_Ton_kho_CostumeHUB_${new Date().toISOString().slice(0, 10)}.xlsx`);

      } else if (activeTab === "issues") {
        const ws1 = XLSX.utils.aoa_to_sheet([
          ["BÁO CÁO KHIẾU NẠI & VÍ - COSTUMEHUB"],
          [`Kỳ: ${dateRange}`],
          [`Ngày: ${now}`],
          [],
          ["CHỈ SỐ", "GIÁ TRỊ", "GHI CHÚ"],
          ["Tổng khiếu nại", issues?.total || 0, "đơn"],
          ["Tỷ lệ khiếu nại", `${issues?.issueRate || 0}%`, ""],
          ["Tổng đơn thuê", issues?.totalRentals || 0, "đơn"],
          ["Khách hàng duy nhất", customers?.totalUniqueCustomers || 0, "người"]
        ]);
        ws1["!cols"] = [{ wch: 36 }, { wch: 20 }, { wch: 24 }];
        XLSX.utils.book_append_sheet(wb, ws1, "Tong quan");

        const breakStatus = (issues?.statusBreakdown || []).map(s => ({
          "Phân loại": "Trạng thái",
          "Mục": s.status,
          "Số lượng": s.count,
          "Tỷ lệ": issues?.total > 0 ? `${(s.count / issues.total * 100).toFixed(1)}%` : "0%"
        }));
        const breakRes = (issues?.resolutionBreakdown || []).map(rArr => ({
          "Phân loại": "Giải pháp",
          "Mục": rArr.resolution,
          "Số lượng": rArr.count,
          "Tỷ lệ": issues?.total > 0 ? `${(rArr.count / issues.total * 100).toFixed(1)}%` : "0%"
        }));
        if (breakStatus.length || breakRes.length) {
          const ws = XLSX.utils.json_to_sheet([...breakStatus, ...breakRes]);
          ws["!cols"] = [{ wch: 16 }, { wch: 24 }, { wch: 12 }, { wch: 12 }];
          XLSX.utils.book_append_sheet(wb, ws, "Phan loai khieu nai");
        }

        if (customers?.topBySpending?.length) {
          const ws = XLSX.utils.json_to_sheet(customers.topBySpending.slice(0, 10).map((c, i) => ({
            "Hạng": i + 1,
            "Khách hàng": c.fullName,
            "Số lần thuê": c.rentalCount,
            "Chi tiêu (đ)": c.totalSpent,
            "Tổng chi tiêu": fmtVND(c.totalSpent)
          })));
          ws["!cols"] = [{ wch: 8 }, { wch: 26 }, { wch: 14 }, { wch: 18 }, { wch: 22 }];
          XLSX.utils.book_append_sheet(wb, ws, "Top khach hang");
        }

        if (wallet) {
          const ws = XLSX.utils.aoa_to_sheet([
            ["BÁO CÁO VÍ ĐIỆN TỬ - COSTUMEHUB"],
            [`Kỳ: ${dateRange}`],
            [`Ngày: ${now}`],
            [],
            ["CHỈ SỐ", "GIÁ TRỊ", "GHI CHÚ"],
            ["Tổng giao dịch nạp", wallet.total || 0, "lần"],
            ["Thành công", wallet.successCount || 0, `${wallet.successRate || 0}%`],
            ["Thất bại", wallet.failedCount || 0, ""],
            ["Tổng nạp ví thành công", wallet.totalTransaction || 0, fmtVND(wallet.totalTransaction)]
          ]);
          ws["!cols"] = [{ wch: 28 }, { wch: 14 }, { wch: 16 }];
          XLSX.utils.book_append_sheet(wb, ws, "Vi dien tu");
        }

        XLSX.writeFile(wb, `Bao_cao_Khieu_nai_CostumeHUB_${new Date().toISOString().slice(0, 10)}.xlsx`);
      }

    } catch (e) {
      console.error(e);
    } finally {
      setExcelExporting(false);
    }
  };

  // ── Loading state ──────────────────────────────────────────────────────────
  if (initialLoading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#eaeaea] border-t-[#1a1a1a]" />
    </div>
  );

  const r = reportData;
  const totalCategoryCount = categoryData.reduce((s, i) => s + (i.rentedCount || 0), 0);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="bg-[#faf9f7] min-h-screen flex flex-col">

      {/* ═══ TOPBAR ═══════════════════════════════════════════════════════════ */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2" ref={menuRef}>

        {/* LEFT: Tab navigator */}
        <div className="flex items-center gap-1.5 bg-white border border-[#eaeaea] rounded-xl p-1 shadow-sm">
          {TABS.map(tab => {
            const isActive = activeTab === tab.id;
            const c = TAB_COLORS[tab.color];
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border transition-all duration-200 ${isActive ? c.active : c.idle}`}
              >
                <FontAwesomeIcon icon={tab.icon} className="text-xs" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* RIGHT: Date picker + Export */}
        <div className="flex items-center gap-2">
          {/* Date picker */}
          <div className="relative">
            <button
              type="button"
              onClick={() => { setShowDateMenu(!showDateMenu); setShowExportMenu(false); }}
              className="flex items-center gap-2 border border-[#eaeaea] rounded-xl bg-white px-3 py-2 text-sm shadow-sm hover:bg-[#faf9f7] transition-colors"
            >
              <FontAwesomeIcon icon={faCalendarAlt} className="text-[#999] text-xs" />
              <span className="font-medium text-[#1a1a1a] max-w-[140px] truncate">{dateRange}</span>
              <FontAwesomeIcon icon={faChevronDown} className="text-[#bbb] text-xs" />
            </button>
            {showDateMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white border border-[#eaeaea] rounded-xl shadow-xl py-2 z-50">
                {["Tất cả thời gian","Hôm nay","7 ngày qua","30 ngày qua","Tháng này"].map(range => (
                  <button key={range} type="button"
                    onClick={() => { setDateRange(range); setShowDateMenu(false); }}
                    className={`w-full text-left px-4 py-2 text-sm font-medium transition-colors ${dateRange === range ? "bg-[#1a1a1a] text-white" : "text-gray-700 hover:bg-[#faf9f7]"}`}>
                    {range}
                  </button>
                ))}
                <div className="px-4 py-3 border-t border-[#eaeaea] bg-gray-50/50">
                  <p className="text-xs text-[#999] mb-2 font-semibold uppercase tracking-wide">Tuỳ chọn khoảng ngày</p>
                  <div className="flex flex-col gap-2">
                    {[["Từ:", customStartDate, setCustomStartDate],["Đến:", customEndDate, setCustomEndDate]].map(([lbl,val,fn]) => (
                      <div key={lbl} className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 w-8">{lbl}</span>
                        <input type="date" value={val} onChange={e => fn(e.target.value)}
                          className="border border-[#eaeaea] rounded-lg px-2 py-1 text-sm flex-1 focus:outline-none focus:border-[#1a1a1a]" />
                      </div>
                    ))}
                    <button type="button" onClick={handleApplyCustomDate}
                      disabled={!customStartDate || !customEndDate}
                      className="mt-1 w-full bg-[#1a1a1a] text-white rounded-lg py-1.5 text-xs font-semibold hover:bg-[#333] disabled:bg-gray-300 disabled:cursor-not-allowed">
                      Áp dụng
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Export */}
          <div className="relative">
            <button type="button"
              onClick={() => { setShowExportMenu(!showExportMenu); setShowDateMenu(false); }}
              className="flex items-center gap-2 border border-[#eaeaea] bg-white hover:bg-[#faf9f7] rounded-xl px-3 py-2 transition-colors shadow-sm">
              {excelExporting
                ? <FontAwesomeIcon icon={faSpinner} className="animate-spin text-sm text-emerald-600" />
                : <FontAwesomeIcon icon={faDownload} className="text-sm text-[#555]" />}
              <span className="text-sm font-medium text-[#1a1a1a] hidden sm:inline">Xuất file</span>
              <FontAwesomeIcon icon={faChevronDown} className="text-[#bbb] text-xs" />
            </button>
            {showExportMenu && (() => {
              const exportConfigs = {
                revenue: { sheets: "7 sheets", tabLabel: "Doanh thu" },
                operations: { sheets: "3 sheets", tabLabel: "Vận hành" },
                inventory: { sheets: "3 sheets", tabLabel: "Tồn kho" },
                issues: { sheets: "4 sheets", tabLabel: "Khiếu nại" }
              };
              const currentCfg = exportConfigs[activeTab] || { sheets: "11 sheets", tabLabel: "Toàn diện" };
              return (
                <div className="absolute right-0 mt-2 w-52 bg-white border border-[#eaeaea] rounded-xl shadow-xl z-50 overflow-hidden">
                  <div className="px-4 py-2.5 border-b border-[#f0f0f0] bg-[#faf9f7]">
                    <p className="text-[10px] font-bold text-[#999] uppercase tracking-widest">Xuất báo cáo {currentCfg.tabLabel.toLowerCase()}</p>
                  </div>
                  {[
                    { label:"Xuất Excel", sub:`${currentCfg.sheets} · .xlsx`, icon:faFileExcel, color:"emerald", onClick:handleExportExcel, loading:excelExporting },
                    { label:"Xuất PDF",   sub:`Bản ${currentCfg.tabLabel.toLowerCase()} · .pdf`, icon:faFilePdf,   color:"red",     onClick:handleExportPDF },
                    { label:"Xuất Word",  sub:`Bản ${currentCfg.tabLabel.toLowerCase()} · .doc`, icon:faFileWord, color:"blue",   onClick:handleExportDOC },
                  ].map(btn => (
                    <button key={btn.label} type="button" onClick={btn.onClick}
                      disabled={btn.loading}
                      className={`w-full text-left px-4 py-3 text-sm hover:bg-${btn.color}-50 flex items-center gap-3 transition-colors group disabled:opacity-50`}>
                      <span className={`w-8 h-8 rounded-lg bg-${btn.color}-100 text-${btn.color}-600 group-hover:bg-${btn.color}-500 group-hover:text-white flex items-center justify-center transition-colors flex-shrink-0`}>
                        <FontAwesomeIcon icon={btn.loading ? faSpinner : btn.icon} className={btn.loading ? "animate-spin text-xs" : "text-xs"} />
                      </span>
                      <div>
                        <div className="font-semibold text-[#1a1a1a]">{btn.loading ? "Đang tạo..." : btn.label}</div>
                        <div className="text-[10px] text-[#999]">{btn.sub}</div>
                      </div>
                    </button>
                  ))}
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* ═══ TAB CONTENT ══════════════════════════════════════════════════════ */}
      <div className="flex-1 py-5 overflow-y-auto">
        {tabLoading && (
          <div className="flex items-center justify-center py-10">
            <FontAwesomeIcon icon={faSpinner} className="animate-spin text-2xl text-[#bbb]" />
          </div>
        )}

        {/* ── TAB 1: DOANH THU ───────────────────────────────────────────── */}
        {!tabLoading && activeTab === "revenue" && (
          <div className="flex flex-col gap-5">
            <SectionTitle>Tổng quan tài chính</SectionTitle>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard icon={faChartLine} label="Tổng doanh thu" value={fmtVND(revenue)} color="blue" />
              <StatCard icon={faChartBar} label="Số đơn phát sinh" value={`${fmtNum(activeOrdersCount)} đơn`} color="amber" />
              <StatCard icon={faCheckCircle} label="Trang phục đang thuê" value={`${fmtNum(currentlyRented)} bộ`} color="emerald" />
              <StatCard icon={faWarehouse} label="Tổng kho" value={`${fmtNum(totalStock)} bộ`} color="slate" sub={`Hiệu suất: ${inventoryUtilizationPercentage}%`} />
            </div>

            {/* Thanh toán */}
            {r?.revenue?.revenueByPaymentMethod?.length > 0 && (
              <>
                <SectionTitle>Doanh thu theo phương thức thanh toán</SectionTitle>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {r.revenue.revenueByPaymentMethod.map(p => (
                    <div key={p.method} className="bg-white border border-[#eaeaea] rounded-xl p-4 shadow-sm">
                      <div className="text-xs font-bold text-[#999] uppercase tracking-wide mb-1">{p.method}</div>
                      <div className="text-xl font-bold text-[#1a1a1a]">{fmtVND(p.total)}</div>
                      <div className="text-xs text-[#bbb] mt-1">{fmtNum(p.count)} đơn</div>
                    </div>
                  ))}
                </div>
              </>
            )}

            <SectionTitle>Biểu đồ xu hướng doanh thu theo tháng</SectionTitle>
            <div className="bg-white border border-[#eaeaea] rounded-xl p-5 shadow-sm">
              {revenueByMonth.length === 0 ? (
                <div className="h-48 flex items-center justify-center text-xs text-[#bbb]">Không có dữ liệu</div>
              ) : (
                <div className="h-52">
                  <Bar
                    data={{
                      labels: revenueByMonth.map(m => `T${Number(m.month.split("-")[1])}/${m.month.split("-")[0]}`),
                      datasets: [{ label: "Doanh thu", data: revenueByMonth.map(m => m.total), backgroundColor: "#3b82f6", borderRadius: 5, barThickness: 28 }]
                    }}
                    options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => fmtVND(ctx.raw) } } }, scales: { x: { grid: { display: false } }, y: { beginAtZero: true, border: { display: false }, ticks: { callback: v => `${(v/1000000).toFixed(0)}M` } } } }}
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Top trang phục */}
              <div className="bg-white border border-[#eaeaea] rounded-xl p-5 shadow-sm">
                <SectionTitle>Top trang phục thuê nhiều nhất</SectionTitle>
                <RankList items={r?.topCostumes?.topByRental} valueKey="rentalCount" labelKey="name" formatValue={v => `${v} lượt`} accentColor="#3b82f6" />
              </div>
              {/* Top doanh thu */}
              <div className="bg-white border border-[#eaeaea] rounded-xl p-5 shadow-sm">
                <SectionTitle>Top trang phục doanh thu cao nhất</SectionTitle>
                <RankList items={r?.topCostumes?.topByRevenue} valueKey="revenue" labelKey="name" formatValue={fmtVND} accentColor="#f59e0b" />
              </div>
            </div>

            <SectionTitle>Cơ cấu trang phục theo danh mục</SectionTitle>
            <div className="bg-white border border-[#eaeaea] rounded-xl p-5 shadow-sm">
              <div className="h-52">
                {(() => {
                  const grouped = {};
                  categoryData.forEach(c => { const p = c.parentName || c.name; if (!grouped[p]) grouped[p] = []; grouped[p].push(c); });
                  const labels = Object.keys(grouped);
                  const datasets = categoryData.map((c, i) => ({ label: c.name, data: labels.map(p => p === (c.parentName || c.name) ? (c.rentedCount || 0) : 0), backgroundColor: CATEGORY_COLORS[i % CATEGORY_COLORS.length], stack: "Stack 0" }));
                  return <Bar data={{ labels, datasets }} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { stacked: true, grid: { display: false } }, y: { stacked: true, beginAtZero: true, border: { display: false } } } }} />;
                })()}
              </div>
            </div>

            <SectionTitle>Đơn thuê gần đây</SectionTitle>
            <div className="bg-white border border-[#eaeaea] rounded-xl shadow-sm overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#f0f0f0] text-[#999] uppercase text-[10px]">
                    {["Mã đơn","Khách hàng","Thời gian","Tổng tiền","Trạng thái"].map(h => <th key={h} className="px-4 py-3 font-bold">{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map(o => (
                    <tr key={o._id} className="border-b border-[#f5f5f5] hover:bg-[#faf9f7]">
                      <td className="px-4 py-3 font-bold text-[#1a1a1a]">#{o._id?.slice(-6).toUpperCase()}</td>
                      <td className="px-4 py-3">{o.shippingAddress?.receiverName || o.customerId?.fullName || "Khách hàng"}</td>
                      <td className="px-4 py-3 text-[#777]">{new Date(o.startDate).toLocaleDateString("vi-VN")} → {new Date(o.endDate).toLocaleDateString("vi-VN")}</td>
                      <td className="px-4 py-3 font-semibold">{fmtVND(o.totalAmount)}</td>
                      <td className="px-4 py-3"><StatusPill status={o.status} /></td>
                    </tr>
                  ))}
                  {recentOrders.length === 0 && <tr><td colSpan={5} className="text-center py-8 text-[#bbb]">Không có đơn hàng trong kỳ</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── TAB 2: VẬN HÀNH THUÊ ────────────────────────────────────────── */}
        {!tabLoading && activeTab === "operations" && (
          <div className="flex flex-col gap-5">
            <SectionTitle>Tổng quan vận hành</SectionTitle>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard icon={faCheckCircle}  label="Tỷ lệ hoàn tất"      value={fmtPct(r?.lifecycle?.completionRate)} color="emerald" />
              <StatCard icon={faTimesCircle}  label="Tỷ lệ huỷ đơn"       value={fmtPct(r?.lifecycle?.cancelRate)}    color="rose" />
              <StatCard icon={faClock}        label="Tỷ lệ quá hạn"       value={fmtPct(r?.lifecycle?.overdueRate)}   color="orange" />
              <StatCard icon={faChartBar}     label="Thời gian thuê TB"   value={`${r?.lifecycle?.avgRentalDays || 0} ngày`} color="blue" />
            </div>

            <SectionTitle>Phí phát sinh trong kỳ</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard icon={faClock}   label="Tổng phí trễ hạn (lateFee)"    value={fmtVND(r?.lifecycle?.totalLateFee)}    color="orange" />
              <StatCard icon={faWarehouse} label="Tổng phí hư hỏng (damageFee)" value={fmtVND(r?.lifecycle?.totalDamageFee)} color="rose" />
              <StatCard icon={faChartBar} label="Tổng phí phát sinh"            value={fmtVND((r?.lifecycle?.totalLateFee||0)+(r?.lifecycle?.totalDamageFee||0))} color="purple" />
            </div>

            <SectionTitle>Phân tích trạng thái đơn hàng</SectionTitle>
            <div className="bg-white border border-[#eaeaea] rounded-xl p-5 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                {/* Doughnut chart */}
                <div className="flex items-center justify-center h-52">
                  {r?.lifecycle?.lifecycle?.length ? (
                    <Doughnut
                      data={{
                        labels: r.lifecycle.lifecycle.map(l => l.label),
                        datasets: [{ data: r.lifecycle.lifecycle.map(l => l.count), backgroundColor: ["#10b981","#ef4444","#f97316","#3b82f6","#94a3b8","#f59e0b","#8b5cf6"], borderWidth: 0, cutout: "65%" }]
                      }}
                      options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "right", labels: { font: { size: 11 }, boxWidth: 10 } } } }}
                    />
                  ) : <span className="text-xs text-[#bbb]">Không có dữ liệu</span>}
                </div>
                {/* Table breakdown */}
                <div className="flex flex-col gap-2">
                  {(r?.lifecycle?.lifecycle || []).map(l => (
                    <div key={l.status} className="flex items-center justify-between py-2 border-b border-[#f5f5f5] last:border-0">
                      <div className="flex items-center gap-2">
                        <StatusPill status={l.status} />
                        <span className="text-xs text-[#555]">{l.label}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold text-[#1a1a1a]">{fmtNum(l.count)}</span>
                        <span className="text-[10px] text-[#bbb] ml-1">
                          {r.lifecycle.total > 0 ? `(${(l.count/r.lifecycle.total*100).toFixed(1)}%)` : ""}
                        </span>
                      </div>
                    </div>
                  ))}
                  <div className="pt-2 mt-1 border-t border-[#eaeaea] flex justify-between">
                    <span className="text-xs font-bold text-[#555]">Tổng đơn</span>
                    <span className="text-sm font-bold">{fmtNum(r?.lifecycle?.total)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 3: TỒN KHO ──────────────────────────────────────────────── */}
        {!tabLoading && activeTab === "inventory" && (
          <div className="flex flex-col gap-5">
            <SectionTitle>Tổng quan tồn kho</SectionTitle>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard icon={faWarehouse}    label="Tổng kho"             value={`${fmtNum(r?.inventory?.summary?.grandTotal)} bộ`}     color="slate" />
              <StatCard icon={faCheckCircle}  label="Sẵn sàng cho thuê"   value={`${fmtNum(r?.inventory?.summary?.grandAvailable)} bộ`} color="emerald" />
              <StatCard icon={faChartBar}     label="Đang thuê"            value={`${fmtNum(r?.inventory?.summary?.grandRented)} bộ`}    color="amber" />
              <StatCard icon={faChartLine}    label="Tỷ lệ khai thác"     value={r?.inventory?.summary?.grandTotal > 0 ? fmtPct((r.inventory.summary.grandRented/r.inventory.summary.grandTotal)*100) : "0%"} color="blue" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Hot costumes */}
              <div className="bg-white border border-[#eaeaea] rounded-xl p-5 shadow-sm">
                <SectionTitle>🔥 Cháy hàng — đang được thuê nhiều</SectionTitle>
                {r?.inventory?.hotCostumes?.length ? (
                  <div className="flex flex-col gap-2">
                    {r.inventory.hotCostumes.slice(0, 8).map((c, i) => (
                      <div key={i} className="flex items-center justify-between py-2 border-b border-[#f5f5f5] last:border-0">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-500 flex items-center justify-center text-[10px] font-bold flex-shrink-0">#{i+1}</span>
                          <div>
                            <div className="text-xs font-semibold text-[#1a1a1a] max-w-[150px] truncate">{c.name}</div>
                            <div className="text-[10px] text-[#bbb]">Size: {c.size} · SKU: {c.sku}</div>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-sm font-bold text-orange-500">{c.utilizationPct}%</div>
                          <div className="text-[10px] text-[#bbb]">{c.rentedStock}/{c.totalStock}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-xs text-[#bbb] py-4 text-center">Không có dữ liệu</p>}
              </div>

              {/* Cold costumes */}
              <div className="bg-white border border-[#eaeaea] rounded-xl p-5 shadow-sm">
                <SectionTitle>🧊 Ế hàng — ít được thuê nhất</SectionTitle>
                {r?.inventory?.coldCostumes?.length ? (
                  <div className="flex flex-col gap-2">
                    {r.inventory.coldCostumes.slice(0, 8).map((c, i) => (
                      <div key={i} className="flex items-center justify-between py-2 border-b border-[#f5f5f5] last:border-0">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-400 flex items-center justify-center text-[10px] font-bold flex-shrink-0">#{i+1}</span>
                          <div>
                            <div className="text-xs font-semibold text-[#1a1a1a] max-w-[150px] truncate">{c.name}</div>
                            <div className="text-[10px] text-[#bbb]">Size: {c.size} · SKU: {c.sku}</div>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-sm font-bold text-blue-400">{c.utilizationPct}%</div>
                          <div className="text-[10px] text-[#bbb]">{c.rentedStock}/{c.totalStock}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-xs text-[#bbb] py-4 text-center">Không có dữ liệu</p>}
              </div>
            </div>

            {/* Chi tiết tồn kho theo size */}
            <SectionTitle>Tỷ lệ sử dụng theo từng costume / size</SectionTitle>
            <div className="bg-white border border-[#eaeaea] rounded-xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-[#1a1a1a] text-white text-[10px] uppercase">
                    <tr>
                      {["Tên trang phục","Danh mục","Size","SKU","Tổng kho","Sẵn sàng","Đang thuê","Tỷ lệ"].map(h => (
                        <th key={h} className="px-3 py-3 font-bold whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(r?.inventory?.rows || []).map((row, i) => (
                      <tr key={i} className={`border-b border-[#f5f5f5] hover:bg-[#faf9f7] ${i % 2 === 0 ? "bg-white" : "bg-[#fafafa]"}`}>
                        <td className="px-3 py-2.5 font-semibold text-[#1a1a1a] max-w-[180px] truncate">{row.name}</td>
                        <td className="px-3 py-2.5 text-[#777]">{row.category}</td>
                        <td className="px-3 py-2.5"><span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-[10px] font-bold">{row.size}</span></td>
                        <td className="px-3 py-2.5 text-[#999] font-mono text-[10px]">{row.sku}</td>
                        <td className="px-3 py-2.5 font-bold text-center">{row.totalStock}</td>
                        <td className="px-3 py-2.5 text-emerald-600 font-semibold text-center">{row.availableStock}</td>
                        <td className="px-3 py-2.5 text-amber-600 font-semibold text-center">{row.rentedStock}</td>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-1.5">
                            <div className="flex-1 bg-[#f0f0f0] rounded-full h-1.5">
                              <div className="h-1.5 rounded-full" style={{ width: `${row.utilizationPct}%`, backgroundColor: row.utilizationPct >= 70 ? "#f97316" : row.utilizationPct >= 30 ? "#3b82f6" : "#94a3b8" }} />
                            </div>
                            <span className={`text-[10px] font-bold w-10 text-right ${row.utilizationPct >= 70 ? "text-orange-500" : row.utilizationPct >= 30 ? "text-blue-500" : "text-slate-400"}`}>{row.utilizationPct}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {(!r?.inventory?.rows?.length) && <tr><td colSpan={8} className="text-center py-8 text-[#bbb]">Không có dữ liệu</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 4: KHIẾU NẠI ─────────────────────────────────────────────── */}
        {!tabLoading && activeTab === "issues" && (
          <div className="flex flex-col gap-5">
            <SectionTitle>Tổng quan khiếu nại</SectionTitle>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard icon={faExclamationTriangle} label="Tổng đơn khiếu nại"      value={`${fmtNum(r?.issues?.total)} đơn`}       color="rose" />
              <StatCard icon={faChartBar}            label="Tỷ lệ đơn có Issue"      value={fmtPct(r?.issues?.issueRate)}            color="orange" />
              <StatCard icon={faCheckCircle}         label="Tổng đơn thuê trong kỳ" value={`${fmtNum(r?.issues?.totalRentals)} đơn`} color="slate" />
              <StatCard icon={faUsers}               label="Khách hàng duy nhất"     value={`${fmtNum(r?.customers?.totalUniqueCustomers)} người`} color="purple" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Phân loại theo trạng thái */}
              <div className="bg-white border border-[#eaeaea] rounded-xl p-5 shadow-sm">
                <SectionTitle>Phân loại theo trạng thái khiếu nại</SectionTitle>
                {r?.issues?.statusBreakdown?.length ? (
                  <div className="flex flex-col gap-3">
                    {r.issues.statusBreakdown.map(s => {
                      const pct = r.issues.total > 0 ? (s.count / r.issues.total * 100).toFixed(1) : 0;
                      return (
                        <div key={s.status}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="font-semibold text-[#444] capitalize">{s.status}</span>
                            <span className="text-[#777]">{s.count} đơn ({pct}%)</span>
                          </div>
                          <div className="w-full bg-[#f0f0f0] rounded-full h-2">
                            <div className="h-2 rounded-full bg-rose-500 transition-all" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : <p className="text-xs text-[#bbb] py-4 text-center">Không có dữ liệu</p>}
              </div>

              {/* Phân loại theo giải pháp */}
              <div className="bg-white border border-[#eaeaea] rounded-xl p-5 shadow-sm">
                <SectionTitle>Phân loại theo giải pháp xử lý</SectionTitle>
                {r?.issues?.resolutionBreakdown?.length ? (
                  <div className="flex flex-col gap-3">
                    {r.issues.resolutionBreakdown.map(s => {
                      const pct = r.issues.total > 0 ? (s.count / r.issues.total * 100).toFixed(1) : 0;
                      return (
                        <div key={s.resolution}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="font-semibold text-[#444]">{s.resolution}</span>
                            <span className="text-[#777]">{s.count} đơn ({pct}%)</span>
                          </div>
                          <div className="w-full bg-[#f0f0f0] rounded-full h-2">
                            <div className="h-2 rounded-full bg-amber-500 transition-all" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : <p className="text-xs text-[#bbb] py-4 text-center">Không có dữ liệu</p>}

                {/* Top customers */}
                <div className="mt-5">
                  <SectionTitle>Top khách hàng chi tiêu nhiều nhất</SectionTitle>
                  <RankList items={r?.customers?.topBySpending} valueKey="totalSpent" labelKey="fullName" formatValue={fmtVND} maxItems={5} accentColor="#8b5cf6" />
                </div>
              </div>
            </div>

            {/* Ví điện tử */}
            <SectionTitle>Báo cáo ví điện tử — nạp ví</SectionTitle>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard icon={faChartBar}    label="Tổng giao dịch nạp"      value={`${fmtNum(r?.wallet?.total)} lần`}          color="teal" />
              <StatCard icon={faCheckCircle} label="Thành công"               value={`${fmtNum(r?.wallet?.successCount)} lần`}   color="emerald" sub={`Tỷ lệ: ${r?.wallet?.successRate || 0}%`} />
              <StatCard icon={faTimesCircle} label="Thất bại"                 value={`${fmtNum(r?.wallet?.failedCount)} lần`}    color="rose" />
              <StatCard icon={faChartLine}   label="Tổng tiền nạp thành công" value={fmtVND(r?.wallet?.totalTransaction)}             color="blue" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}