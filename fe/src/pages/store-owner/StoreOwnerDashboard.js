import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEllipsisV,
  faDownload,
  faShareAlt,
  faEdit,
  faCalendarAlt,
  faChartBar,
  faTable,
  faArrowUp,
  faArrowDown,
} from "@fortawesome/free-solid-svg-icons";
import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

export default function FrappeStyleDashboard() {
  const [loadingPage, setLoadingPage] = useState(true)
  const [toast, setToast] = useState({ isVisible: false, message: "", type: "success" });
  const [revenue, setRevenue] = useState();
  const [activeOrdersCount, setActiveOrdersCount] = useState();
  const [totalActiveCostumes, setTotalActiveCostumes] = useState();
  const [inventoryUtilizationPercentage, setInventoryUtilizationPercentage] = useState();
  const [totalStock, setTotalStock] = useState();
  const [currentlyRented, setCurrentlyRented] = useState();
  const {token} = useAuth()
const fetchDashboardData = async () => {                                                                                               
        try {                                                                                                                                
          setLoadingPage(true);                                                                                                              
          setToast({ isVisible: false, message: "", type: "success" });                                                                      
                                                                                                                                             
          const headers = {                                                                                                                  
            "Content-Type": "application/json",                                                                                              
            Authorization: `Bearer ${token}`,                                                                                                
          };                                                                                                                                 
                                                                                                                                             
          // 🚀 CHẠY SONG SONG TẤT CẢ API CÙNG LÚC BẰNG Promise.all                                                                          
          const [resRevenue, resActive, resInventory] = await Promise.all([                                                                  
            fetch(`http://localhost:9999/api/rentals/dashboard/revenue`, { headers }),                                                       
            fetch(`http://localhost:9999/api/rentals/dashboard/active-rentals`, { headers }),                                                
            fetch(`http://localhost:9999/api/rentals/dashboard/inventory-utilization`, { headers })                                          
          ]);                                                                                                                                
                                                                                                                                             
          // Kiểm tra nếu 1 trong các API bị lỗi                                                                                             
          if (!resRevenue.ok || !resActive.ok || !resInventory.ok) {                                                                         
            setToast({ isVisible: true, type: "error", message: "Failed to load dashboard data." });                                         
            return;                                                                                                                          
          }                                                                                                                                  
                                                                                                                                             
          // Parse JSON đồng loạt                                                                                                            
          const dataRevenue = await resRevenue.json();                                                                                       
          const dataActive = await resActive.json();                                                                                         
          const dataInventory = await resInventory.json();                                                                                   
                                                                                                                                             
          // Set State                                                                                                                       
          setRevenue(dataRevenue.totalRevenue);                                                                                              
                                                                                                                                             
          // Khai báo 2 biến state riêng cho Đơn và Đồ                                                                                       
          setActiveOrdersCount(dataActive.activeOrdersCount);                                                                                
          setTotalActiveCostumes(dataActive.totalActiveCostumes);                                                                            
                                                                                                                                             
          // Thêm state cho phần trăm khai thác kho                                                                                          
          setInventoryUtilizationPercentage(dataInventory.utilizationPercentage);                                                                      
          setTotalStock(dataInventory.totalStock);                                                                      
          setCurrentlyRented(dataInventory.currentlyRented);                                                                      
                                                                                                                                             
        } catch (error) {                                                                                                                    
          console.error(error);                                                                                                              
          setToast({ isVisible: true, type: "error", message: "Network error while loading data." });                                        
        } finally {                                                                                                                          
          setLoadingPage(false);                                                                                                             
        }                                                                                                                                    
      };                                                                                                                                     
                                                                                                                                             
      useEffect(() => {                                                                                                                      
          fetchDashboardData();                                                                                                              
      }, []); 
  return (
    <div className="bg-[#faf9f7] min-h-screen flex flex-col">
      
      {/* === 1. GLOBAL TOOLBAR === */}
      <div className="bg-white border-border border-[#eaeaea] px-6 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold text-[#1a1a1a]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Store Owner Dashboard</h1>
          <span className="text-xs bg-surface text-[#555] px-2 py-1 rounded">Public</span>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Date Range Picker Mock */}
          <button className="flex items-center gap-2 border border-[#eaeaea] rounded-md px-3 py-1.5 text-sm text-[#555] hover:bg-[#faf9f7]">
            <FontAwesomeIcon icon={faCalendarAlt} className="text-[#999] text-xs" />
            <span>Last 30 Days</span>
          </button>

          <div className="h-6 w-px bg-gray-200"></div>

          <button className="text-[#999] hover:text-[#555] p-1.5 rounded hover:bg-surface" title="Edit Dashboard">
            <FontAwesomeIcon icon={faEdit} className="text-sm" />
          </button>
          <button className="text-[#999] hover:text-[#555] p-1.5 rounded hover:bg-surface" title="Share">
            <FontAwesomeIcon icon={faShareAlt} className="text-sm" />
          </button>
          <button className="text-[#999] hover:text-[#555] p-1.5 rounded hover:bg-surface" title="Export PDF">
            <FontAwesomeIcon icon={faDownload} className="text-sm" />
          </button>
        </div>
      </div>

      {/* === 2. DASHBOARD CANVAS === */}
      <div className="flex-1 p-6 overflow-y-auto">
        
        <h2 className="text-sm font-semibold text-[#999] uppercase tracking-wider mb-4" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Revenue & Operations</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
          
          {/* --- WIDGET 1: KPI Number --- */}
          <div className="bg-white border border-[#eaeaea] rounded-lg shadow-sm p-4 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-[#555]">Total Revenue</h3>
              <button className="text-[#999] hover:text-[#555]"><FontAwesomeIcon icon={faEllipsisV} className="text-xs" /></button>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold text-[#1a1a1a]">{revenue}</span>
              <span className="text-sm font-medium text-green-600 mb-1 flex items-center gap-1">
              </span>
            </div>
            <div className="mt-3 border-t border-[#f0f0f0] pt-3 text-xs text-[#999] flex items-center gap-1">
              <FontAwesomeIcon icon={faChartBar} className="text-[#999]" /> Compared to previous period
            </div>
          </div>

          {/* --- WIDGET 2: Active Rentals with Chart.js --- */}
          <div className="bg-white border border-[#eaeaea] rounded-lg shadow-sm p-4 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-[#555]">Active Rentals</h3>
              <button className="text-[#999] hover:text-[#555]"><FontAwesomeIcon icon={faEllipsisV} className="text-xs" /></button>
            </div>
            
            <div className="flex-1 min-h-[100px] relative mt-2">
              <Bar 
                data={{
                  labels: ['Orders', 'Costumes'],
                  datasets: [{
                    data: [activeOrdersCount || 0, totalActiveCostumes || 0],
                    backgroundColor: ['#f59e0b', '#3b82f6'],
                    borderRadius: 4,
                    barThickness: 20,
                  }]
                }}
                options={{
                  indexAxis: 'y', // Biểu đồ cột ngang
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { display: false },
                    tooltip: { enabled: true }
                  },
                  scales: {
                    x: { display: false, beginAtZero: true },
                    y: { 
                      grid: { display: false, drawBorder: false },
                      ticks: { font: { size: 12 }, color: '#555' },
                      border: { display: false }
                    }
                  }
                }}
              />
            </div>
            <div className="mt-3 border-t border-[#f0f0f0] pt-3 text-xs text-[#999] flex items-center gap-1">
              <FontAwesomeIcon icon={faChartBar} className="text-[#999]" /> Currently out of store
            </div>
          </div>

          {/* --- WIDGET 3: Inventory Utilization --- */}
          <div className="bg-white border border-[#eaeaea] rounded-lg shadow-sm p-4 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-[#555]">Inventory Utilization</h3>
              <button className="text-[#999] hover:text-[#555]"><FontAwesomeIcon icon={faEllipsisV} className="text-xs" /></button>
            </div>
            
            <div className="flex-1 flex items-center justify-around relative mt-2 mb-2">
              {/* Biểu đồ tròn */}
              <div className="relative w-24 h-24">
                <Doughnut 
                  data={{
                    labels: ['Rented', 'Available'],
                    datasets: [{
                      data: [currentlyRented || 0, Math.max(0, (totalStock || 0) - (currentlyRented || 0))],
                      backgroundColor: ['#ef4444', '#f3f4f6'],
                      borderWidth: 0,
                      cutout: '75%',
                    }]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { display: false },
                      tooltip: { enabled: true }
                    }
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-bold text-[#1a1a1a]">{inventoryUtilizationPercentage || 0}%</span>
                </div>
              </div>

              {/* Con số bên cạnh */}
              <div className="flex flex-col justify-center gap-3">
                <div>
                  <p className="text-[10px] text-[#999] uppercase tracking-wide">Rented</p>
                  <p className="text-xl font-bold text-[#ef4444] leading-none">{currentlyRented || 0}</p>
                </div>
                <div>
                  <p className="text-[10px] text-[#999] uppercase tracking-wide">Total Stock</p>
                  <p className="text-xl font-bold text-[#1a1a1a] leading-none">{totalStock || 0}</p>
                </div>
              </div>
            </div>

            <div className="mt-3 border-t border-[#f0f0f0] pt-3 text-xs text-[#999] flex items-center gap-1 justify-center">
              <FontAwesomeIcon icon={faChartBar} className="text-[#999]" /> 
              <span>Of total costumes rented</span>
            </div>
          </div>

          {/* --- WIDGET 4: Bar Chart --- */}
          <div className="bg-white border border-[#eaeaea] rounded-lg shadow-sm p-4 md:col-span-2 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-[#555]">Monthly Revenue Trend</h3>
              <button className="text-[#999] hover:text-[#555]"><FontAwesomeIcon icon={faEllipsisV} className="text-xs" /></button>
            </div>
            <div className="flex-1 min-h-[180px] flex items-end justify-around gap-3 pt-2">
              {[40, 65, 50, 80, 60, 90, 75, 95, 80, 70, 85, 92].map((h, i) => (
                <div key={i} className="flex-1 bg-[#1a1a1a] hover:bg-[#333] rounded-sm transition-colors cursor-pointer" style={{ height: `${h}%` }}></div>
              ))}
            </div>
            <div className="flex justify-around mt-2 text-[10px] text-[#999]">
              <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span><span>Jul</span><span>Aug</span><span>Sep</span><span>Oct</span><span>Nov</span><span>Dec</span>
            </div>
          </div>

          {/* --- WIDGET 5: Donut/Pie Chart --- */}
          <div className="bg-white border border-[#eaeaea] rounded-lg shadow-sm p-4 flex flex-col items-center justify-center">
            <div className="flex items-center justify-between w-full mb-4">
              <h3 className="text-sm font-medium text-[#555]">Rentals by Category</h3>
              <button className="text-[#999] hover:text-[#555]"><FontAwesomeIcon icon={faEllipsisV} className="text-xs" /></button>
            </div>
            <div className="w-28 h-28 rounded-full border-[20px] border-[#1a1a1a] relative mb-4" style={{ borderColor: '#3b82f6 #3b82f6 #f59e0b #f59e0b' }}>
              <div className="absolute inset-0 bg-white rounded-full w-20 h-20 flex items-center justify-center text-xs font-bold text-[#555]">
                342
              </div>
            </div>
            <div className="flex gap-4 text-xs text-[#555]">
              <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#1a1a1a]"></span> Suits</div>
              <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500"></span> Dresses</div>
            </div>
          </div>

          {/* --- WIDGET 6: Data Table --- */}
          <div className="bg-white border border-[#eaeaea] rounded-lg shadow-sm p-4 lg:col-span-3">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-[#555] flex items-center gap-2">
                <FontAwesomeIcon icon={faTable} className="text-[#999]" /> Recent Rentals
              </h3>
              <button className="text-[#999] hover:text-[#555]"><FontAwesomeIcon icon={faEllipsisV} className="text-xs" /></button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-border border-[#eaeaea] text-[#999] font-normal">
                    <th className="pb-2 pr-4">Customer</th>
                    <th className="pb-2 pr-4">Item</th>
                    <th className="pb-2 pr-4">Date</th>
                    <th className="pb-2 pr-4 text-right">Amount</th>
                    <th className="pb-2">Status</th>
                  </tr>
                </thead>
                <tbody className="text-[#555]">
                  <tr className="border-border border-[#f0f0f0] hover:bg-[#faf9f7]">
                    <td className="py-3 pr-4 font-medium">Alex Smith</td>
                    <td className="py-3 pr-4">Wedding Dress</td>
                    <td className="py-3 pr-4">10/23/2023</td>
                    <td className="py-3 pr-4 text-right">$120</td>
                    <td className="py-3"><span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs">Active</span></td>
                  </tr>
                  <tr className="border-border border-[#f0f0f0] hover:bg-[#faf9f7]">
                    <td className="py-3 pr-4 font-medium">Emma Johnson</td>
                    <td className="py-3 pr-4">Men's Suit</td>
                    <td className="py-3 pr-4">10/22/2023</td>
                    <td className="py-3 pr-4 text-right">$50</td>
                    <td className="py-3"><span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded text-xs">Pending</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}