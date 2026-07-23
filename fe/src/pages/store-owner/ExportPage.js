import { useState, useEffect, useCallback } from "react";
import * as XLSX from "xlsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFilePdf, faFileWord, faFileExcel, faChartLine, faBoxes,
  faSpinner, faCalendarAlt, faDownload, faChevronDown,
  faUsers, faExclamationTriangle, faCreditCard,
  faCheckCircle, faTimesCircle, faShoppingBag, faWarehouse,
  faArrowTrendUp,
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "../../context/AuthContext";
import Toast from "../../components/ui/Toast";
import costumeService from "../../services/costume.service";
import { exportInventoryExcelFile } from "../../utils/inventoryReport";

const DATE_RANGE_OPTIONS = ["Tất cả thời gian", "Hôm nay", "7 ngày qua", "30 ngày qua", "Tháng này"];
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:9999";

const fmtVND = (n) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n || 0);
const fmtNum = (n) => new Intl.NumberFormat("vi-VN").format(n || 0);
const fmtPct = (n) => `${parseFloat(n || 0).toFixed(1)}%`;

export default function ExportPage() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ isVisible: false, message: "", type: "success" });
  const [exporting, setExporting] = useState({ excel: false, pdf: false, doc: false, inventory: false });

  // ─ Full report data từ /api/reports/full ─
  const [fullReport, setFullReport] = useState(null);
  // ─ Inventory Excel riêng (lấy từ costumeService) ─
  const [inventoryExporting, setInventoryExporting] = useState(false);

  const [dateRange, setDateRange] = useState("Tất cả thời gian");
  const [showDateMenu, setShowDateMenu] = useState(false);
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

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

  const fetchFullReport = useCallback(async () => {
    try {
      setLoading(true);
      const { startDate, endDate } = getDateParams();
      const q = `?startDate=${startDate}&endDate=${endDate}`;
      const res = await fetch(`${API_URL}/api/reports/full${q}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setFullReport(data);
      } else {
        setToast({ isVisible: true, type: "error", message: "Không thể tải dữ liệu báo cáo." });
      }
    } catch {
      setToast({ isVisible: true, type: "error", message: "Lỗi kết nối máy chủ." });
    } finally {
      setLoading(false);
    }
  }, [token, getDateParams]);

  useEffect(() => { if (token) fetchFullReport(); }, [token, fetchFullReport]);

  const handleApplyCustomDate = () => {
    if (customStartDate && customEndDate) {
      setDateRange(`Từ ${new Date(customStartDate).toLocaleDateString("vi-VN")} đến ${new Date(customEndDate).toLocaleDateString("vi-VN")}`);
      setShowDateMenu(false);
    }
  };

  // ─────────────────────────── EXCEL EXPORT ───────────────────────────
  const handleExportExcel = async () => {
    if (!fullReport) return;
    setExporting(e => ({ ...e, excel: true }));
    try {
      const wb = XLSX.utils.book_new();
      const now = new Date().toLocaleString("vi-VN");
      const { revenue, topCostumes, lifecycle, inventory, customers, issues } = fullReport;

      // ── Sheet 1: Tổng quan ──
      const wsSummary = XLSX.utils.aoa_to_sheet([
        ["BÁO CÁO TỔNG HỢP HOẠT ĐỘNG KINH DOANH - COSTUMEHUB"],
        [`Kỳ báo cáo: ${dateRange}`],
        [`Ngày trích xuất: ${now}`],
        [],
        ["CHỈ SỐ", "GIÁ TRỊ", "GHI CHÚ"],
        ["Tổng doanh thu", revenue?.totalRevenue || 0, fmtVND(revenue?.totalRevenue)],
        ["Số đơn phát sinh", revenue?.orderCount || 0, ""],
        ["Tỷ lệ hoàn tất", `${lifecycle?.completionRate || 0}%`, "completed / tổng"],
        ["Tỷ lệ huỷ", `${lifecycle?.cancelRate || 0}%`, "cancelled / tổng"],
        ["Tỷ lệ quá hạn", `${lifecycle?.overdueRate || 0}%`, "overdue / tổng"],
        ["Thời gian thuê trung bình", `${lifecycle?.avgRentalDays || 0} ngày`, ""],
        ["Tổng phí trễ hạn (lateFee)", lifecycle?.totalLateFee || 0, fmtVND(lifecycle?.totalLateFee)],
        ["Tổng phí hư hỏng (damageFee)", lifecycle?.totalDamageFee || 0, fmtVND(lifecycle?.totalDamageFee)],
        ["Tổng đơn có khiếu nại", issues?.total || 0, `Tỷ lệ: ${issues?.issueRate || 0}%`],
        ["Khách hàng mới trong kỳ", customers?.newCustomers || 0, ""],
      ]);
      wsSummary["!cols"] = [{ wch: 36 }, { wch: 20 }, { wch: 24 }];
      XLSX.utils.book_append_sheet(wb, wsSummary, "Tong quan");

      // ── Sheet 2: Doanh thu theo tháng ──
      if (revenue?.revenueByMonth?.length > 0) {
        const wsMonthly = XLSX.utils.json_to_sheet(
          revenue.revenueByMonth.map(m => {
            const [y, mo] = m.month.split("-");
            return { "Tháng": `Tháng ${Number(mo)}/${y}`, "Doanh thu (đ)": m.total, "Doanh thu": fmtVND(m.total) };
          })
        );
        wsMonthly["!cols"] = [{ wch: 16 }, { wch: 18 }, { wch: 22 }];
        XLSX.utils.book_append_sheet(wb, wsMonthly, "Doanh thu theo thang");
      }

      // ── Sheet 3: Doanh thu theo phương thức TT ──
      if (revenue?.revenueByPaymentMethod?.length > 0) {
        const wsPayment = XLSX.utils.json_to_sheet(
          revenue.revenueByPaymentMethod.map(p => ({
            "Phương thức": p.method,
            "Số đơn": p.count,
            "Doanh thu (đ)": p.total,
            "Doanh thu": fmtVND(p.total),
          }))
        );
        wsPayment["!cols"] = [{ wch: 16 }, { wch: 10 }, { wch: 18 }, { wch: 22 }];
        XLSX.utils.book_append_sheet(wb, wsPayment, "Theo phuong thuc TT");
      }

      // ── Sheet 4: Top trang phục thuê nhiều ──
      if (topCostumes?.topByRental?.length > 0) {
        const wsTop = XLSX.utils.json_to_sheet(
          topCostumes.topByRental.map((c, i) => ({
            "Hạng": i + 1,
            "Tên trang phục": c.name,
            "Lượt thuê": c.rentalCount,
            "Doanh thu (đ)": c.revenue,
            "Doanh thu": fmtVND(c.revenue),
          }))
        );
        wsTop["!cols"] = [{ wch: 6 }, { wch: 32 }, { wch: 12 }, { wch: 18 }, { wch: 22 }];
        XLSX.utils.book_append_sheet(wb, wsTop, "Top trang phuc thue nhieu");
      }

      // ── Sheet 5: Top trang phục doanh thu cao ──
      if (topCostumes?.topByRevenue?.length > 0) {
        const wsRev = XLSX.utils.json_to_sheet(
          topCostumes.topByRevenue.map((c, i) => ({
            "Hạng": i + 1,
            "Tên trang phục": c.name,
            "Doanh thu (đ)": c.revenue,
            "Doanh thu": fmtVND(c.revenue),
            "Lượt thuê": c.rentalCount,
          }))
        );
        wsRev["!cols"] = [{ wch: 6 }, { wch: 32 }, { wch: 18 }, { wch: 22 }, { wch: 12 }];
        XLSX.utils.book_append_sheet(wb, wsRev, "Top trang phuc doanh thu");
      }

      // ── Sheet 6: Vòng đời đơn ──
      if (lifecycle) {
        const wsLife = XLSX.utils.aoa_to_sheet([
          ["PHÂN TÍCH VÒNG ĐỜI ĐƠN HÀNG"],
          [],
          ["Tổng đơn", lifecycle.total],
          ["Tỷ lệ hoàn tất", `${lifecycle.completionRate}%`],
          ["Tỷ lệ huỷ", `${lifecycle.cancelRate}%`],
          ["Tỷ lệ quá hạn", `${lifecycle.overdueRate}%`],
          ["Thời gian thuê TB (ngày)", lifecycle.avgRentalDays],
          [],
          ["TRẠNG THÁI", "SỐ ĐƠN", "TỶ LỆ"],
          ...lifecycle.lifecycle.map(l => [
            l.label, l.count,
            lifecycle.total > 0 ? `${(l.count / lifecycle.total * 100).toFixed(1)}%` : "0%"
          ]),
          [],
          ["PHÍ PHÁT SINH", ""],
          ["Tổng phí trễ hạn (lateFee)", lifecycle.totalLateFee],
          ["Tổng phí hư hỏng (damageFee)", lifecycle.totalDamageFee],
          ["Tổng phí phát sinh", (lifecycle.totalLateFee || 0) + (lifecycle.totalDamageFee || 0)],
        ]);
        wsLife["!cols"] = [{ wch: 30 }, { wch: 14 }, { wch: 12 }];
        XLSX.utils.book_append_sheet(wb, wsLife, "Vong doi don hang");
      }

      // ── Sheet 7: Tồn kho theo costume/size ──
      if (inventory?.rows?.length > 0) {
        const wsInv = XLSX.utils.json_to_sheet(
          inventory.rows.map(r => ({
            "Tên trang phục": r.name,
            "Danh mục": r.category,
            "Size": r.size,
            "SKU": r.sku,
            "Tổng kho": r.totalStock,
            "Sẵn sàng": r.availableStock,
            "Đang thuê": r.rentedStock,
            "Tỷ lệ khai thác": `${r.utilizationPct}%`,
            "Trạng thái": r.status,
          }))
        );
        wsInv["!cols"] = [{ wch: 30 }, { wch: 18 }, { wch: 8 }, { wch: 14 }, { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 16 }, { wch: 14 }];
        XLSX.utils.book_append_sheet(wb, wsInv, "Ton kho theo size");
      }

      // ── Sheet 8: Hot vs Cold costumes ──
      if (inventory?.hotCostumes?.length > 0 || inventory?.coldCostumes?.length > 0) {
        const hotRows = (inventory.hotCostumes || []).map((r, i) => ({
          "Loại": "🔥 Cháy hàng", "Hạng": i + 1,
          "Tên": r.name, "Size": r.size,
          "Đang thuê": r.rentedStock, "Tỷ lệ": `${r.utilizationPct}%`,
        }));
        const coldRows = (inventory.coldCostumes || []).map((r, i) => ({
          "Loại": "🧊 Ế hàng", "Hạng": i + 1,
          "Tên": r.name, "Size": r.size,
          "Đang thuê": r.rentedStock, "Tỷ lệ": `${r.utilizationPct}%`,
        }));
        const wsHotCold = XLSX.utils.json_to_sheet([...hotRows, ...coldRows]);
        wsHotCold["!cols"] = [{ wch: 14 }, { wch: 8 }, { wch: 30 }, { wch: 8 }, { wch: 12 }, { wch: 12 }];
        XLSX.utils.book_append_sheet(wb, wsHotCold, "Hot vs Cold costumes");
      }

      // ── Sheet 9: Top khách hàng ──
      if (customers?.topByRental?.length > 0) {
        const wsCust = XLSX.utils.json_to_sheet(
          customers.topByRental.map((c, i) => ({
            "Hạng (thuê nhiều)": i + 1,
            "Họ tên": c.fullName,
            "Email": c.email,
            "SĐT": c.phone,
            "Số lần thuê": c.rentalCount,
            "Tổng chi tiêu (đ)": c.totalSpent,
            "Tổng chi tiêu": fmtVND(c.totalSpent),
          }))
        );
        wsCust["!cols"] = [{ wch: 14 }, { wch: 26 }, { wch: 26 }, { wch: 14 }, { wch: 14 }, { wch: 18 }, { wch: 22 }];
        XLSX.utils.book_append_sheet(wb, wsCust, "Top khach hang");
      }

      // ── Sheet 10: Khiếu nại ──
      if (issues) {
        const wsIssue = XLSX.utils.aoa_to_sheet([
          ["BÁO CÁO KHIẾU NẠI (ISSUE)"],
          [],
          ["Tổng đơn khiếu nại", issues.total],
          ["Tổng đơn thuê trong kỳ", issues.totalRentals],
          ["Tỷ lệ đơn có khiếu nại", `${issues.issueRate}%`],
          [],
          ["PHÂN LOẠI THEO TRẠNG THÁI", ""],
          ...(issues.statusBreakdown || []).map(s => [s.status, s.count]),
          [],
          ["PHÂN LOẠI THEO GIẢI PHÁP", ""],
          ...(issues.resolutionBreakdown || []).map(r => [r.resolution, r.count]),
        ]);
        wsIssue["!cols"] = [{ wch: 32 }, { wch: 14 }];
        XLSX.utils.book_append_sheet(wb, wsIssue, "Khieu nai");
      }

      XLSX.writeFile(wb, `Bao_cao_toan_dien_CostumeHUB_${new Date().toISOString().slice(0, 10)}.xlsx`);
      setToast({ isVisible: true, type: "success", message: "Xuất Excel thành công! 10 sheets dữ liệu." });
    } catch (err) {
      console.error(err);
      setToast({ isVisible: true, type: "error", message: "Lỗi khi xuất Excel." });
    } finally {
      setExporting(e => ({ ...e, excel: false }));
    }
  };

  // ─────────────────────────── PDF / WORD HTML ───────────────────────────
  const generateFullReportHTML = () => {
    if (!fullReport) return "";
    const now = new Date().toLocaleString("vi-VN");
    const { revenue, topCostumes, lifecycle, inventory, customers, issues } = fullReport;

    const section = (num, title) =>
      `<div style="font-size:13px;font-weight:bold;text-transform:uppercase;letter-spacing:1px;
        margin-top:28px;margin-bottom:10px;padding:5px 10px;background:#f5f5f5;
        border-left:4px solid #1a1a1a;">${num}. ${title}</div>`;

    const kpiTable = (cells) =>
      `<table style="width:100%;border-collapse:collapse;margin-bottom:12px;">
        <tr>${cells.map(c =>
          `<td style="padding:12px;background:#f9f9f9;border:1px solid #eaeaea;text-align:center;">
            <div style="font-size:11px;color:#777;text-transform:uppercase;">${c.label}</div>
            <div style="font-size:16px;font-weight:bold;margin-top:4px;">${c.value}</div>
          </td>`
        ).join('')}</tr>
      </table>`;

    const table = (headers, rows) =>
      `<table style="width:100%;border-collapse:collapse;font-size:12px;margin-bottom:8px;">
        <thead><tr>${headers.map(h => `<th style="background:#1a1a1a;color:#fff;padding:8px;text-align:left;">${h}</th>`).join('')}</tr></thead>
        <tbody>${rows.map((r, i) =>
          `<tr style="background:${i % 2 === 0 ? '#fff' : '#fafafa'}">
            ${r.map(c => `<td style="border-bottom:1px solid #eaeaea;padding:7px 8px;">${c}</td>`).join('')}
          </tr>`
        ).join('')}</tbody>
      </table>`;

    return `<!DOCTYPE html><html><head><meta charset="utf-8">
    <title>Báo cáo toàn diện - CostumeHUB</title>
    <style>
      * { margin:0; padding:0; box-sizing:border-box; }
      body { font-family:Arial,sans-serif; color:#1a1a1a; line-height:1.6; padding:40px 50px; }
      .page-footer { margin-top:40px; text-align:center; font-size:10px; color:#bbb; border-top:1px solid #eaeaea; padding-top:12px; }
      .sig-table { width:100%; border-collapse:collapse; margin-top:50px; }
      .sig-table td { border:none; text-align:center; width:50%; padding-top:10px; font-size:13px; }
    </style>
    </head><body>
    <div style="text-align:center;border-bottom:3px solid #1a1a1a;padding-bottom:16px;margin-bottom:24px;">
      <div style="font-size:12px;font-weight:bold;text-transform:uppercase;letter-spacing:2px;color:#555;">Hệ thống quản lý trang phục</div>
      <div style="font-size:26px;font-weight:bold;">CostumeHUB</div>
      <div style="font-size:16px;font-weight:600;margin-top:4px;">BÁO CÁO TOÀN DIỆN HOẠT ĐỘNG KINH DOANH</div>
      <div style="font-size:13px;color:#555;margin-top:6px;">Kỳ báo cáo: <strong>${dateRange}</strong></div>
      <div style="font-size:11px;color:#999;margin-top:3px;">Ngày trích xuất: ${now}</div>
    </div>

    ${section(1, "Tổng quan tài chính & vận hành")}
    ${kpiTable([
      { label: "Tổng doanh thu", value: fmtVND(revenue?.totalRevenue) },
      { label: "Số đơn phát sinh", value: `${fmtNum(revenue?.orderCount)} đơn` },
      { label: "Tỷ lệ hoàn tất", value: fmtPct(lifecycle?.completionRate) },
      { label: "Thời gian thuê TB", value: `${lifecycle?.avgRentalDays || 0} ngày` },
    ])}
    ${kpiTable([
      { label: "Phí trễ hạn (lateFee)", value: fmtVND(lifecycle?.totalLateFee) },
      { label: "Phí hư hỏng (damageFee)", value: fmtVND(lifecycle?.totalDamageFee) },
      { label: "Tỷ lệ huỷ đơn", value: fmtPct(lifecycle?.cancelRate) },
      { label: "Tỷ lệ quá hạn", value: fmtPct(lifecycle?.overdueRate) },
    ])}

    ${section(2, "Doanh thu theo phương thức thanh toán")}
    ${revenue?.revenueByPaymentMethod?.length > 0
      ? table(
          ["Phương thức", "Số đơn", "Doanh thu"],
          revenue.revenueByPaymentMethod.map(p => [p.method, fmtNum(p.count), fmtVND(p.total)])
        )
      : "<p style='color:#999;font-size:12px;'>Không có dữ liệu.</p>"
    }

    ${section(3, "Vòng đời đơn hàng")}
    ${table(
      ["Trạng thái", "Số đơn", "Tỷ lệ"],
      (lifecycle?.lifecycle || []).map(l => [
        l.label, fmtNum(l.count),
        lifecycle.total > 0 ? fmtPct(l.count / lifecycle.total * 100) : "0%"
      ])
    )}

    ${section(4, "Top 10 trang phục được thuê nhiều nhất")}
    ${topCostumes?.topByRental?.length > 0
      ? table(
          ["#", "Tên trang phục", "Lượt thuê", "Doanh thu"],
          topCostumes.topByRental.slice(0, 10).map((c, i) => [i + 1, c.name, fmtNum(c.rentalCount), fmtVND(c.revenue)])
        )
      : "<p style='color:#999;font-size:12px;'>Không có dữ liệu.</p>"
    }

    ${section(5, "Tồn kho — Hot vs Cold")}
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
      <div>
        <div style="font-weight:bold;font-size:12px;margin-bottom:6px;color:#16a34a;">🔥 Cháy hàng (đang được thuê nhiều)</div>
        ${table(["Tên", "Size", "Đang thuê", "Tỷ lệ"],
          (inventory?.hotCostumes || []).slice(0, 5).map(r => [r.name, r.size, r.rentedStock, `${r.utilizationPct}%`])
        )}
      </div>
      <div>
        <div style="font-weight:bold;font-size:12px;margin-bottom:6px;color:#dc2626;">🧊 Ế hàng (ít được thuê)</div>
        ${table(["Tên", "Size", "Đang thuê", "Tỷ lệ"],
          (inventory?.coldCostumes || []).slice(0, 5).map(r => [r.name, r.size, r.rentedStock, `${r.utilizationPct}%`])
        )}
      </div>
    </div>

    ${section(6, "Top 10 khách hàng chi tiêu nhiều nhất")}
    ${customers?.topBySpending?.length > 0
      ? table(
          ["#", "Họ tên", "Số lần thuê", "Tổng chi tiêu"],
          customers.topBySpending.slice(0, 10).map((c, i) => [i + 1, c.fullName, c.rentalCount, fmtVND(c.totalSpent)])
        )
      : "<p style='color:#999;font-size:12px;'>Không có dữ liệu.</p>"
    }

    ${section(7, "Khiếu nại (Issue)")}
    ${kpiTable([
      { label: "Tổng khiếu nại", value: `${issues?.total || 0} đơn` },
      { label: "Tỷ lệ đơn có Issue", value: fmtPct(issues?.issueRate) },
      { label: "Đổi/trả hàng", value: `${(issues?.resolutionBreakdown || []).find(r => r.resolution?.includes('return'))?.count || 0} đơn` },
      { label: "Đổi hàng", value: `${(issues?.resolutionBreakdown || []).find(r => r.resolution?.includes('exchange'))?.count || 0} đơn` },
    ])}

    <table class="sig-table">
      <tr>
        <td>
          <div style="font-weight:bold;margin-bottom:55px;">Người lập báo cáo</div>
          <div style="font-style:italic;color:#777;font-size:12px;">(Ký và ghi rõ họ tên)</div>
        </td>
        <td>
          <div style="font-weight:bold;margin-bottom:55px;">Chủ cửa hàng phê duyệt</div>
          <div style="font-style:italic;color:#777;font-size:12px;">(Ký tên, đóng dấu)</div>
        </td>
      </tr>
    </table>
    <div class="page-footer">Tài liệu được tạo tự động bởi hệ thống CostumeHUB — ${now}</div>
    </body></html>`;
  };

  const handleExportPDF = () => {
    if (!fullReport) return;
    const w = window.open("", "_blank");
    w.document.write(generateFullReportHTML());
    w.document.close();
    setTimeout(() => { w.focus(); w.print(); }, 400);
  };

  const handleExportDOC = () => {
    if (!fullReport) return;
    const html = generateFullReportHTML();
    const blob = new Blob(["\ufeff" + html], { type: "application/msword" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Bao_cao_toan_dien_CostumeHUB_${new Date().toISOString().slice(0, 10)}.doc`;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  // ─────────────────────────── Inventory Excel riêng ───────────────────────────
  const handleExportInventoryExcel = async () => {
    setInventoryExporting(true);
    try {
      const data = await costumeService.getAll({ limit: 1000, status: "available,out_of_stock,maintenance,dry_cleaning,rented,hidden" });
      exportInventoryExcelFile(data.costumes || []);
      setToast({ isVisible: true, type: "success", message: "Xuất Excel tồn kho thành công!" });
    } catch {
      setToast({ isVisible: true, type: "error", message: "Lỗi xuất tồn kho." });
    } finally {
      setInventoryExporting(false);
    }
  };

  // ─────────────────────────── HELPERS UI ───────────────────────────
  const KpiGrid = ({ items }) => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-[#f0f0f0]">
      {items.map(kpi => (
        <div key={kpi.label} className="bg-white px-5 py-4">
          <div className="flex items-center gap-2 mb-1.5">
            <span className={`w-7 h-7 rounded-lg ${kpi.bg} ${kpi.color} flex items-center justify-center text-xs`}>
              <FontAwesomeIcon icon={kpi.icon} />
            </span>
            <span className="text-xs text-[#999] font-medium leading-tight">{kpi.label}</span>
          </div>
          <div className={`text-base font-bold ${kpi.color}`}>{kpi.value}</div>
          {kpi.sub && <div className="text-[10px] text-[#bbb] mt-0.5">{kpi.sub}</div>}
        </div>
      ))}
    </div>
  );

  const ExportButtons = ({ onExcel, onPdf, onDoc, excelLoading, noData }) => (
    <div className="px-6 py-5 border-t border-[#f0f0f0] bg-[#faf9f7]">
      <p className="text-xs font-semibold text-[#999] uppercase tracking-wide mb-3 flex items-center gap-2">
        <FontAwesomeIcon icon={faDownload} /> Xuất file
      </p>
      <div className="grid grid-cols-3 gap-3">
        {[
          { id: "excel", label: "Xuất Excel", sub: ".xlsx", color: "emerald", icon: faFileExcel, onClick: onExcel, loading: excelLoading },
          { id: "pdf", label: "Xuất PDF", sub: "In trực tiếp", color: "red", icon: faFilePdf, onClick: onPdf },
          { id: "word", label: "Xuất Word", sub: "Chỉnh sửa được", color: "blue", icon: faFileWord, onClick: onDoc },
        ].map(btn => {
          const colors = {
            emerald: "border-emerald-200 bg-emerald-50 hover:bg-emerald-500 hover:border-emerald-500 text-emerald-700 group-hover:text-white icon-bg:bg-emerald-500",
            red: "border-red-200 bg-red-50 hover:bg-red-500 hover:border-red-500 text-red-700 group-hover:text-white",
            blue: "border-blue-200 bg-blue-50 hover:bg-blue-600 hover:border-blue-600 text-blue-700 group-hover:text-white",
          };
          const iconBg = { emerald: "bg-emerald-500", red: "bg-red-500", blue: "bg-blue-600" };
          return (
            <button key={btn.id} type="button" onClick={btn.onClick}
              disabled={btn.loading || noData}
              className={`group flex flex-col items-center gap-2 py-4 px-2 rounded-xl border-2 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed ${colors[btn.color]}`}
            >
              <div className={`w-9 h-9 rounded-lg ${iconBg[btn.color]} group-hover:bg-white flex items-center justify-center text-white group-hover:text-${btn.color === "emerald" ? "emerald" : btn.color === "red" ? "red" : "blue"}-600 text-base transition-colors`}>
                <FontAwesomeIcon icon={btn.loading ? faSpinner : btn.icon} className={btn.loading ? "animate-spin" : ""} />
              </div>
              <div className="text-center">
                <div className="text-xs font-bold">{btn.loading ? "Đang tạo..." : btn.label}</div>
                <div className="text-[10px] opacity-70">{btn.sub}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );

  // ─────────────────────────── RENDER ───────────────────────────
  const r = fullReport;
  const noData = !r;

  return (
    <div className="bg-[#faf9f7] min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-[#eaeaea] px-6 py-4 sticky top-0 z-10 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#1a1a1a]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            Trung tâm Xuất Báo cáo
          </h1>
          <p className="text-sm text-[#555] mt-0.5">
            Kỳ: <span className="font-semibold text-[#1a1a1a]">{dateRange}</span>
            {r && <span className="ml-2 text-emerald-600 font-semibold">· {r.revenue?.orderCount || 0} đơn · {fmtVND(r.revenue?.totalRevenue)}</span>}
          </p>
        </div>
        <div className="relative">
          <button type="button" onClick={() => setShowDateMenu(!showDateMenu)}
            className="flex items-center gap-2 border border-[#eaeaea] rounded-xl bg-white px-4 py-2.5 text-sm shadow-sm hover:bg-[#faf9f7] transition-colors">
            <FontAwesomeIcon icon={faCalendarAlt} className="text-[#999] text-xs" />
            <span className="font-medium text-[#1a1a1a]">{dateRange}</span>
            <FontAwesomeIcon icon={faChevronDown} className="text-[#bbb] text-xs" />
          </button>
          {showDateMenu && (
            <div className="absolute right-0 mt-2 w-64 bg-white border border-[#eaeaea] rounded-xl shadow-xl py-2 z-50">
              {DATE_RANGE_OPTIONS.map(range => (
                <button key={range} type="button"
                  onClick={() => { setDateRange(range); setShowDateMenu(false); }}
                  className={`w-full text-left px-4 py-2 text-sm font-medium transition-colors ${dateRange === range ? "bg-[#1a1a1a] text-white" : "text-gray-700 hover:bg-[#faf9f7]"}`}>
                  {range}
                </button>
              ))}
              <div className="px-4 py-3 border-t border-[#eaeaea] bg-gray-50/50">
                <p className="text-xs text-[#999] mb-2 font-semibold uppercase tracking-wide">Khoảng ngày tuỳ chọn</p>
                <div className="flex flex-col gap-2">
                  {[["Từ:", customStartDate, setCustomStartDate], ["Đến:", customEndDate, setCustomEndDate]].map(([lbl, val, fn]) => (
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
      </div>

      {/* Body */}
      <div className="p-6 max-w-5xl mx-auto flex flex-col gap-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <FontAwesomeIcon icon={faSpinner} className="animate-spin text-3xl text-[#bbb]" />
            <span className="text-sm text-[#999]">Đang tải dữ liệu báo cáo toàn diện…</span>
          </div>
        ) : (
          <>
            {/* ── Card 1: Báo cáo Kinh doanh Toàn diện ── */}
            <div className="bg-white rounded-2xl border border-[#eaeaea] shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-[#f0f0f0] flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-sm">
                  <FontAwesomeIcon icon={faChartLine} />
                </div>
                <div>
                  <h2 className="font-bold text-[#1a1a1a] text-base">Báo cáo Toàn diện Kinh doanh</h2>
                  <p className="text-xs text-[#777] mt-0.5">Doanh thu · Vận hành · Trang phục · Khách hàng · Khiếu nại · Thanh toán</p>
                </div>
                <span className="ml-auto px-2.5 py-1 rounded-full bg-blue-100 text-blue-600 text-xs font-bold">10 sheets Excel</span>
              </div>

              {/* KPI Row 1: Doanh thu */}
              <KpiGrid items={[
                { icon: faArrowTrendUp, label: "Tổng doanh thu", value: fmtVND(r?.revenue?.totalRevenue), color: "text-blue-600", bg: "bg-blue-50" },
                { icon: faShoppingBag, label: "Số đơn phát sinh", value: `${fmtNum(r?.revenue?.orderCount)} đơn`, color: "text-amber-600", bg: "bg-amber-50" },
                { icon: faCheckCircle, label: "Tỷ lệ hoàn tất", value: fmtPct(r?.lifecycle?.completionRate), color: "text-emerald-600", bg: "bg-emerald-50" },
                { icon: faTimesCircle, label: "Tỷ lệ quá hạn", value: fmtPct(r?.lifecycle?.overdueRate), color: "text-rose-600", bg: "bg-rose-50" },
              ]} />

              {/* KPI Row 2: Phí & Kho & KH */}
              <KpiGrid items={[
                { icon: faWarehouse, label: "Phí trễ hạn (lateFee)", value: fmtVND(r?.lifecycle?.totalLateFee), color: "text-orange-600", bg: "bg-orange-50", sub: "Thu trong kỳ" },
                { icon: faExclamationTriangle, label: "Phí hư hỏng (damageFee)", value: fmtVND(r?.lifecycle?.totalDamageFee), color: "text-red-600", bg: "bg-red-50", sub: "Thu trong kỳ" },
                { icon: faUsers, label: "Khách mới trong kỳ", value: `${fmtNum(r?.customers?.newCustomers)} người`, color: "text-purple-600", bg: "bg-purple-50" },
                { icon: faExclamationTriangle, label: "Tỷ lệ khiếu nại", value: fmtPct(r?.issues?.issueRate), color: "text-yellow-600", bg: "bg-yellow-50", sub: `${r?.issues?.total || 0} đơn` },
              ]} />

              <KpiGrid items={[
                { icon: faCreditCard, label: "VNPAY", value: fmtVND(r?.revenue?.revenueByPaymentMethod?.find(p => p.method === "VNPAY")?.total), color: "text-blue-500", bg: "bg-blue-50" },
                { icon: faCreditCard, label: "Tiền mặt (Cash)", value: fmtVND(r?.revenue?.revenueByPaymentMethod?.find(p => p.method === "Cash")?.total), color: "text-violet-600", bg: "bg-violet-50" },
              ]} />

              {/* Top costumes preview */}
              {r?.topCostumes?.topByRental?.length > 0 && (
                <div className="px-6 py-4 border-t border-[#f0f0f0]">
                  <p className="text-xs font-semibold text-[#999] uppercase tracking-wide mb-3">Top 5 trang phục thuê nhiều nhất</p>
                  <div className="flex flex-col gap-2">
                    {r.topCostumes.topByRental.slice(0, 5).map((c, i) => {
                      const max = r.topCostumes.topByRental[0].rentalCount;
                      return (
                        <div key={c.costumeId} className="flex items-center gap-3">
                          <span className="w-5 text-xs font-bold text-[#bbb] flex-shrink-0 text-right">#{i + 1}</span>
                          <span className="text-xs text-[#333] w-40 truncate flex-shrink-0">{c.name}</span>
                          <div className="flex-1 bg-[#f5f5f5] rounded-full h-2">
                            <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${Math.round(c.rentalCount / max * 100)}%` }} />
                          </div>
                          <span className="text-xs font-semibold text-[#1a1a1a] w-16 text-right flex-shrink-0">{c.rentalCount} lượt</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <ExportButtons
                onExcel={handleExportExcel} onPdf={handleExportPDF} onDoc={handleExportDOC}
                excelLoading={exporting.excel} noData={noData}
              />
            </div>

            {/* ── Card 2: Tồn kho chi tiết ── */}
            <div className="bg-white rounded-2xl border border-[#eaeaea] shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-[#f0f0f0] flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-sm">
                  <FontAwesomeIcon icon={faBoxes} />
                </div>
                <div>
                  <h2 className="font-bold text-[#1a1a1a] text-base">Báo cáo Tồn kho Chi tiết</h2>
                  <p className="text-xs text-[#777] mt-0.5">Từng sản phẩm, từng size — tổng kho, sẵn sàng, đang thuê, tỷ lệ khai thác</p>
                </div>
              </div>

              <KpiGrid items={[
                { icon: faWarehouse, label: "Tổng kho", value: `${fmtNum(r?.inventory?.summary?.grandTotal)} bộ`, color: "text-teal-600", bg: "bg-teal-50" },
                { icon: faCheckCircle, label: "Sẵn sàng cho thuê", value: `${fmtNum(r?.inventory?.summary?.grandAvailable)} bộ`, color: "text-emerald-600", bg: "bg-emerald-50" },
                { icon: faShoppingBag, label: "Đang thuê", value: `${fmtNum(r?.inventory?.summary?.grandRented)} bộ`, color: "text-orange-500", bg: "bg-orange-50" },
                { icon: faArrowTrendUp, label: "Tỷ lệ khai thác", value: r?.inventory?.summary?.grandTotal > 0 ? fmtPct((r.inventory.summary.grandRented / r.inventory.summary.grandTotal) * 100) : "0%", color: "text-blue-600", bg: "bg-blue-50" },
              ]} />

              {/* Hot/cold preview */}
              {(r?.inventory?.hotCostumes?.length > 0 || r?.inventory?.coldCostumes?.length > 0) && (
                <div className="px-6 py-4 border-t border-[#f0f0f0] grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs font-semibold text-emerald-600 mb-2">🔥 Cháy hàng Top 3</p>
                    {(r.inventory.hotCostumes || []).slice(0, 3).map(c => (
                      <div key={`${c.name}-${c.size}`} className="flex items-center justify-between py-1 border-b border-[#f5f5f5] last:border-0">
                        <span className="text-xs text-[#555] truncate max-w-[120px]">{c.name} ({c.size})</span>
                        <span className="text-xs font-bold text-emerald-600">{c.utilizationPct}%</span>
                      </div>
                    ))}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-rose-600 mb-2">🧊 Ế hàng Top 3</p>
                    {(r.inventory.coldCostumes || []).slice(0, 3).map(c => (
                      <div key={`${c.name}-${c.size}`} className="flex items-center justify-between py-1 border-b border-[#f5f5f5] last:border-0">
                        <span className="text-xs text-[#555] truncate max-w-[120px]">{c.name} ({c.size})</span>
                        <span className="text-xs font-bold text-rose-500">{c.utilizationPct}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="px-6 py-5 border-t border-[#f0f0f0] bg-[#faf9f7]">
                <p className="text-xs font-semibold text-[#999] uppercase tracking-wide mb-3 flex items-center gap-2">
                  <FontAwesomeIcon icon={faDownload} /> Xuất file
                </p>
                <button id="export-inventory-excel" type="button" onClick={handleExportInventoryExcel}
                  disabled={inventoryExporting}
                  className="group w-full flex items-center justify-center gap-3 py-4 px-6 rounded-xl border-2 border-emerald-200 bg-emerald-50 hover:bg-emerald-500 hover:border-emerald-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
                  <div className="w-9 h-9 rounded-lg bg-emerald-500 group-hover:bg-white text-white group-hover:text-emerald-600 flex items-center justify-center text-lg transition-colors flex-shrink-0">
                    <FontAwesomeIcon icon={inventoryExporting ? faSpinner : faFileExcel} className={inventoryExporting ? "animate-spin" : ""} />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-bold text-emerald-700 group-hover:text-white transition-colors">
                      {inventoryExporting ? "Đang tạo file Excel..." : "Xuất Excel — Tồn kho chi tiết từng size"}
                    </div>
                    <div className="text-xs text-emerald-500 group-hover:text-emerald-100 transition-colors">
                      .xlsx · 2 sheets: Tổng quan + Chi tiết từng sản phẩm/size với tỷ lệ khai thác
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {toast.isVisible && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, isVisible: false })} />
      )}
    </div>
  );
}