import { useState, useEffect } from "react";
import Toast from "../../components/ui/Toast";
import Pagination from "../../components/ui/Pagination";
import { useAuth } from "../../context/AuthContext";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:9999";

export default function OrdersPage() {
  const { token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Toolbar States
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortPrice, setSortPrice] = useState("default");

  // View Modal State
  const [selectedOrder, setSelectedOrder] = useState(null);

  const fetchOrders = async () => {
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/api/rentals`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const validOrders = Array.isArray(data) ? data : (data.rentals || data.data || []);
        setOrders(validOrders);
      } else {
        console.error("Không thể tải danh sách đơn hàng - HTTP Error");
      }
    } catch (error) {
      console.error("Lỗi fetch đơn hàng", error);
    }
  };

  useEffect(() => {
    if (token) {
      fetchOrders();
    }
  }, [token]);

  // Đưa về trang 1 khi bất kỳ filter/search/sort nào thay đổi
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, sortPrice]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'awaitingPayment': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'preparing': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'delivering': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'delivered': return 'bg-teal-50 text-teal-700 border-teal-200';
      case 'renting': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'returning': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'completed': return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'cancelled': return 'bg-[#faf9f7] text-[#999] border-[#eaeaea]';
      case 'overdue': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-white text-[#555] border-[#eaeaea]';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending': return 'Chờ xử lý';
      case 'awaitingPayment': return 'Chờ thanh toán';
      case 'preparing': return 'Đang chuẩn bị đồ';
      case 'delivering': return 'Đang giao';
      case 'delivered': return 'Đã giao hàng';
      case 'renting': return 'Đang thuê';
      case 'returning': return 'Đang trả hàng';
      case 'completed': return 'Hoàn tất';
      case 'cancelled': return 'Đã hủy';
      case 'overdue': return 'Quá hạn';
      default: return status;
    }
  };

  const columns = [
    { header: "Mã Đơn", accessor: (row) => <span className="font-medium text-[#555]">{row._id ? row._id.slice(-6).toUpperCase() : "N/A"}</span> },
    { header: "Khách hàng", accessor: (row) => row.shippingAddress?.receiverName || row.customerId?.fullName || "Khách vãng lai" },
    { header: "Trang phục", accessor: (row) => row.items && row.items.length > 0 ? row.items.map(i => i.costume?.name).join(', ') : "N/A" },
    { header: "Ngày lấy", accessor: (row) => row.startDate ? new Date(row.startDate).toLocaleDateString('vi-VN') : "N/A" },
    { header: "Ngày trả", accessor: (row) => row.endDate ? new Date(row.endDate).toLocaleDateString('vi-VN') : "N/A" },
    { header: "Tổng tiền", accessor: (row) => <span className="font-semibold text-[#555]">{row.totalAmount?.toLocaleString('vi-VN') || 0} đ</span> },
    { 
      header: "Trạng thái", 
      accessor: (row) => (
        <span className={`px-2.5 py-1.5 border rounded-md text-[12px] font-semibold inline-block text-center min-w-[110px] ${getStatusColor(row.status)}`}>
          {getStatusLabel(row.status)}
        </span>
      )
    }
  ];

  // Logic Xử lý Lọc, Tìm kiếm và Sắp xếp
  let processedOrders = orders.filter((order) => {
    const nameStr = (order.shippingAddress?.receiverName || order.customerId?.fullName || "").toLowerCase();
    const searchMatch = (order._id && order._id.toLowerCase().includes(searchTerm.toLowerCase())) || nameStr.includes(searchTerm.toLowerCase());
    const statusMatch = statusFilter === "all" || order.status === statusFilter;
    return searchMatch && statusMatch;
  });

  if (sortPrice === "asc") {
    processedOrders.sort((a, b) => (a.totalAmount || 0) - (b.totalAmount || 0));
  } else if (sortPrice === "desc") {
    processedOrders.sort((a, b) => (b.totalAmount || 0) - (a.totalAmount || 0));
  }

  const totalPages = Math.ceil(processedOrders.length / itemsPerPage);
  const currentOrders = processedOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-[#eaeaea] p-6 relative">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold text-[#1a1a1a]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Quản lý Đơn Thuê</h1>
      </div>

      {/* Toolbar: Filter & Search & Sort */}
      <div className="flex flex-col sm:flex-row flex-wrap gap-4 mb-6">
        <input
          type="text"
          placeholder="Tìm mã đơn, tên khách hàng..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="px-4 py-2 border border-[#eaeaea] rounded-lg text-sm outline-none focus:border-[#1a1a1a] transition-colors w-full sm:w-72"
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-[#eaeaea] rounded-lg text-sm outline-none focus:border-[#1a1a1a] transition-colors cursor-pointer w-full sm:w-48"
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="pending">Chờ xử lý</option>
          <option value="awaitingPayment">Chờ thanh toán</option>
          <option value="preparing">Đang chuẩn bị đồ</option>
          <option value="delivering">Đang giao</option>
          <option value="delivered">Đã giao hàng</option>
          <option value="renting">Đang thuê</option>
          <option value="returning">Đang trả hàng</option>
          <option value="completed">Hoàn tất</option>
          <option value="cancelled">Đã hủy</option>
          <option value="overdue">Quá hạn</option>
        </select>

        <select 
          value={sortPrice}
          onChange={(e) => setSortPrice(e.target.value)}
          className="px-4 py-2 border border-[#eaeaea] rounded-lg text-sm outline-none focus:border-[#1a1a1a] transition-colors cursor-pointer w-full sm:w-48"
        >
          <option value="default">Sắp xếp giá: Mặc định</option>
          <option value="asc">Giá: Thấp đến Cao</option>
          <option value="desc">Giá: Cao đến Thấp</option>
        </select>
      </div>

      {/* Table Data */}
      <div className="overflow-hidden rounded-lg border border-[#eaeaea]">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-[#faf9f7] border-b border-[#eaeaea] text-[#999] text-xs uppercase tracking-wider">
              {columns.map((col, idx) => (
                <th key={idx} className="p-4 font-semibold whitespace-nowrap">{col.header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {currentOrders.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="text-center py-8 text-gray-400 text-sm">Không có đơn hàng nào</td>
              </tr>
            ) : (
              currentOrders.map((row, idx) => (
                <tr 
                  key={row._id} 
                  onClick={() => setSelectedOrder(row)}
                  className="border-b border-[#eaeaea] hover:bg-[#faf9f7] transition-colors cursor-pointer"
                >
                  {columns.map((col, cIdx) => (
                    <td key={cIdx} className="p-4 text-sm text-[#555]">
                      {typeof col.accessor === 'function' ? col.accessor(row) : row[col.accessor]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>

        {processedOrders.length > 0 && (
          <div className="p-4 border-t border-[#eaeaea]">
            <Pagination
              displayCount={currentOrders.length}
              totalCount={processedOrders.length}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(page) => setCurrentPage(page)}
            />
          </div>
        )}
      </div>

      {/* MODAL CHI TIẾT ĐƠN HÀNG (View-only) */}
      {selectedOrder && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setSelectedOrder(null)} className="absolute top-4 right-4 text-gray-400 hover:text-black text-xl">✕</button>
            <h2 className="text-xl font-bold text-[#1a1a1a] mb-4 border-b pb-2">Chi tiết đơn #{selectedOrder._id?.slice(-6).toUpperCase()}</h2>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-sm text-gray-500">Khách hàng</p>
                <p className="font-semibold">{selectedOrder.shippingAddress?.receiverName || selectedOrder.customerId?.fullName || "Khách vãng lai"}</p>
                <p className="text-sm">{selectedOrder.shippingAddress?.receiverPhone || selectedOrder.customerId?.phone}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Thời gian thuê</p>
                <p className="font-semibold">{selectedOrder.startDate ? new Date(selectedOrder.startDate).toLocaleDateString('vi-VN') : "-"} {" -> "} {selectedOrder.endDate ? new Date(selectedOrder.endDate).toLocaleDateString('vi-VN') : "-"}</p>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="font-semibold mb-2">Sản phẩm thuê</h3>
              <ul className="bg-gray-50 p-4 rounded-lg space-y-2">
                {selectedOrder.items?.map((item, idx) => (
                  <li key={idx} className="flex justify-between text-sm border-b border-gray-200 pb-2">
                    <span>{item.costume?.name} (Size: {item.size}) x{item.quantity}</span>
                    <span className="font-medium">{Math.round(item.rentalPricePerDay || 0).toLocaleString('vi-VN')} đ/ngày</span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex justify-between font-bold text-[#1a1a1a] px-4">
                <span>Tổng cộng:</span>
                <span>{selectedOrder.totalAmount?.toLocaleString('vi-VN')} đ</span>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Trạng thái hiện tại:</p>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(selectedOrder.status)}`}>
                  {getStatusLabel(selectedOrder.status)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast.show && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />
      )}
    </div>
  );
}