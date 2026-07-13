import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Toast from "../../components/ui/Toast";
import Pagination from "../../components/ui/Pagination";
import rentalService from "../../services/rental.service";
import { OrderTrackingModal } from "../customer/OrderTrackingModal";
import { useAuth } from "../../context/AuthContext"; // Import useAuth để phân quyền

const removeAccents = (str) => {
  return str ? str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D') : "";
};

export default function OrdersPage() {
  const { role } = useAuth(); // Lấy role (owner hoặc staff) từ Context
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Toolbar States
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // View Modal State
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isTrackingOpen, setIsTrackingOpen] = useState(false);

  const fetchOrders = async () => {
    try {
      const data = await rentalService.getAllOrders();
      const validOrders = Array.isArray(data) ? data : (data.rentals || data.data || []);
      setOrders(validOrders);
    } catch (error) {
      console.error("Lỗi fetch đơn hàng", error);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Đưa về trang 1 khi bất kỳ filter/search/sort nào thay đổi
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'delivering': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
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
      case 'delivering': return 'Đang giao';
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
      accessor: (row) => {
        if (row.status === 'pending' && role === 'staff') {
          return (
            <div className="inline-flex w-[110px] gap-1.5" onClick={(e) => e.stopPropagation()}>
              <button 
                className="flex-[2] py-1.5 border border-transparent bg-emerald-100 text-emerald-700 font-semibold rounded-md hover:bg-emerald-200 transition-colors text-[11px] whitespace-nowrap text-center"
                onClick={async (e) => {
                  e.stopPropagation();
                  try {
                    await rentalService.confirmPreparation(row._id);
                    setToast({ show: true, message: "Xác nhận thành công!", type: "success" });
                    fetchOrders();
                  } catch (error) {
                    setToast({ show: true, message: error.response?.data?.message || "Lỗi xác nhận", type: "error" });
                  }
                }}
              >
                Xác nhận
              </button>
              <button 
                className="flex-[1] py-1.5 border border-transparent bg-red-100 text-red-700 font-semibold rounded-md hover:bg-red-200 transition-colors text-[11px] whitespace-nowrap text-center"
                onClick={(e) => {
                  e.stopPropagation();
                  handleUpdateStatus(row._id, 'cancelled');
                }}
              >
                Hủy
              </button>
            </div>
          );
        }
        return (
          <span className={`px-2.5 py-1.5 border rounded-md text-[12px] font-semibold inline-block text-center min-w-[110px] ${getStatusColor(row.status)}`}>
            {getStatusLabel(row.status)}
          </span>
        );
      }
    }
  ];

  // Logic Xử lý Lọc, Tìm kiếm và Sắp xếp
  let processedOrders = orders.filter((order) => {
    const nameStr = removeAccents(order.shippingAddress?.receiverName || order.customerId?.fullName || "").toLowerCase();
    const searchStr = removeAccents(searchTerm).toLowerCase();
    const searchMatch = (order._id && order._id.toLowerCase().includes(searchTerm.toLowerCase())) || nameStr.includes(searchStr);
    const statusMatch = statusFilter === "all" || order.status === statusFilter;
    return searchMatch && statusMatch;
  });

  const totalPages = Math.ceil(processedOrders.length / itemsPerPage);
  const currentOrders = processedOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await rentalService.updateStatus(orderId, newStatus);
      setToast({ show: true, message: "Cập nhật trạng thái thành công!", type: "success" });
      fetchOrders();
      setSelectedOrder(prev => prev ? { ...prev, status: newStatus } : null);
    } catch (error) {
      setToast({ show: true, message: error.response?.data?.message || "Cập nhật thất bại", type: "error" });
    }
  };

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
          <option value="delivered">Đã giao hàng</option>
          <option value="renting">Đang thuê</option>
          <option value="returning">Đang trả hàng</option>
          <option value="completed">Hoàn tất</option>
          <option value="cancelled">Đã hủy</option>
          <option value="overdue">Quá hạn</option>
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

      {/* MODAL CHI TIẾT ĐƠN HÀNG */}
      {selectedOrder && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setSelectedOrder(null)} className="absolute top-4 right-4 text-gray-400 hover:text-black text-xl">✕</button>
            <h2 className="text-xl font-bold text-[#1a1a1a] mb-4 border-b pb-2">Chi tiết đơn #{selectedOrder._id?.slice(-6).toUpperCase()}</h2>

            <div className="mb-6">
              <h3 className="font-semibold mb-2">Sản phẩm thuê</h3>
              <ul className="bg-gray-50 p-4 rounded-lg space-y-3">
                {selectedOrder.items?.map((item, idx) => (
                  <li key={idx} className="flex justify-between items-center text-sm border-b border-gray-200 pb-3 last:border-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-12 rounded bg-gray-200 overflow-hidden flex-shrink-0 border border-gray-100">
                        <img 
                          src={item.costume?.images?.[0] || item.image || "https://placehold.co/40x48"} 
                          alt={item.costume?.name || item.costumeName} 
                          className="w-full h-full object-cover" 
                        />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium text-[#1a1a1a]">{item.costume?.name || item.costumeName}</span>
                        <span className="text-xs text-gray-500">Size: {item.size} <span className="mx-1">•</span> SL: {item.quantity}</span>
                      </div>
                    </div>
                    <span className="font-medium text-[#1a1a1a] shrink-0">{Math.round(item.rentalPricePerDay || 0).toLocaleString('vi-VN')} đ/ngày</span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex justify-between font-bold text-[#1a1a1a] px-4">
                <span>Tổng cộng:</span>
                <span>{selectedOrder.totalAmount?.toLocaleString('vi-VN')} đ</span>
              </div>
            </div>

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

            <div className="bg-gray-50 p-4 rounded-lg border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">Trạng thái hiện tại:</p>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(selectedOrder.status)}`}>
                  {getStatusLabel(selectedOrder.status)}
                </span>
              </div>
              
              {/* CHỈ STAFF MỚI THẤY CÁC NÚT THAO TÁC NÀY */}
              {role === 'staff' && (
                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                  {!['pending', 'cancelled'].includes(selectedOrder.status) && (
                    <button
                      className="flex-1 sm:flex-none px-4 py-2 bg-blue-100 text-blue-700 font-medium rounded hover:bg-blue-200 transition-colors text-sm"
                      onClick={() => setIsTrackingOpen(true)}
                    >
                      Theo dõi
                    </button>
                  )}
                  {selectedOrder.status === 'returning' && (
                    <button
                      className="flex-1 sm:flex-none px-4 py-2 bg-purple-100 text-purple-700 font-medium rounded hover:bg-purple-200 transition-colors text-sm"
                      onClick={() => navigate(`/staff/rentals/${selectedOrder._id}/inspect-return`, { state: { order: selectedOrder } })}
                    >
                      Kiểm tra đồ trả
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CHỈ STAFF MỚI THẤY MODAL THEO DÕI ĐƠN HÀNG */}
      {role === 'staff' && (
        <OrderTrackingModal
          open={isTrackingOpen}
          onOpenChange={setIsTrackingOpen}
          order={selectedOrder}
        />
      )}

      {toast.show && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />
      )}
    </div>
  );
}