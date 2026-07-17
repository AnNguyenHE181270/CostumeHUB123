import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEllipsisV,
  faDownload,
  faCalendarAlt,
  faChartBar,
  faTable,
  faFilePdf,
  faFileWord,
  faFileExcel,
  faSpinner,
  faChevronDown,
} from "@fortawesome/free-solid-svg-icons";
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import * as XLSX from "xlsx";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const CATEGORY_COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

export default function FrappeStyleDashboard() {
  const [loadingPage, setLoadingPage] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [toast, setToast] = useState({ isVisible: false, message: "", type: "success" });
  const [excelExporting, setExcelExporting] = useState(false);

  const [revenue, setRevenue] = useState(0);
  const [activeOrdersCount, setActiveOrdersCount] = useState(0);
  const [totalActiveCostumes, setTotalActiveCostumes] = useState(0);
  const [inventoryUtilizationPercentage, setInventoryUtilizationPercentage] = useState(0);
  const [totalStock, setTotalStock] = useState(0);
  const [currentlyRented, setCurrentlyRented] = useState(0);
  const [categoryData, setCategoryData] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [revenueByMonth, setRevenueByMonth] = useState([]);

  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showDateMenu, setShowDateMenu] = useState(false);

  // FIX: Sửa giá trị mặc định thành "Tất cả thời gian" để không bị lọt dữ liệu cũ
  const [dateRange, setDateRange] = useState("Tất cả thời gian");

  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  const { token } = useAuth();

  const getDateParams = useCallback(() => {
    const now = new Date();
    let start = null;
    let end = new Date();

    if (dateRange === "Hôm nay") {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (dateRange === "7 ngày qua") {
      start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (dateRange === "30 ngày qua") {
      start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else if (dateRange === "Tháng này") {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (dateRange === "Tất cả thời gian") {
      // FIX: Trả về null để Backend không áp dụng filter ngày tháng
      start = null;
      end = null;
    } else if (dateRange.startsWith("Từ")) {
      if (customStartDate && customEndDate) {
        start = new Date(customStartDate);
        end = new Date(customEndDate);
      }
    }

    return {
      startDate: start ? start.toISOString() : "",
      endDate: end ? end.toISOString() : ""
    };
  }, [dateRange, customStartDate, customEndDate]);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoadingPage(true);
      setToast({ isVisible: false, message: "", type: "success" });

      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };

      const { startDate, endDate } = getDateParams();
      const queryParams = `?startDate=${startDate}&endDate=${endDate}`;

      const [resRevenue, resActive, resInventory, resOrders] = await Promise.all([
        fetch(`http://localhost:9999/api/rentals/dashboard/revenue${queryParams}`, { headers }),
        fetch(`http://localhost:9999/api/rentals/dashboard/active-rentals${queryParams}`, { headers }),
        fetch(`http://localhost:9999/api/rentals/dashboard/inventory-utilization${queryParams}`, { headers }),
        fetch(`http://localhost:9999/api/rentals${queryParams}`, { headers })
      ]);

      if (!resRevenue.ok || !resActive.ok || !resInventory.ok || !resOrders.ok) {
        setToast({ isVisible: true, type: "error", message: "Không thể tải dữ liệu báo cáo thống kê." });
        return;
      }

      const dataRevenue = await resRevenue.json();
      const dataActive = await resActive.json();
      const dataInventory = await resInventory.json();
      const dataOrders = await resOrders.json();

      setRevenue(dataRevenue.totalRevenue || 0);
      setRevenueByMonth(dataRevenue.revenueByMonth || []);
      setActiveOrdersCount(dataActive.activeOrdersCount || 0);
      setTotalActiveCostumes(dataActive.totalActiveCostumes || 0);
      setInventoryUtilizationPercentage(dataInventory.utilizationPercentage || 0);
      setTotalStock(dataInventory.totalStock || 0);
      setCurrentlyRented(dataInventory.currentlyRented || 0);
      setCategoryData(dataInventory.categoryBreakdown || []);

      const validOrders = Array.isArray(dataOrders) ? dataOrders : (dataOrders.rentals || dataOrders.data || []);
      setRecentOrders(validOrders.slice(0, 5));

    } catch (error) {
      console.error(error);
      setToast({ isVisible: true, type: "error", message: "Lỗi kết nối máy chủ khi tải báo cáo." });
    } finally {
      setLoadingPage(false);
      setInitialLoading(false);
    }
  }, [token, getDateParams]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData, dateRange]);

  const fmtVND = (n) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n || 0);
  const fmtNum2 = (n) => new Intl.NumberFormat("vi-VN").format(n || 0);
  const fmtPct2 = (n) => `${parseFloat(n || 0).toFixed(1)}%`;

  // Fetch full report data on demand khi export
  const fetchFullReportData = async () => {
    const { startDate, endDate } = getDateParams();
    const q = `?startDate=${startDate}&endDate=${endDate}`;
    const res = await fetch(`http://localhost:9999/api/reports/full${q}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Không thể tải dữ liệu báo cáo toàn diện");
    return res.json();
  };

  const buildFullHTML = (r, now) => {
    const section = (num, title) =>
      `<div style="font-size:13px;font-weight:bold;text-transform:uppercase;letter-spacing:1px;
        margin-top:28px;margin-bottom:10px;padding:5px 10px;background:#f5f5f5;
        border-left:4px solid #1a1a1a;">${num}. ${title}</div>`;
    const kpiTbl = (cells) =>
      `<table style="width:100%;border-collapse:collapse;margin-bottom:10px;"><tr>${
        cells.map(c => `<td style="padding:11px;background:#f9f9f9;border:1px solid #eaeaea;text-align:center;">
          <div style="font-size:11px;color:#777;text-transform:uppercase;">${c.label}</div>
          <div style="font-size:15px;font-weight:bold;margin-top:3px;">${c.value}</div></td>`).join('')
      }</tr></table>`;
    const tbl = (headers, rows) =>
      `<table style="width:100%;border-collapse:collapse;font-size:12px;margin-bottom:8px;">
        <thead><tr>${headers.map(h => `<th style="background:#1a1a1a;color:#fff;padding:7px 8px;text-align:left;">${h}</th>`).join('')}</tr></thead>
        <tbody>${rows.map((r, i) =>
          `<tr style="background:${i % 2 ? '#fafafa' : '#fff'}">${
            r.map(c => `<td style="border-bottom:1px solid #eaeaea;padding:6px 8px;">${c}</td>`).join('')
          }</tr>`
        ).join('')}</tbody></table>`;
    const { revenue, topCostumes, lifecycle, inventory, customers, issues, wallet } = r;
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Báo cáo - CostumeHUB</title>
    <style>* {margin:0;padding:0;box-sizing:border-box;} body{font-family:Arial,sans-serif;color:#1a1a1a;line-height:1.6;padding:40px 50px;}</style>
    </head><body>
    <div style="text-align:center;border-bottom:3px solid #1a1a1a;padding-bottom:14px;margin-bottom:22px;">
      <div style="font-size:11px;font-weight:bold;text-transform:uppercase;letter-spacing:2px;color:#555;">Hệ thống quản lý trang phục</div>
      <div style="font-size:24px;font-weight:bold;">CostumeHUB</div>
      <div style="font-size:15px;font-weight:600;margin-top:3px;">BÁO CÁO TOÀN DIỆN HOẠT ĐỘNG KINH DOANH</div>
      <div style="font-size:13px;color:#555;margin-top:5px;">Kỳ báo cáo: <strong>${dateRange}</strong></div>
      <div style="font-size:11px;color:#999;margin-top:2px;">Ngày trích xuất: ${now}</div>
    </div>
    ${section(1, "Tổng quan tài chính & vận hành")}
    ${kpiTbl([
      { label: "Tổng doanh thu", value: fmtVND(revenue?.totalRevenue) },
      { label: "Số đơn", value: `${fmtNum2(revenue?.orderCount)} đơn` },
      { label: "Tỷ lệ hoàn tất", value: fmtPct2(lifecycle?.completionRate) },
      { label: "Tỷ lệ quá hạn", value: fmtPct2(lifecycle?.overdueRate) },
    ])}
    ${kpiTbl([
      { label: "Phí trễ hạn (lateFee)", value: fmtVND(lifecycle?.totalLateFee) },
      { label: "Phí hư hỏng (damageFee)", value: fmtVND(lifecycle?.totalDamageFee) },
      { label: "Tổng nạp ví", value: fmtVND(wallet?.totalTopUp) },
      { label: "Tỷ lệ khiếu nại", value: fmtPct2(issues?.issueRate) },
    ])}
    ${section(2, "Doanh thu theo phương thức thanh toán")}
    ${revenue?.revenueByPaymentMethod?.length ? tbl(
      ["Phương thức", "Số đơn", "Doanh thu"],
      revenue.revenueByPaymentMethod.map(p => [p.method, fmtNum2(p.count), fmtVND(p.total)])
    ) : "<p style='color:#999;font-size:12px;'>Không có dữ liệu.</p>"}
    ${section(3, "Vòng đời đơn hàng")}
    ${tbl(["Trạng thái","Số đơn","Tỷ lệ"],
      (lifecycle?.lifecycle || []).map(l => [l.label, fmtNum2(l.count),
        lifecycle.total > 0 ? fmtPct2(l.count / lifecycle.total * 100) : "0%"])
    )}
    ${section(4, "Top 10 trang phục thuê nhiều nhất")}
    ${topCostumes?.topByRental?.length ? tbl(
      ["#","Tên trang phục","Lượt thuê","Doanh thu"],
      topCostumes.topByRental.slice(0,10).map((c,i) => [i+1, c.name, fmtNum2(c.rentalCount), fmtVND(c.revenue)])
    ) : "<p style='color:#999;font-size:12px;'>Không có dữ liệu.</p>"}
    ${section(5, "Top 10 khách hàng chi tiêu nhiều nhất")}
    ${customers?.topBySpending?.length ? tbl(
      ["#","Họ tên","Số lần thuê","Tổng chi tiêu"],
      customers.topBySpending.slice(0,10).map((c,i) => [i+1, c.fullName, c.rentalCount, fmtVND(c.totalSpent)])
    ) : "<p style='color:#999;font-size:12px;'>Không có dữ liệu.</p>"}
    ${section(6, "Khiếu nại & Ví điện tử")}
    ${kpiTbl([
      { label: "Tổng khiếu nại", value: `${issues?.total || 0} đơn` },
      { label: "Tỷ lệ", value: fmtPct2(issues?.issueRate) },
      { label: "GD nạp ví thành công", value: `${fmtNum2(wallet?.successCount)} (${wallet?.successRate || 0}%)` },
      { label: "Tổng tiền nạp", value: fmtVND(wallet?.totalTopUp) },
    ])}
    <table style="width:100%;border-collapse:collapse;margin-top:50px;">
      <tr>
        <td style="border:none;text-align:center;width:50%;padding-top:8px;font-size:13px;">
          <div style="font-weight:bold;margin-bottom:55px;">Người lập báo cáo</div>
          <div style="font-style:italic;color:#777;font-size:12px;">(Ký và ghi rõ họ tên)</div>
        </td>
        <td style="border:none;text-align:center;width:50%;padding-top:8px;font-size:13px;">
          <div style="font-weight:bold;margin-bottom:55px;">Chủ cửa hàng phê duyệt</div>
          <div style="font-style:italic;color:#777;font-size:12px;">(Ký tên, đóng dấu)</div>
        </td>
      </tr>
    </table>
    <div style="margin-top:36px;text-align:center;font-size:10px;color:#bbb;border-top:1px solid #eaeaea;padding-top:10px;">
      Tài liệu được tạo tự động bởi hệ thống CostumeHUB — ${now}
    </div>
    </body></html>`;
  };

  const handleExportPDF = async () => {
    setShowExportMenu(false);
    setExcelExporting(true);
    try {
      const r = await fetchFullReportData();
      const now = new Date().toLocaleString("vi-VN");
      const w = window.open("", "_blank");
      w.document.write(buildFullHTML(r, now));
      w.document.close();
      setTimeout(() => { w.focus(); w.print(); }, 400);
    } catch (err) { console.error(err); }
    finally { setExcelExporting(false); }
  };

  const handleExportDOC = async () => {
    setShowExportMenu(false);
    setExcelExporting(true);
    try {
      const r = await fetchFullReportData();
      const now = new Date().toLocaleString("vi-VN");
      const html = buildFullHTML(r, now);
      const blob = new Blob(["\ufeff" + html], { type: "application/msword" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Bao_cao_toan_dien_CostumeHUB_${new Date().toISOString().slice(0, 10)}.doc`;
      document.body.appendChild(a); a.click();
      document.body.removeChild(a); URL.revokeObjectURL(url);
    } catch (err) { console.error(err); }
    finally { setExcelExporting(false); }
  };

  const handleExportExcel = async () => {
    setShowExportMenu(false);
    setExcelExporting(true);
    try {
      const r = await fetchFullReportData();
      const now = new Date().toLocaleString("vi-VN");
      const { revenue, topCostumes, lifecycle, inventory, customers, issues, wallet } = r;
      const wb = XLSX.utils.book_new();

      // Sheet 1: Tổng quan
      const wsSummary = XLSX.utils.aoa_to_sheet([
        ["BÁO CÁO TỔNG HỢP HOẠT ĐỘNG KINH DOANH - COSTUMEHUB"],
        [`Kỳ báo cáo: ${dateRange}`], [`Ngày trích xuất: ${now}`], [],
        ["CHỈ SỐ", "GIÁ TRỊ", "GHI CHÚ"],
        ["Tổng doanh thu", revenue?.totalRevenue || 0, fmtVND(revenue?.totalRevenue)],
        ["Số đơn phát sinh", revenue?.orderCount || 0, ""],
        ["Tỷ lệ hoàn tất", `${lifecycle?.completionRate || 0}%`, "completed / tổng"],
        ["Tỷ lệ huỷ", `${lifecycle?.cancelRate || 0}%`, ""],
        ["Tỷ lệ quá hạn", `${lifecycle?.overdueRate || 0}%`, ""],
        ["Thời gian thuê TB", `${lifecycle?.avgRentalDays || 0} ngày`, ""],
        ["Phí trễ hạn (lateFee)", lifecycle?.totalLateFee || 0, fmtVND(lifecycle?.totalLateFee)],
        ["Phí hư hỏng (damageFee)", lifecycle?.totalDamageFee || 0, fmtVND(lifecycle?.totalDamageFee)],
        ["Tổng nạp ví", wallet?.totalTopUp || 0, fmtVND(wallet?.totalTopUp)],
        ["GD nạp thành công", wallet?.successCount || 0, `${wallet?.successRate || 0}%`],
        ["Tổng đơn khiếu nại", issues?.total || 0, `Tỷ lệ: ${issues?.issueRate || 0}%`],
        ["Khách mới trong kỳ", customers?.newCustomers || 0, ""],
      ]);
      wsSummary["!cols"] = [{ wch: 36 }, { wch: 20 }, { wch: 24 }];
      XLSX.utils.book_append_sheet(wb, wsSummary, "Tong quan");

      // Sheet 2: Doanh thu theo tháng
      if (revenue?.revenueByMonth?.length > 0) {
        const wsM = XLSX.utils.json_to_sheet(revenue.revenueByMonth.map(m => {
          const [y, mo] = m.month.split("-");
          return { "Tháng": `Tháng ${Number(mo)}/${y}`, "Doanh thu (đ)": m.total, "Doanh thu": fmtVND(m.total) };
        }));
        wsM["!cols"] = [{ wch: 16 }, { wch: 18 }, { wch: 22 }];
        XLSX.utils.book_append_sheet(wb, wsM, "Doanh thu theo thang");
      }

      // Sheet 3: Theo phương thức TT
      if (revenue?.revenueByPaymentMethod?.length > 0) {
        const wsP = XLSX.utils.json_to_sheet(revenue.revenueByPaymentMethod.map(p => ({
          "Phương thức": p.method, "Số đơn": p.count,
          "Doanh thu (đ)": p.total, "Doanh thu": fmtVND(p.total),
        })));
        wsP["!cols"] = [{ wch: 16 }, { wch: 10 }, { wch: 18 }, { wch: 22 }];
        XLSX.utils.book_append_sheet(wb, wsP, "Theo phuong thuc TT");
      }

      // Sheet 4: Top trang phục thuê nhiều
      if (topCostumes?.topByRental?.length > 0) {
        const wsT = XLSX.utils.json_to_sheet(topCostumes.topByRental.map((c, i) => ({
          "Hạng": i + 1, "Tên": c.name, "Lượt thuê": c.rentalCount,
          "Doanh thu (đ)": c.revenue, "Doanh thu": fmtVND(c.revenue),
        })));
        wsT["!cols"] = [{ wch: 6 }, { wch: 32 }, { wch: 12 }, { wch: 18 }, { wch: 22 }];
        XLSX.utils.book_append_sheet(wb, wsT, "Top trang phuc thue nhieu");
      }

      // Sheet 5: Top trang phục doanh thu
      if (topCostumes?.topByRevenue?.length > 0) {
        const wsR = XLSX.utils.json_to_sheet(topCostumes.topByRevenue.map((c, i) => ({
          "Hạng": i + 1, "Tên": c.name,
          "Doanh thu (đ)": c.revenue, "Doanh thu": fmtVND(c.revenue), "Lượt thuê": c.rentalCount,
        })));
        wsR["!cols"] = [{ wch: 6 }, { wch: 32 }, { wch: 18 }, { wch: 22 }, { wch: 12 }];
        XLSX.utils.book_append_sheet(wb, wsR, "Top trang phuc doanh thu");
      }

      // Sheet 6: Vòng đời đơn
      const wsLife = XLSX.utils.aoa_to_sheet([
        ["PHÂN TÍCH VÒNG ĐỜI ĐƠN"], [],
        ["Tổng đơn", lifecycle?.total || 0],
        ["Tỷ lệ hoàn tất", `${lifecycle?.completionRate || 0}%`],
        ["Tỷ lệ huỷ", `${lifecycle?.cancelRate || 0}%`],
        ["Tỷ lệ quá hạn", `${lifecycle?.overdueRate || 0}%`],
        ["Thời gian thuê TB", `${lifecycle?.avgRentalDays || 0} ngày`], [],
        ["TRẠNG THÁI", "SỐ ĐƠN", "TỶ LỆ"],
        ...(lifecycle?.lifecycle || []).map(l => [
          l.label, l.count,
          lifecycle.total > 0 ? `${(l.count / lifecycle.total * 100).toFixed(1)}%` : "0%"
        ]), [],
        ["PHÍ PHÁT SINH", ""],
        ["Phí trễ hạn (lateFee)", lifecycle?.totalLateFee || 0],
        ["Phí hư hỏng (damageFee)", lifecycle?.totalDamageFee || 0],
      ]);
      wsLife["!cols"] = [{ wch: 30 }, { wch: 14 }, { wch: 12 }];
      XLSX.utils.book_append_sheet(wb, wsLife, "Vong doi don hang");

      // Sheet 7: Tồn kho theo size
      if (inventory?.rows?.length > 0) {
        const wsInv = XLSX.utils.json_to_sheet(inventory.rows.map(r => ({
          "Tên": r.name, "Danh mục": r.category, "Size": r.size, "SKU": r.sku,
          "Tổng kho": r.totalStock, "Sẵn sàng": r.availableStock,
          "Đang thuê": r.rentedStock, "Tỷ lệ": `${r.utilizationPct}%`,
        })));
        wsInv["!cols"] = [{ wch: 28 }, { wch: 18 }, { wch: 8 }, { wch: 14 }, { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 12 }];
        XLSX.utils.book_append_sheet(wb, wsInv, "Ton kho theo size");
      }

      // Sheet 8: Hot vs Cold
      if (inventory?.hotCostumes?.length > 0) {
        const hot = (inventory.hotCostumes || []).map((r, i) => ({ "Loại": "🔥 Cháy hàng", "Hạng": i+1, "Tên": r.name, "Size": r.size, "Đang thuê": r.rentedStock, "Tỷ lệ": `${r.utilizationPct}%` }));
        const cold = (inventory.coldCostumes || []).map((r, i) => ({ "Loại": "🧊 Ế hàng", "Hạng": i+1, "Tên": r.name, "Size": r.size, "Đang thuê": r.rentedStock, "Tỷ lệ": `${r.utilizationPct}%` }));
        const wsHC = XLSX.utils.json_to_sheet([...hot, ...cold]);
        wsHC["!cols"] = [{ wch: 14 }, { wch: 8 }, { wch: 30 }, { wch: 8 }, { wch: 12 }, { wch: 12 }];
        XLSX.utils.book_append_sheet(wb, wsHC, "Hot vs Cold costumes");
      }

      // Sheet 9: Top khách hàng
      if (customers?.topByRental?.length > 0) {
        const wsCust = XLSX.utils.json_to_sheet(customers.topByRental.map((c, i) => ({
          "Hạng": i+1, "Họ tên": c.fullName, "Email": c.email,
          "SĐT": c.phone, "Số lần thuê": c.rentalCount,
          "Tổng chi tiêu (đ)": c.totalSpent, "Tổng chi tiêu": fmtVND(c.totalSpent),
        })));
        wsCust["!cols"] = [{ wch: 8 }, { wch: 26 }, { wch: 26 }, { wch: 14 }, { wch: 14 }, { wch: 18 }, { wch: 22 }];
        XLSX.utils.book_append_sheet(wb, wsCust, "Top khach hang");
      }

      // Sheet 10: Khiếu nại
      const wsIssue = XLSX.utils.aoa_to_sheet([
        ["BÁO CÁO KHIẾU NẠI"], [],
        ["Tổng đơn khiếu nại", issues?.total || 0],
        ["Tổng đơn thuê trong kỳ", issues?.totalRentals || 0],
        ["Tỷ lệ đơn có khiếu nại", `${issues?.issueRate || 0}%`], [],
        ["PHÂN LOẠI THEO TRẠNG THÁI", ""],
        ...(issues?.statusBreakdown || []).map(s => [s.status, s.count]), [],
        ["PHÂN LOẠI THEO GIẢI PHÁP", ""],
        ...(issues?.resolutionBreakdown || []).map(r => [r.resolution, r.count]),
      ]);
      wsIssue["!cols"] = [{ wch: 32 }, { wch: 14 }];
      XLSX.utils.book_append_sheet(wb, wsIssue, "Khieu nai");

      // Sheet 11: Ví điện tử
      const wsWallet = XLSX.utils.aoa_to_sheet([
        ["BÁO CÁO NẠP VÍ ĐIỆN TỬ"], [],
        ["Tổng giao dịch nạp", wallet?.total || 0],
        ["Thành công", wallet?.successCount || 0, `${wallet?.successRate || 0}%`],
        ["Thất bại", wallet?.failedCount || 0, ""],
        ["Đang chờ", wallet?.pendingCount || 0, ""],
        ["Tổng tiền nạp thành công", wallet?.totalTopUp || 0, fmtVND(wallet?.totalTopUp)],
      ]);
      wsWallet["!cols"] = [{ wch: 28 }, { wch: 14 }, { wch: 16 }];
      XLSX.utils.book_append_sheet(wb, wsWallet, "Vi dien tu");

      XLSX.writeFile(wb, `Bao_cao_toan_dien_CostumeHUB_${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (err) {
      console.error("Lỗi xuất Excel:", err);
    } finally {
      setExcelExporting(false);
    }
  };

  const handleApplyCustomDate = () => {
    if (customStartDate && customEndDate) {
      const startStr = new Date(customStartDate).toLocaleDateString("vi-VN");
      const endStr = new Date(customEndDate).toLocaleDateString("vi-VN");
      setDateRange(`Từ ${startStr} đến ${endStr}`);
      setShowDateMenu(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#eaeaea] border-t-[#1a1a1a]"></div>
      </div>
    );
  }

  const totalCategoryCount = categoryData.reduce((sum, item) => sum + (item.rentedCount || 0), 0);

  return (
    <div className="bg-[#faf9f7] min-h-screen flex flex-col">
      <div className="flex items-center justify-end gap-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                setShowDateMenu(!showDateMenu);
                setShowExportMenu(false);
              }}
              className="flex items-center gap-2 border border-[#eaeaea] rounded-xl bg-white px-4 py-2 text-sm text-[#555] hover:bg-[#faf9f7] transition-colors min-h-[40px] shadow-sm font-medium"
            >
              <FontAwesomeIcon icon={faCalendarAlt} className="text-[#999] text-xs" />
              <span className="text-[#1a1a1a]">{dateRange}</span>
            </button>

            {showDateMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white border border-[#eaeaea] rounded-lg shadow-xl py-2 z-50 animate-fade-in">
                <div className="mb-2">
                  {["Tất cả thời gian", "Hôm nay", "7 ngày qua", "30 ngày qua", "Tháng này"].map((range) => (
                    <button
                      key={range}
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setDateRange(range);
                        setShowDateMenu(false);
                      }}
                      className="w-full text-left px-4 py-1.5 text-sm text-gray-700 hover:bg-[#faf9f7] block font-medium"
                    >
                      {range}
                    </button>
                  ))}
                </div>

                <div className="px-4 py-3 border-t border-[#eaeaea] bg-gray-50/50">
                  <p className="text-xs text-[#999] mb-2 font-medium">Tùy chọn khoảng ngày:</p>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 w-8">Từ:</span>
                      <input
                        type="date"
                        value={customStartDate}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                        className="border border-[#eaeaea] rounded px-2 py-1 text-sm text-[#555] flex-1 focus:outline-none focus:border-[#1a1a1a]"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 w-8">Đến:</span>
                      <input
                        type="date"
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                        className="border border-[#eaeaea] rounded px-2 py-1 text-sm text-[#555] flex-1 focus:outline-none focus:border-[#1a1a1a]"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleApplyCustomDate}
                      disabled={!customStartDate || !customEndDate}
                      className="mt-2 w-full bg-[#1a1a1a] text-white rounded py-1.5 text-xs font-semibold hover:bg-[#333] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      Áp dụng
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="h-6 w-px bg-gray-200"></div>

          <div className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                setShowExportMenu(!showExportMenu);
                setShowDateMenu(false);
              }}
              className="flex items-center gap-2 border border-[#eaeaea] bg-white text-[#1a1a1a] hover:bg-[#faf9f7] rounded-xl px-3 py-2 min-h-[40px] transition-colors shadow-sm"
              title="Xuất báo cáo"
            >
              {excelExporting
                ? <FontAwesomeIcon icon={faSpinner} className="animate-spin text-sm text-emerald-600" />
                : <FontAwesomeIcon icon={faDownload} className="text-sm" />
              }
              <span className="text-sm font-medium hidden sm:inline">Xuất file</span>
              <FontAwesomeIcon icon={faChevronDown} className="text-[#bbb] text-xs" />
            </button>

            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-[#eaeaea] rounded-xl shadow-xl z-50 overflow-hidden">
                {/* Header */}
                <div className="px-4 py-2.5 border-b border-[#f0f0f0] bg-[#faf9f7]">
                  <p className="text-[10px] font-bold text-[#999] uppercase tracking-widest">Xuất báo cáo kỳ này</p>
                </div>

                {/* Excel */}
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); handleExportExcel(); }}
                  disabled={excelExporting}
                  className="w-full text-left px-4 py-3 text-sm hover:bg-emerald-50 flex items-center gap-3 transition-colors disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  <span className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white flex items-center justify-center transition-colors flex-shrink-0">
                    <FontAwesomeIcon icon={excelExporting ? faSpinner : faFileExcel} className={excelExporting ? "animate-spin text-xs" : "text-xs"} />
                  </span>
                  <div>
                    <div className="font-semibold text-[#1a1a1a]">{excelExporting ? "Đang tạo..." : "Xuất Excel"}</div>
                    <div className="text-[10px] text-[#999]">3 sheets · .xlsx</div>
                  </div>
                </button>

                {/* PDF */}
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); handleExportPDF(); }}
                  className="w-full text-left px-4 py-3 text-sm hover:bg-red-50 flex items-center gap-3 transition-colors group"
                >
                  <span className="w-8 h-8 rounded-lg bg-red-100 text-red-500 group-hover:bg-red-500 group-hover:text-white flex items-center justify-center transition-colors flex-shrink-0">
                    <FontAwesomeIcon icon={faFilePdf} className="text-xs" />
                  </span>
                  <div>
                    <div className="font-semibold text-[#1a1a1a]">Xuất PDF</div>
                    <div className="text-[10px] text-[#999]">In trực tiếp · .pdf</div>
                  </div>
                </button>

                {/* Word */}
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); handleExportDOC(); }}
                  className="w-full text-left px-4 py-3 text-sm hover:bg-blue-50 flex items-center gap-3 transition-colors group"
                >
                  <span className="w-8 h-8 rounded-lg bg-blue-100 text-blue-500 group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center transition-colors flex-shrink-0">
                    <FontAwesomeIcon icon={faFileWord} className="text-xs" />
                  </span>
                  <div>
                    <div className="font-semibold text-[#1a1a1a]">Xuất Word</div>
                    <div className="text-[10px] text-[#999]">Chỉnh sửa được · .doc</div>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* === 2. DASHBOARD CANVAS === */}
      <div className="flex-1 p-6 overflow-y-auto">
        <h2 className="text-sm font-semibold text-[#999] uppercase tracking-wider mb-4" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Hiệu suất kinh doanh & Tình trạng kho</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
          {/* --- WIDGET 1: Doanh thu thực tế --- */}
          <div className="bg-white border border-[#eaeaea] rounded-lg shadow-sm p-4 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-[#555]">Tổng doanh thu</h3>
              <button type="button" className="text-[#999] hover:text-[#555]"><FontAwesomeIcon icon={faEllipsisV} className="text-xs" /></button>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold text-[#1a1a1a]">{new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(revenue || 0)}</span>
            </div>
            <div className="mt-3 border-t border-[#f0f0f0] pt-3 text-xs text-[#999] flex items-center gap-1">
              <FontAwesomeIcon icon={faChartBar} className="text-[#999]" /> Tổng giá trị các hóa đơn đã chốt trong kỳ
            </div>
          </div>

          {/* --- WIDGET 2: Đơn hoạt động --- */}
          <div className="bg-white border border-[#eaeaea] rounded-lg shadow-sm p-4 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-[#555]">Sản phẩm đang lưu hành</h3>
              <button type="button" className="text-[#999] hover:text-[#555]"><FontAwesomeIcon icon={faEllipsisV} className="text-xs" /></button>
            </div>
            <div className="flex-1 min-h-[100px] relative mt-2">
              <Bar
                data={{
                  labels: ['Đơn hàng phát sinh', 'Số trang phục'],
                  datasets: [{
                    data: [activeOrdersCount || 0, totalActiveCostumes || 0],
                    backgroundColor: ['#f59e0b', '#3b82f6'],
                    borderRadius: 4, barThickness: 20,
                  }]
                }}
                options={{
                  indexAxis: 'y', responsive: true, maintainAspectRatio: false,
                  plugins: { legend: { display: false }, tooltip: { enabled: true } },
                  scales: {
                    x: { display: false, beginAtZero: true },
                    y: { grid: { display: false, drawBorder: false }, ticks: { font: { size: 12 }, color: '#555' }, border: { display: false } }
                  }
                }}
              />
            </div>
            <div className="mt-3 border-t border-[#f0f0f0] pt-3 text-xs text-[#999] flex items-center gap-1">
              <FontAwesomeIcon icon={faChartBar} className="text-[#999]" /> Số lượng trang phục khách đang giữ bên ngoài
            </div>
          </div>

          {/* --- WIDGET 3: Hiệu suất khai thác kho --- */}
          <div className="bg-white border border-[#eaeaea] rounded-lg shadow-sm p-4 flex flex-col">
            {/* <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-[#555]">Hiệu suất khai thác kho</h3>
              <button type="button" className="text-[#999] hover:text-[#555]"><FontAwesomeIcon icon={faEllipsisV} className="text-xs" /></button>
            </div> */}
            <div className="flex-1 flex items-center justify-around relative mt-2 mb-2">
              <div className="relative w-24 h-24">
                <Doughnut
                  data={{
                    labels: ['Đang cho thuê', 'Còn trống trong kho'],
                    datasets: [{
                      data: [currentlyRented || 0, Math.max(0, (totalStock || 0) - (currentlyRented || 0))],
                      backgroundColor: ['#ef4444', '#f3f4f6'],
                      borderWidth: 0, cutout: '75%',
                    }]
                  }}
                  options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { enabled: true } } }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-bold text-[#1a1a1a]">{inventoryUtilizationPercentage || 0}%</span>
                </div>
              </div>
              <div className="flex flex-col justify-center gap-3">
                <div><p className="text-[10px] text-[#999] uppercase tracking-wide">Đang thuê</p><p className="text-xl font-bold text-[#ef4444] leading-none">{currentlyRented || 0}</p></div>
                <div><p className="text-[10px] text-[#999] uppercase tracking-wide">Tổng kho</p><p className="text-xl font-bold text-[#1a1a1a] leading-none">{totalStock || 0}</p></div>
              </div>
            </div>
            <div className="mt-3 border-t border-[#f0f0f0] pt-3 text-xs text-[#999] flex items-center gap-1 justify-center">
              <FontAwesomeIcon icon={faChartBar} className="text-[#999]" /> Tỷ lệ sản phẩm mang lại doanh thu trên tổng sản phẩm kho
            </div>
          </div>

          {/* --- WIDGET 4: Biểu đồ doanh thu xu hướng --- */}
          <div className="bg-white border border-[#eaeaea] rounded-lg shadow-sm p-4 md:col-span-2 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-[#555]">Biểu đồ xu hướng doanh thu</h3>
              <button type="button" className="text-[#999] hover:text-[#555]"><FontAwesomeIcon icon={faEllipsisV} className="text-xs" /></button>
            </div>
            {revenueByMonth.length === 0 ? (
              <div className="flex-1 min-h-[180px] flex items-center justify-center text-xs text-[#999]">
                Không có dữ liệu doanh thu trong khoảng thời gian này.
              </div>
            ) : (
              <div className="flex-1 min-h-[180px] relative mt-2">
                <Bar
                  data={{
                    labels: revenueByMonth.map(m => `Tháng ${Number(m.month.split('-')[1])}/${m.month.split('-')[0]}`),
                    datasets: [{
                      label: 'Doanh thu',
                      data: revenueByMonth.map(m => m.total),
                      backgroundColor: '#f97316', // Changed to orange
                      borderRadius: 4,
                      barThickness: 30,
                    }]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { display: false },
                      tooltip: {
                        callbacks: {
                          label: function (context) {
                            return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(context.raw);
                          }
                        }
                      }
                    },
                    scales: {
                      x: { grid: { display: false } },
                      y: { beginAtZero: true, border: { display: false } }
                    }
                  }}
                />
              </div>
            )}
          </div>

          {/* --- WIDGET 5: Biểu đồ tỷ lệ danh mục thực tế --- */}
          <div className="bg-white border border-[#eaeaea] rounded-lg shadow-sm p-4 flex flex-col">
            <div className="flex items-center justify-between w-full mb-4">
              <h3 className="text-sm font-medium text-[#555]">Cơ cấu trang phục theo danh mục cha - con</h3>
              <button type="button" className="text-[#999] hover:text-[#555]"><FontAwesomeIcon icon={faEllipsisV} className="text-xs" /></button>
            </div>

            <div className="flex-1 min-h-[200px] relative">
              {(() => {
                const groupedCategories = {};
                categoryData.forEach(c => {
                  const pName = c.parentName || c.name; // Use parentName, if none, it's a main category
                  if (!groupedCategories[pName]) groupedCategories[pName] = [];
                  groupedCategories[pName].push(c);
                });

                const parentLabels = Object.keys(groupedCategories);
                const childDatasets = categoryData.map((c, i) => {
                  const pName = c.parentName || c.name;
                  const data = parentLabels.map(p => p === pName ? (c.rentedCount || 0) : 0);
                  return {
                    label: c.name,
                    data,
                    backgroundColor: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
                    stack: 'Stack 0',
                  };
                });

                return (
                  <Bar
                    data={{
                      labels: parentLabels,
                      datasets: childDatasets
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { display: false },
                        tooltip: { enabled: true }
                      },
                      scales: {
                        x: { stacked: true, grid: { display: false } },
                        y: { stacked: true, beginAtZero: true, border: { display: false } }
                      }
                    }}
                  />
                );
              })()}
            </div>
          </div>

          {/* --- WIDGET 6: Bảng dữ liệu Đơn thuê mới cập nhật --- */}
          <div className="bg-white border border-[#eaeaea] rounded-lg shadow-sm p-4 lg:col-span-3">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-[#555] flex items-center gap-2">
                <FontAwesomeIcon icon={faTable} className="text-[#999]" /> Đơn thuê phát sinh trong kỳ báo cáo
              </h3>
              <button type="button" className="text-[#999] hover:text-[#555]"><FontAwesomeIcon icon={faEllipsisV} className="text-xs" /></button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-border border-[#eaeaea] text-[#999] font-normal text-xs uppercase">
                    <th className="pb-2 pr-4">Mã đơn</th>
                    <th className="pb-2 pr-4">Khách hàng</th>
                    <th className="pb-2 pr-4">Thời gian thuê</th>
                    <th className="pb-2 pr-4 text-right">Tổng tiền hóa đơn</th>
                    <th className="pb-2 text-center">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="text-[#555]">
                  {recentOrders.map((order) => (
                    <tr key={order._id} className="border-border border-[#f0f0f0] hover:bg-[#faf9f7] text-xs">
                      <td className="py-3 pr-4 font-semibold text-gray-700">#{order._id?.slice(-6).toUpperCase()}</td>
                      <td className="py-3 pr-4 font-medium">{order.shippingAddress?.receiverName || order.customerId?.fullName || "Khách hàng"}</td>
                      <td className="py-3 pr-4">
                        {new Date(order.startDate).toLocaleDateString("vi-VN")} - {new Date(order.endDate).toLocaleDateString("vi-VN")}
                      </td>
                      <td className="py-3 pr-4 text-right font-semibold">{order.totalAmount?.toLocaleString("vi-VN")} đ</td>
                      <td className="py-3 text-center">
                        <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {recentOrders.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-6 text-gray-400">Không tìm thấy đơn hàng nào trong khoảng thời gian được chọn.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}