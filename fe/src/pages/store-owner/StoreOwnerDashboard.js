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

export default function FrappeStyleDashboard() {
  return (
    <div className="bg-gray-50 min-h-screen flex flex-col">
      
      {/* === 1. GLOBAL TOOLBAR === */}
      <div className="bg-white border-border border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold text-gray-800">Store Owner Dashboard</h1>
          <span className="text-xs bg-surface text-gray-600 px-2 py-1 rounded">Public</span>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Date Range Picker Mock */}
          <button className="flex items-center gap-2 border border-gray-300 rounded-md px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50">
            <FontAwesomeIcon icon={faCalendarAlt} className="text-gray-400 text-xs" />
            <span>Last 30 Days</span>
          </button>

          <div className="h-6 w-px bg-gray-200"></div>

          <button className="text-gray-500 hover:text-gray-700 p-1.5 rounded hover:bg-surface" title="Edit Dashboard">
            <FontAwesomeIcon icon={faEdit} className="text-sm" />
          </button>
          <button className="text-gray-500 hover:text-gray-700 p-1.5 rounded hover:bg-surface" title="Share">
            <FontAwesomeIcon icon={faShareAlt} className="text-sm" />
          </button>
          <button className="text-gray-500 hover:text-gray-700 p-1.5 rounded hover:bg-surface" title="Export PDF">
            <FontAwesomeIcon icon={faDownload} className="text-sm" />
          </button>
        </div>
      </div>

      {/* === 2. DASHBOARD CANVAS === */}
      <div className="flex-1 p-6 overflow-y-auto">
        
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Revenue & Operations</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
          
          {/* --- WIDGET 1: KPI Number --- */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-600">Total Revenue</h3>
              <button className="text-gray-400 hover:text-gray-600"><FontAwesomeIcon icon={faEllipsisV} className="text-xs" /></button>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold text-gray-900">$45,230</span>
              <span className="text-sm font-medium text-green-600 mb-1 flex items-center gap-1">
                <FontAwesomeIcon icon={faArrowUp} className="text-[10px]" /> 12%
              </span>
            </div>
            <div className="mt-3 border-t border-gray-100 pt-3 text-xs text-gray-500 flex items-center gap-1">
              <FontAwesomeIcon icon={faChartBar} className="text-gray-400" /> Compared to previous period
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-600">Total Orders</h3>
              <button className="text-gray-400 hover:text-gray-600"><FontAwesomeIcon icon={faEllipsisV} className="text-xs" /></button>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold text-gray-900">187</span>
              <span className="text-sm font-medium text-green-600 mb-1 flex items-center gap-1">
                <FontAwesomeIcon icon={faArrowUp} className="text-[10px]" /> 5%
              </span>
            </div>
            <div className="mt-3 border-t border-gray-100 pt-3 text-xs text-gray-500 flex items-center gap-1">
              <FontAwesomeIcon icon={faChartBar} className="text-gray-400" /> Rental orders only
            </div>
          </div>

          {/* --- WIDGET 3: KPI Number --- */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-600">Active Customers</h3>
              <button className="text-gray-400 hover:text-gray-600"><FontAwesomeIcon icon={faEllipsisV} className="text-xs" /></button>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold text-gray-900">1,245</span>
              <span className="text-sm font-medium text-red-500 mb-1 flex items-center gap-1">
                <FontAwesomeIcon icon={faArrowDown} className="text-[10px]" /> 2%
              </span>
            </div>
            <div className="mt-3 border-t border-gray-100 pt-3 text-xs text-gray-500 flex items-center gap-1">
              <FontAwesomeIcon icon={faChartBar} className="text-gray-400" /> Registered this month
            </div>
          </div>

          {/* --- WIDGET 4: Bar Chart --- */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 md:col-span-2 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-600">Monthly Revenue Trend</h3>
              <button className="text-gray-400 hover:text-gray-600"><FontAwesomeIcon icon={faEllipsisV} className="text-xs" /></button>
            </div>
            <div className="flex-1 min-h-[180px] flex items-end justify-around gap-3 pt-2">
              {[40, 65, 50, 80, 60, 90, 75, 95, 80, 70, 85, 92].map((h, i) => (
                <div key={i} className="flex-1 bg-blue-500 hover:bg-blue-600 rounded-sm transition-colors cursor-pointer" style={{ height: `${h}%` }}></div>
              ))}
            </div>
            <div className="flex justify-around mt-2 text-[10px] text-gray-400">
              <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span><span>Jul</span><span>Aug</span><span>Sep</span><span>Oct</span><span>Nov</span><span>Dec</span>
            </div>
          </div>

          {/* --- WIDGET 5: Donut/Pie Chart --- */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 flex flex-col items-center justify-center">
            <div className="flex items-center justify-between w-full mb-4">
              <h3 className="text-sm font-medium text-gray-600">Rentals by Category</h3>
              <button className="text-gray-400 hover:text-gray-600"><FontAwesomeIcon icon={faEllipsisV} className="text-xs" /></button>
            </div>
            <div className="w-28 h-28 rounded-full border-[20px] border-borderlue-500 relative mb-4" style={{ borderColor: '#3b82f6 #3b82f6 #f59e0b #f59e0b' }}>
              <div className="absolute inset-0 bg-white rounded-full w-20 h-20 flex items-center justify-center text-xs font-bold text-gray-700">
                342
              </div>
            </div>
            <div className="flex gap-4 text-xs text-gray-600">
              <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span> Suits</div>
              <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500"></span> Dresses</div>
            </div>
          </div>

          {/* --- WIDGET 6: Data Table --- */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 lg:col-span-3">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <FontAwesomeIcon icon={faTable} className="text-gray-400" /> Recent Rentals
              </h3>
              <button className="text-gray-400 hover:text-gray-600"><FontAwesomeIcon icon={faEllipsisV} className="text-xs" /></button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-border border-gray-200 text-gray-500 font-normal">
                    <th className="pb-2 pr-4">Customer</th>
                    <th className="pb-2 pr-4">Item</th>
                    <th className="pb-2 pr-4">Date</th>
                    <th className="pb-2 pr-4 text-right">Amount</th>
                    <th className="pb-2">Status</th>
                  </tr>
                </thead>
                <tbody className="text-gray-700">
                  <tr className="border-border border-gray-100 hover:bg-gray-50">
                    <td className="py-3 pr-4 font-medium">Alex Smith</td>
                    <td className="py-3 pr-4">Wedding Dress</td>
                    <td className="py-3 pr-4">10/23/2023</td>
                    <td className="py-3 pr-4 text-right">$120</td>
                    <td className="py-3"><span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs">Active</span></td>
                  </tr>
                  <tr className="border-border border-gray-100 hover:bg-gray-50">
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