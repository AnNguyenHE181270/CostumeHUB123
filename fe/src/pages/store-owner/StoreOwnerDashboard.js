import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEllipsisV,
  faDownload,
  faCalendarAlt,
  faChartBar,
  faTable,
  faFilePdf,
  faFileWord
} from "@fortawesome/free-solid-svg-icons";
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

export default function FrappeStyleDashboard() {
  const [loadingPage, setLoadingPage] = useState(true);
  const [toast, setToast] = useState({ isVisible: false, message: "", type: "success" });
  
  const [revenue, setRevenue] = useState(0);
  const [activeOrdersCount, setActiveOrdersCount] = useState(0);
  const [totalActiveCostumes, setTotalActiveCostumes] = useState(0);
  const [inventoryUtilizationPercentage, setInventoryUtilizationPercentage] = useState(0);
  const [totalStock, setTotalStock] = useState(0);
  const [currentlyRented, setCurrentlyRented] = useState(0);
  const [categoryData, setCategoryData] = useState([]); 
  const [recentOrders, setRecentOrders] = useState([]); 
  
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
    }                                                                                                                                                                                                                                                                   
  }, [token, getDateParams]);                                                                                                                                                                                                                                                            
                                                                                                                                                                                                                                                                        
  useEffect(() => {                                                                                                                                                                                                                                                         
      fetchDashboardData();                                                                                                                                                                                                                                             
  }, [fetchDashboardData, dateRange]); 

  const generateReportHTML = (formattedRevenue, currentDate) => `
    <html>
      <head>
        <meta charset="utf-8">
        <title>Báo cáo doanh thu - CostumeHUB</title>
        <style>
          body { font-family: Arial, sans-serif; color: #1a1a1a; line-height: 1.6; padding: 30px; }
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
          .signature-space { margin-top: 50px; width: 100%; }
          .signature-table { width: 100%; border: none; }
          .signature-table td { border: none; text-align: center; width: 50%; font-size: 13px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-name">Hệ thống quản lý trang phục CostumeHUB</div>
          <div class="report-title">BÁO CÁO HOẠT ĐỘNG KINH DOANH</div>
          <div class="report-date">Kỳ báo cáo: ${dateRange}</div>
          <div style="font-size: 11px; color: #777; margin-top: 4px;">Ngày trích xuất dữ liệu: ${currentDate}</div>
        </div>

        <div class="section-title">1. Chỉ số tổng quan tài chính & vận hành</div>
        <table class="summary-table">
          <tr>
            <td>Tổng doanh thu kỳ này<br><strong>${formattedRevenue}</strong></td>
            <td>Số đơn phát sinh<br><strong>${activeOrdersCount} đơn</strong></td>
            <td>Trang phục đang thuê<br><strong>${currentlyRented} bộ</strong></td>
            <td>Hiệu suất khai thác kho<br><strong>${inventoryUtilizationPercentage}% (Tổng kho: ${totalStock})</strong></td>
          </tr>
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
    setShowExportMenu(false);
    const formattedRevenue = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(revenue || 0);
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
    setShowExportMenu(false);
    const formattedRevenue = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(revenue || 0);
    const currentDate = new Date().toLocaleString("vi-VN");
    
    const htmlContent = generateReportHTML(formattedRevenue, currentDate);
    const blob = new Blob(["\ufeff" + htmlContent], { type: "application/msword" });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Bao_cao_${dateRange.replace(/ /g, "_").replace(/\//g, "-")}_CostumeHUB.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleApplyCustomDate = () => {
    if (customStartDate && customEndDate) {
      const startStr = new Date(customStartDate).toLocaleDateString("vi-VN");
      const endStr = new Date(customEndDate).toLocaleDateString("vi-VN");
      setDateRange(`Từ ${startStr} đến ${endStr}`);
      setShowDateMenu(false);
    }
  };

  if (loadingPage) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#eaeaea] border-t-[#1a1a1a]"></div>
      </div>
    );
  }

  const totalCategoryCount = categoryData.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="bg-[#faf9f7] min-h-screen flex flex-col">
      
      {/* === 1. GLOBAL TOOLBAR === */}
      <div className="bg-white border-b border-[#eaeaea] px-6 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold text-[#1a1a1a]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Báo Cáo Hoạt Động & Doanh Thu</h1>
          <span className="text-xs bg-surface text-[#555] px-2 py-1 rounded">Chủ cửa hàng</span>
        </div>
        
        <div className="flex items-center gap-3">
          
          <div className="relative">
            <button 
              type="button"
              onClick={(e) => {
                e.preventDefault();
                setShowDateMenu(!showDateMenu);
                setShowExportMenu(false);
              }}
              className="flex items-center gap-2 border border-[#eaeaea] rounded-md px-3 py-1.5 text-sm text-[#555] hover:bg-[#faf9f7] transition-colors"
            >
              <FontAwesomeIcon icon={faCalendarAlt} className="text-[#999] text-xs" />
              <span className="font-medium text-[#1a1a1a]">{dateRange}</span>
            </button>
            
            {showDateMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white border border-[#eaeaea] rounded-lg shadow-xl py-2 z-50 animate-fade-in">
                <div className="mb-2">
                  {/* FIX: Thêm "Tất cả thời gian" vào menu thả xuống */}
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
              className="text-[#1a1a1a] hover:text-blue-600 p-1.5 rounded hover:bg-blue-50 transition-colors" 
              title="Xuất báo cáo văn bản pháp lý"
            >
              <FontAwesomeIcon icon={faDownload} className="text-sm" />
            </button>
            
            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-[#eaeaea] rounded-lg shadow-xl py-1 z-50 animate-fade-in">
                <button 
                  type="button"
                  onClick={(e) => { e.preventDefault(); handleExportPDF(); }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 font-medium"
                >
                  <FontAwesomeIcon icon={faFilePdf} className="text-red-500" />
                  Xuất văn bản PDF (.pdf)
                </button>
                <button 
                  type="button"
                  onClick={(e) => { e.preventDefault(); handleExportDOC(); }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 font-medium"
                >
                  <FontAwesomeIcon icon={faFileWord} className="text-blue-500" />
                  Xuất văn bản Word (.doc)
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
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-[#555]">Hiệu suất khai thác kho</h3>
              <button type="button" className="text-[#999] hover:text-[#555]"><FontAwesomeIcon icon={faEllipsisV} className="text-xs" /></button>
            </div>
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
            <div className="flex-1 min-h-[180px] flex items-end justify-around gap-3 pt-2">
              {[40, 65, 50, 80, 60, 90, 75, 95, 80, 70, 85, 92].map((h, i) => (
                <div key={i} className="flex-1 bg-[#1a1a1a] hover:bg-[#333] rounded-sm transition-colors cursor-pointer" style={{ height: `${h}%` }}></div>
              ))}
            </div>
            <div className="flex justify-around mt-2 text-[10px] text-[#999]">
              <span>Th1</span><span>Th2</span><span>Th3</span><span>Th4</span><span>Th5</span><span>Th6</span><span>Th7</span><span>Th8</span><span>Th9</span><span>Th10</span><span>Th11</span><span>Th12</span>
            </div>
          </div>

          {/* --- WIDGET 5: Biểu đồ tỷ lệ danh mục thực tế --- */}
          <div className="bg-white border border-[#eaeaea] rounded-lg shadow-sm p-4 flex flex-col items-center justify-center">
            <div className="flex items-center justify-between w-full mb-4">
              <h3 className="text-sm font-medium text-[#555]">Cơ cấu trang phục cho thuê</h3>
              <button type="button" className="text-[#999] hover:text-[#555]"><FontAwesomeIcon icon={faEllipsisV} className="text-xs" /></button>
            </div>
            <div className="w-28 h-28 rounded-full border-[20px] border-[#1a1a1a] relative mb-4" style={{ borderColor: '#3b82f6 #3b82f6 #f59e0b #f59e0b' }}>
              <div className="absolute inset-0 bg-white rounded-full w-20 h-20 flex items-center justify-center text-xs font-bold text-[#555]">{totalCategoryCount}</div>
            </div>
            <div className="flex gap-4 text-xs text-[#555]">
              <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#3b82f6]"></span> Đồ nam</div>
              <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500"></span> Đồ nữ</div>
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