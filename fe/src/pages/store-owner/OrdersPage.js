import { useState, useEffect } from "react";
import Toast from "../../components/ui/Toast";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:9999";

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [role, setRole] = useState("");
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  // NÂNG CẤP 1: State cho Bộ lọc & Phân trang
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // NÂNG CẤP 2: State cho Modal Chi tiết
  const [selectedOrder, setSelectedOrder] = useState(null);

  const fetchOrders = async () => {
    let currentToken =
      localStorage.getItem("token") || sessionStorage.getItem("token") ||
      localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");

    if (!currentToken) {
      const userStr = localStorage.getItem("user") || sessionStorage.getItem("user");
      if (userStr) {
        try {
          const userObj = JSON.parse(userStr);
          currentToken = userObj.token || userObj.accessToken;
        } catch (e) { }
      }
    }

    if (!currentToken) return;

    try {
      const payload = JSON.parse(atob(currentToken.split('.')[1]));
      setRole(payload.role);
    } catch (e) { }

    try {
      const res = await fetch(`${API_URL}/api/rentals`, {
        headers: { "Authorization": `Bearer ${currentToken}` }
      });

      if (res.ok) {
        const data = await res.json();
        let validOrders = [];
        if (Array.isArray(data)) validOrders = data;
        else if (data.orders && Array.isArray(data.orders)) validOrders = data.orders;
        else if (data.rentals && Array.isArray(data.rentals)) validOrders = data.rentals;
        else if (data.data && Array.isArray(data.data)) validOrders = data.data;

        setOrders(validOrders);
      }
    } catch (error) {
      console.error("Lỗi fetch:", error);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // XỬ LÝ LỌC VÀ TÌM KIẾM
  const filteredOrders = orders.filter((order) => {
    const idStr = (order._id || "").toLowerCase();
    const nameStr = (order.customerId?.fullName || "").toLowerCase();
    const searchLower = searchTerm.toLowerCase();
    
    const matchSearch = idStr.includes(searchLower) || nameStr.includes(searchLower);
    const matchStatus = filterStatus === "all" || order.status === filterStatus;
    
    return matchSearch && matchStatus;
  });

  // XỬ LÝ PHÂN TRANG
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const currentData = filteredOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const updateStatus = async (id, newStatus) => {
    const currentToken = localStorage.getItem("token");
    if (!id || !currentToken) return;

    try {
      const res = await fetch(`${API_URL}/api/rentals/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${currentToken}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        setToast({ show: true, message: "Cập nhật thành công!", type: "success" });
        // Cập nhật lại order đang chọn để UI đổi ngay
        setSelectedOrder({ ...selectedOrder, status: newStatus });
        fetchOrders();
      }
    } catch (error) {
      setToast({ show: true, message: "Lỗi kết nối", type: "error" });
    }
  };

  const getStatusDisplay = (status) => {
    switch (status) {
      case 'pending': return { text: 'Chờ xử lý', color: 'bg-yellow-100 text-yellow-800' };
      case 'confirmed': return { text: 'Đã xác nhận', color: 'bg-blue-100 text-blue-800' };
      case 'renting': return { text: 'Đang thuê', color: 'bg-indigo-100 text-indigo-800' };
      case 'returning': return { text: 'Chờ kiểm tra', color: 'bg-orange-100 text-orange-800' };
      case 'completed': return { text: 'Hoàn tất', color: 'bg-emerald-100 text-emerald-800' };
      case 'cancelled': return { text: 'Đã hủy', color: 'bg-gray-100 text-gray-600' };
      default: return { text: 'Không rõ', color: 'bg-gray-100 text-gray-600' };
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-[#eaeaea] p-6 relative">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold text-[#1a1a1a]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Quản lý Đơn Thuê</h1>
      </div>

      {/* BỘ LỌC */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <input 
          type="text" 
          placeholder="🔍 Tìm mã đơn, tên khách hàng..." 
          value={searchTerm}
          onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          className="px-4 py-2 border border-[#eaeaea] rounded-lg text-sm w-full md:w-1/3 outline-none focus:border-black"
        />
        <select 
          value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
          className="px-4 py-2 border border-[#eaeaea] rounded-lg text-sm w-full md:w-1/4 outline-none focus:border-black"
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="pending">Chờ xử lý</option>
          <option value="confirmed">Đã xác nhận</option>
          <option value="renting">Đang thuê</option>
          <option value="returning">Chờ kiểm tra</option>
          <option value="completed">Hoàn tất</option>
          <option value="cancelled">Đã hủy</option>
        </select>
      </div>

      {/* BẢNG DỮ LIỆU */}
      <div className="overflow-x-auto rounded-lg border border-[#eaeaea]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#f8f9fa] border-b border-[#eaeaea]">
              <th className="p-4 text-[13px] font-semibold text-[#555] whitespace-nowrap">Mã Đơn</th>
              <th className="p-4 text-[13px] font-semibold text-[#555] whitespace-nowrap">Khách hàng</th>
              <th className="p-4 text-[13px] font-semibold text-[#555]">Trang phục</th>
              <th className="p-4 text-[13px] font-semibold text-[#555] whitespace-nowrap">Ngày lấy</th>
              <th className="p-4 text-[13px] font-semibold text-[#555] whitespace-nowrap">Tổng tiền</th>
              <th className="p-4 text-[13px] font-semibold text-[#555] whitespace-nowrap text-center">Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {currentData.length === 0 ? (
              <tr><td colSpan="6" className="p-8 text-center text-gray-500">Không tìm thấy đơn hàng nào</td></tr>
            ) : (
              currentData.map((row) => {
                const statusStyle = getStatusDisplay(row.status);
                return (
                  <tr 
                    key={row._id} 
                    onClick={() => setSelectedOrder(row)}
                    className="border-b border-[#eaeaea] hover:bg-[#fafafa] transition-colors cursor-pointer"
                    title="Click để xem chi tiết"
                  >
                    <td className="p-4 text-sm font-medium text-[#1a1a1a]">{row._id?.slice(-6).toUpperCase()}</td>
                    <td className="p-4 text-sm text-[#555]">{row.customerId?.fullName || "Khách vãng lai"}</td>
                    <td className="p-4 text-sm text-[#555] truncate max-w-[200px]">
                      {row.items?.map(i => i.costume?.name).join(', ') || "N/A"}
                    </td>
                    <td className="p-4 text-sm text-[#555]">{row.startDate ? new Date(row.startDate).toLocaleDateString('vi-VN') : "N/A"}</td>
                    <td className="p-4 text-sm text-[#555] font-semibold">{row.totalAmount?.toLocaleString('vi-VN')} đ</td>
                    <td className="p-4 text-sm text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusStyle.color}`}>
                        {statusStyle.text}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* PHÂN TRANG */}
      {totalPages > 1 && (
        <div className="flex justify-end items-center mt-4 gap-2">
          <button 
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(p => p - 1)}
            className="px-3 py-1.5 border border-[#eaeaea] rounded text-sm disabled:opacity-50 hover:bg-gray-50"
          >
            Trước
          </button>
          <span className="text-sm font-medium text-[#555]">
            Trang {currentPage} / {totalPages}
          </span>
          <button 
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(p => p + 1)}
            className="px-3 py-1.5 border border-[#eaeaea] rounded text-sm disabled:opacity-50 hover:bg-gray-50"
          >
            Sau
          </button>
        </div>
      )}

      {/* MODAL CHI TIẾT ĐƠN HÀNG */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 relative animate-fade-in max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setSelectedOrder(null)} 
              className="absolute top-4 right-4 text-gray-400 hover:text-black text-xl"
            >
              ✕
            </button>
            
            <h2 className="text-xl font-bold text-[#1a1a1a] mb-4 border-b pb-2">
              Chi tiết đơn #{selectedOrder._id?.slice(-6).toUpperCase()}
            </h2>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-sm text-gray-500">Khách hàng</p>
                <p className="font-semibold">{selectedOrder.customerId?.fullName || "Khách vãng lai"}</p>
                <p className="text-sm">{selectedOrder.customerId?.phone}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Thời gian thuê</p>
                <p className="font-semibold">
                  {selectedOrder.startDate ? new Date(selectedOrder.startDate).toLocaleDateString('vi-VN') : "-"} 
                  {" -> "} 
                  {selectedOrder.endDate ? new Date(selectedOrder.endDate).toLocaleDateString('vi-VN') : "-"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Thanh toán</p>
                <p className="font-semibold">{selectedOrder.paymentMethod || "Chưa chọn"} - <span className="text-blue-600">{selectedOrder.paymentStatus}</span></p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Tổng thu</p>
                <p className="font-semibold text-lg text-red-600">{selectedOrder.totalAmount?.toLocaleString('vi-VN')} đ</p>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="font-semibold mb-2">Sản phẩm thuê</h3>
              <ul className="bg-gray-50 p-4 rounded-lg space-y-2">
                {selectedOrder.items?.map((item, idx) => (
                  <li key={idx} className="flex justify-between text-sm border-b border-gray-200 last:border-0 pb-2 last:pb-0">
                    <span>{item.costume?.name} (Size: {item.size}) x{item.quantity}</span>
                    <span className="font-medium">{item.rentalPricePerDay?.toLocaleString('vi-VN')} đ/ngày</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* KHU VỰC THAO TÁC (Chỉ hiện cho Staff) */}
            <div className="bg-gray-50 p-4 rounded-lg border flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Trạng thái hiện tại:</p>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusDisplay(selectedOrder.status).color}`}>
                  {getStatusDisplay(selectedOrder.status).text}
                </span>
              </div>
              
              {role !== "owner" ? (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500">Cập nhật:</span>
                  <select 
                    value={selectedOrder.status}
                    onChange={(e) => updateStatus(selectedOrder._id, e.target.value)}
                    disabled={selectedOrder.status === 'completed' || selectedOrder.status === 'cancelled'}
                    className="border px-3 py-2 rounded-md text-sm outline-none cursor-pointer disabled:opacity-50"
                  >
                    <option value="pending">Chờ xử lý (Thu tiền)</option>
                    <option value="confirmed">Đã xác nhận (Giao đồ)</option>
                    <option value="renting">Đang thuê</option>
                    <option value="returning">Khách trả (Chờ KT)</option>
                    <option value="completed">Hoàn tất</option>
                    <option value="cancelled">Hủy đơn</option>
                  </select>
                </div>
              ) : (
                <span className="text-sm text-gray-400 italic">Chỉ Staff mới có quyền chỉnh sửa</span>
              )}
            </div>

          </div>
        </div>
      )}

      {toast.show && <Toast message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />}
    </div>
  );
}