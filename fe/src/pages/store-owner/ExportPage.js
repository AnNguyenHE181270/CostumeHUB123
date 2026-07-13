import { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFilePdf,
  faFileWord,
  faFileExcel,
  faChartLine,
  faBoxes,
  faSpinner
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "../../context/AuthContext";
import Toast from "../../components/ui/Toast";
import costumeService from "../../services/costume.service";

const COSTUME_STATUS_LABEL = {
  available: "Còn hàng",
  rented: "Đang thuê",
  maintenance: "Bảo trì",
  dry_cleaning: "Đang giặt là",
  hidden: "Đang ẩn",
  out_of_stock: "Hết hàng",
};

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:9999";

export default function ExportPage() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ isVisible: false, message: "", type: "success" });
  const [inventoryExporting, setInventoryExporting] = useState(false);
  
  // Dữ liệu báo cáo
  const [reportData, setReportData] = useState({
    revenue: 0,
    activeOrdersCount: 0,
    totalActiveCostumes: 0,
    inventoryUtilizationPercentage: 0,
    totalStock: 0,
    currentlyRented: 0
  });

  useEffect(() => {
    const fetchReportData = async () => {
      try {
        setLoading(true);
        const headers = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        };

        const [resRevenue, resActive, resInventory] = await Promise.all([
          fetch(`${API_URL}/api/rentals/dashboard/revenue`, { headers }),
          fetch(`${API_URL}/api/rentals/dashboard/active-rentals`, { headers }),
          fetch(`${API_URL}/api/rentals/dashboard/inventory-utilization`, { headers })
        ]);

        if (resRevenue.ok && resActive.ok && resInventory.ok) {
          const dataRevenue = await resRevenue.json();
          const dataActive = await resActive.json();
          const dataInventory = await resInventory.json();

          setReportData({
            revenue: dataRevenue.totalRevenue || 0,
            activeOrdersCount: dataActive.activeOrdersCount || 0,
            totalActiveCostumes: dataActive.totalActiveCostumes || 0,
            inventoryUtilizationPercentage: dataInventory.utilizationPercentage || 0,
            totalStock: dataInventory.totalStock || 0,
            currentlyRented: dataInventory.currentlyRented || 0
          });
        } else {
          setToast({ isVisible: true, type: "error", message: "Không thể lấy dữ liệu báo cáo." });
        }
      } catch (error) {
        setToast({ isVisible: true, type: "error", message: "Lỗi kết nối máy chủ." });
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchReportData();
    }
  }, [token]);

  const generateReportHTML = (formattedRevenue, currentDate) => `
    <html>
      <head>
        <meta charset="utf-8">
        <title>Báo cáo doanh thu - CostumeHUB</title>
        <style>
          body { font-family: Arial, sans-serif; color: #1a1a1a; line-height: 1.6; padding: 40px; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #1a1a1a; padding-bottom: 15px; }
          .company-name { font-size: 14px; font-weight: bold; text-transform: uppercase; }
          .report-title { font-size: 22px; font-weight: bold; margin: 10px 0; }
          .report-date { font-size: 13px; color: #555; }
          .section-title { font-size: 14px; font-weight: bold; text-transform: uppercase; margin-top: 25px; margin-bottom: 10px; border-bottom: 1px dashed #ccc; padding-bottom: 5px; }
          .summary-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          .summary-table td { padding: 15px; background: #f9f9f9; border: 1px solid #eaeaea; text-align: center; width: 25%; }
          .summary-table strong { font-size: 16px; color: #000; display: block; margin-top: 4px; }
          table.data-table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 13px; }
          table.data-table th { background: #f5f5f5; font-weight: bold; border: 1px solid #eaeaea; padding: 8px; text-align: left; }
          table.data-table td { border: 1px solid #eaeaea; padding: 8px; }
          .signature-space { margin-top: 60px; width: 100%; }
          .signature-table { width: 100%; border: none; }
          .signature-table td { border: none; text-align: center; width: 50%; font-size: 13px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-name">Hệ thống quản lý trang phục CostumeHUB</div>
          <div class="report-title">BÁO CÁO HOẠT ĐỘNG KINH DOANH</div>
          <div class="report-date">Kỳ báo cáo: 30 ngày qua</div>
          <div style="font-size: 11px; color: #777; margin-top: 4px;">Ngày trích xuất dữ liệu: ${currentDate}</div>
        </div>

        <div class="section-title">1. Chỉ số tổng quan tài chính & vận hành</div>
        <table class="summary-table">
          <tr>
            <td>Tổng doanh thu kỳ này<br><strong>${formattedRevenue}</strong></td>
            <td>Số đơn phát sinh<br><strong>${reportData.activeOrdersCount} đơn</strong></td>
            <td>Trang phục đang thuê<br><strong>${reportData.currentlyRented} bộ</strong></td>
            <td>Hiệu suất khai thác kho<br><strong>${reportData.inventoryUtilizationPercentage}% (Tổng kho: ${reportData.totalStock})</strong></td>
          </tr>
        </table>

        <div class="section-title">2. Chi tiết cơ cấu danh mục trang phục</div>
        <table class="data-table">
          <thead>
            <tr>
              <th>Tên danh mục trang phục</th>
              <th>Số lượng lưu kho hiện tại</th>
              <th>Số lượt thuê phát sinh</th>
              <th>Đánh giá vận hành</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Đầm & Váy nữ (Dresses)</td>
              <td>342 bộ</td>
              <td>89 lượt</td>
              <td>Tăng trưởng mạnh</td>
            </tr>
            <tr>
              <td>Âu phục & Vest nam (Suits)</td>
              <td>85 bộ</td>
              <td>24 lượt</td>
              <td>Vận hành ổn định</td>
            </tr>
          </tbody>
        </table>

        <div class="signature-space">
          <table class="signature-table">
            <tr>
              <td>
                <div style="font-weight: bold; margin-bottom: 60px;">Người lập báo cáo</div>
                <div style="font-style: italic; color: #555;">(Ký và ghi rõ họ tên)</div>
              </td>
              <td>
                <div style="font-weight: bold; margin-bottom: 60px;">Chủ cửa hàng phê duyệt</div>
                <div style="font-style: italic; color: #555;">(Ký tên, đóng dấu)</div>
              </td>
            </tr>
          </table>
        </div>
      </body>
    </html>
  `;

  const handleExportPDF = () => {
    const formattedRevenue = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(reportData.revenue);
    const currentDate = new Date().toLocaleString("vi-VN");
    
    const printWindow = window.open("", "_blank");
    printWindow.document.write(generateReportHTML(formattedRevenue, currentDate));
    printWindow.document.close();
    
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 250);
  };

  const handleExportDOC = () => {
    const formattedRevenue = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(reportData.revenue);
    const currentDate = new Date().toLocaleString("vi-VN");
    
    const htmlContent = generateReportHTML(formattedRevenue, currentDate);
    const blob = new Blob(["\ufeff" + htmlContent], { type: "application/msword" });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Bao_cao_kinh_doanh_CostumeHUB_${new Date().toISOString().slice(0,10)}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportInventoryExcel = async () => {
    setInventoryExporting(true);
    try {
      const data = await costumeService.getAll({
        limit: 1000,
        status: "available,out_of_stock,maintenance,dry_cleaning,rented,hidden",
      });
      const products = data.costumes || [];

      const detailRows = [];
      let totalStock = 0;
      let totalAvailable = 0;
      let totalRented = 0;

      products.forEach((p) => {
        const variants = p.variants && p.variants.length > 0 ? p.variants : [{}];
        variants.forEach((v) => {
          const stock = v.totalStock || 0;
          const available = v.availableStock || 0;
          const rented = stock - available;
          totalStock += stock;
          totalAvailable += available;
          totalRented += rented > 0 ? rented : 0;

          detailRows.push({
            "Tên sản phẩm": p.name || "",
            "Danh mục": p.categoryId?.name || "",
            "Size": v.size || "—",
            "SKU": v.sku || "—",
            "Tổng kho": stock,
            "Sẵn sàng cho thuê": available,
            "Đang thuê": rented > 0 ? rented : 0,
            "Trạng thái": COSTUME_STATUS_LABEL[v.status || p.status] || v.status || p.status || "",
          });
        });
      });

      const currentDate = new Date().toLocaleString("vi-VN");

      const summarySheetData = [
        ["BÁO CÁO TỒN KHO CHI TIẾT - COSTUMEHUB"],
        [`Ngày trích xuất: ${currentDate}`],
        [],
        ["Tổng số sản phẩm", products.length],
        ["Tổng số lượng trong kho", totalStock],
        ["Sẵn sàng cho thuê", totalAvailable],
        ["Đang cho thuê", totalRented],
      ];
      const wsSummary = XLSX.utils.aoa_to_sheet(summarySheetData);
      wsSummary["!cols"] = [{ wch: 28 }, { wch: 18 }];

      const wsDetail = XLSX.utils.json_to_sheet(detailRows);
      wsDetail["!cols"] = [
        { wch: 30 }, { wch: 18 }, { wch: 8 }, { wch: 14 },
        { wch: 10 }, { wch: 16 }, { wch: 12 }, { wch: 14 },
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, wsSummary, "Tong quan");
      XLSX.utils.book_append_sheet(wb, wsDetail, "Chi tiet ton kho");

      XLSX.writeFile(wb, `Bao_cao_ton_kho_CostumeHUB_${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (error) {
      setToast({ isVisible: true, type: "error", message: "Không thể xuất báo cáo tồn kho." });
    } finally {
      setInventoryExporting(false);
    }
  };

  return (
    <div className="bg-[#faf9f7] min-h-screen">
      <div className="bg-white border-b border-[#eaeaea] px-6 py-4 sticky top-0 z-10">
        <h1 className="text-xl font-bold text-[#1a1a1a]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
          Trung tâm Xuất Báo cáo
        </h1>
        <p className="text-sm text-[#555] mt-1">Trích xuất và tải xuống các số liệu vận hành của hệ thống</p>
      </div>

      <div className="p-6 max-w-5xl mx-auto">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <FontAwesomeIcon icon={faSpinner} className="animate-spin text-2xl text-[#999]" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Card Báo cáo Hoạt động Kinh doanh */}
            <div className="bg-white rounded-xl border border-[#eaeaea] p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-xl">
                  <FontAwesomeIcon icon={faChartLine} />
                </div>
                <div>
                  <h2 className="font-bold text-[#1a1a1a]">Báo cáo Hoạt động Kinh doanh</h2>
                  <p className="text-xs text-[#555]">Tổng hợp doanh thu, lượng đơn và công suất kho.</p>
                </div>
              </div>
              
              <div className="bg-[#faf9f7] p-3 rounded-md mb-6 border border-[#eaeaea]">
                <p className="text-sm text-gray-700">Kỳ dữ liệu: <span className="font-semibold">30 ngày gần nhất</span></p>
                <p className="text-sm text-gray-700 mt-1">Doanh thu hiện tại: <span className="font-bold text-green-600">{new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(reportData.revenue)}</span></p>
              </div>

              <div className="flex gap-3">
                <button 
                  type="button"
                  onClick={handleExportPDF}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-red-50 text-red-600 rounded-md font-semibold text-sm hover:bg-red-100 transition-colors border border-red-100"
                >
                  <FontAwesomeIcon icon={faFilePdf} />
                  Xuất PDF
                </button>
                <button 
                  type="button"
                  onClick={handleExportDOC}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-50 text-blue-600 rounded-md font-semibold text-sm hover:bg-blue-100 transition-colors border border-blue-100"
                >
                  <FontAwesomeIcon icon={faFileWord} />
                  Xuất Word
                </button>
              </div>
            </div>

            {/* Card Báo cáo Tồn kho chi tiết */}
            <div className="bg-white rounded-xl border border-[#eaeaea] p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl">
                  <FontAwesomeIcon icon={faBoxes} />
                </div>
                <div>
                  <h2 className="font-bold text-[#1a1a1a]">Báo cáo Tồn kho chi tiết</h2>
                  <p className="text-xs text-[#555]">Danh sách từng sản phẩm, từng size: tổng kho, sẵn sàng, đang thuê.</p>
                </div>
              </div>

              <div className="bg-[#faf9f7] p-3 rounded-md mb-6 border border-[#eaeaea]">
                <p className="text-sm text-gray-700">Tổng số lượng trong kho: <span className="font-semibold">{reportData.totalStock} bộ</span></p>
                <p className="text-sm text-gray-700 mt-1">Đang cho thuê: <span className="font-bold text-orange-500">{reportData.currentlyRented} bộ</span></p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleExportInventoryExcel}
                  disabled={inventoryExporting}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-50 text-emerald-700 rounded-md font-semibold text-sm hover:bg-emerald-100 transition-colors border border-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FontAwesomeIcon icon={inventoryExporting ? faSpinner : faFileExcel} className={inventoryExporting ? "animate-spin" : ""} />
                  {inventoryExporting ? "Đang tạo file..." : "Xuất Excel (.xlsx)"}
                </button>
              </div>
            </div>

          </div>
        )}
      </div>

      {toast.isVisible && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, isVisible: false })} />
      )}
    </div>
  );
}