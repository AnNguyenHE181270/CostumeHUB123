import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Toast from "../../components/ui/Toast";
import Pagination from "../../components/ui/Pagination";
import DataTable from "../../components/ui/DataTable";
import SearchInput from "../../components/ui/SearchInput";
import rentalService from "../../services/rental.service";
import { OrderTrackingModal } from "../customer/OrderTrackingModal";
import { useAuth } from "../../context/AuthContext"; // Import useAuth để phân quyền
import costumeService from "../../services/costume.service";

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

  const [loading, setLoading] = useState(true);

  // View Modal State
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isTrackingOpen, setIsTrackingOpen] = useState(false);

  // Offline Order States
  const [costumesList, setCostumesList] = useState([]);
  const [offlineModalOpen, setOfflineModalOpen] = useState(false);
  const [offlineData, setOfflineData] = useState({
    startDate: "",
    endDate: "",
    customerName: "",
    customerPhone: "",
    customerAddress: "",
    items: [{ costume: "", size: "", quantity: 1, availableSizes: [] }]
  });

  // Fetch costumes list
  useEffect(() => {
    if (offlineModalOpen) {
      const loadCostumes = async () => {
        try {
          const res = await costumeService.getAll({ limit: 1000, status: "available" });
          const list = res.costumes || res.data || [];
          setCostumesList(list);
        } catch (e) {
          console.error("Lỗi tải danh sách trang phục", e);
        }
      };
      loadCostumes();
    }
  }, [offlineModalOpen]);

  const handleCostumeChange = (index, costumeId) => {
    const selected = costumesList.find(c => c._id === costumeId);
    const newItems = [...offlineData.items];
    newItems[index].costume = costumeId;
    newItems[index].size = "";
    newItems[index].availableSizes = selected ? selected.variants?.map(v => v.size) || [] : [];
    setOfflineData({ ...offlineData, items: newItems });
  };

  const handleSizeChange = (index, size) => {
    const newItems = [...offlineData.items];
    newItems[index].size = size;
    setOfflineData({ ...offlineData, items: newItems });
  };

  const handleQuantityChange = (index, qty) => {
    const newItems = [...offlineData.items];
    newItems[index].quantity = Math.max(1, parseInt(qty) || 1);
    setOfflineData({ ...offlineData, items: newItems });
  };

  const handleAddItem = () => {
    setOfflineData({
      ...offlineData,
      items: [...offlineData.items, { costume: "", size: "", quantity: 1, availableSizes: [] }]
    });
  };

  const handleRemoveItem = (index) => {
    const newItems = offlineData.items.filter((_, idx) => idx !== index);
    setOfflineData({ ...offlineData, items: newItems });
  };

  const handleSubmitOfflineOrder = async (e) => {
    e.preventDefault();
    if (!offlineData.startDate || !offlineData.endDate || !offlineData.customerName || !offlineData.customerPhone) {
      setToast({ show: true, message: "Vui lòng điền đầy đủ thông tin bắt buộc!", type: "error" });
      return;
    }
    if (offlineData.items.some(item => !item.costume || !item.size || item.quantity <= 0)) {
      setToast({ show: true, message: "Vui lòng chọn trang phục và size hợp lệ!", type: "error" });
      return;
    }

    try {
      setLoading(true);
      await rentalService.createOfflineOrder({
        startDate: offlineData.startDate,
        endDate: offlineData.endDate,
        customerName: offlineData.customerName,
        customerPhone: offlineData.customerPhone,
        customerAddress: offlineData.customerAddress,
        items: offlineData.items.map(item => ({
          costume: item.costume,
          size: item.size,
          quantity: item.quantity
        }))
      });
      setToast({ show: true, message: "Tạo đơn hàng offline thành công!", type: "success" });
      setOfflineModalOpen(false);
      setOfflineData({
        startDate: "",
        endDate: "",
        customerName: "",
        customerPhone: "",
        customerAddress: "",
        items: [{ costume: "", size: "", quantity: 1, availableSizes: [] }]
      });
      fetchOrders();
    } catch (error) {
      setToast({ show: true, message: error.response?.data?.message || "Tạo đơn hàng offline thất bại", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await rentalService.getAllOrders();
      const validOrders = Array.isArray(data) ? data : (data.rentals || data.data || []);
      setOrders(validOrders);
    } catch (error) {
      console.error("Lỗi fetch đơn hàng", error);
    } finally {
      setLoading(false);
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



  // Logic Xử lý Lọc, Tìm kiếm và Sắp xếp
  let processedOrders = orders.filter((order) => {
    const nameStr = removeAccents(order.shippingAddress?.receiverName || order.customerId?.fullName || "").toLowerCase();
    const searchStr = removeAccents(searchTerm).toLowerCase();
    
    const idMatch = order._id && order._id.toLowerCase().includes(searchTerm.toLowerCase());
    const customerMatch = nameStr.includes(searchStr);
    const costumeMatch = order.items && order.items.some((item) => {
      const costumeName = removeAccents(item.costume?.name || item.costumeName || "").toLowerCase();
      return costumeName.includes(searchStr);
    });

    const searchMatch = idMatch || customerMatch || costumeMatch;
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
    <div className="space-y-6">
      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-col sm:flex-row flex-wrap gap-4 items-center w-full sm:w-auto">
          <SearchInput
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm mã đơn, tên khách hàng..."
            wrapperClassName="w-full md:w-80"
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 border border-[#eaeaea] rounded-xl outline-none focus:ring-2 focus:ring-[#1a1a1a] text-sm bg-white text-[#555] w-full sm:w-48 cursor-pointer"
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

        <button
          type="button"
          onClick={() => setOfflineModalOpen(true)}
          className="px-4 py-2.5 bg-[#1a1a1a] hover:bg-[#333] text-white text-sm font-semibold rounded-xl transition-colors shadow-sm w-full sm:w-auto text-center"
        >
          Thuê Offline tại cửa hàng
        </button>
      </div>

      {/* Table Data styled exactly like AccountsPage */}
      <DataTable
        isLoading={loading}
        isEmpty={!loading && processedOrders.length === 0}
        emptyMessage="Không tìm thấy đơn hàng nào phù hợp."
        footer={
          processedOrders.length > 0 && (
            <Pagination
              displayCount={currentOrders.length}
              totalCount={processedOrders.length}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(page) => setCurrentPage(page)}
            />
          )
        }
      >
        <thead>
          <tr className="border-border border-[#f0f0f0] bg-gray-50/50">
            <th className="py-4 px-6 text-xs font-semibold text-[#999] uppercase tracking-wider text-left">Mã Đơn</th>
            <th className="py-4 px-6 text-xs font-semibold text-[#999] uppercase tracking-wider text-left">Khách hàng</th>
            <th className="py-4 px-6 text-xs font-semibold text-[#999] uppercase tracking-wider text-left">Trang phục</th>
            <th className="py-4 px-6 text-xs font-semibold text-[#999] uppercase tracking-wider text-left">Ngày lấy</th>
            <th className="py-4 px-6 text-xs font-semibold text-[#999] uppercase tracking-wider text-left">Ngày trả</th>
            <th className="py-4 px-6 text-xs font-semibold text-[#999] uppercase tracking-wider text-left">Tổng tiền</th>
            <th className="py-4 px-6 text-xs font-semibold text-[#999] uppercase tracking-wider text-left">Trạng thái</th>
          </tr>
        </thead>
        <tbody>
          {currentOrders.map((row) => (
            <tr
              key={row._id}
              onClick={() => setSelectedOrder(row)}
              className="border-b border-[#eaeaea] hover:bg-[#faf9f7] transition-colors cursor-pointer"
            >
              <td className="py-4 px-6 text-sm text-[#1a1a1a] text-left">
                <span className="font-medium text-[#555]">{row._id ? row._id.slice(-6).toUpperCase() : "N/A"}</span>
              </td>
              <td className="py-4 px-6 text-sm text-[#1a1a1a] text-left">
                {row.shippingAddress?.receiverName || row.customerId?.fullName || "Khách vãng lai"}
              </td>
              <td className="py-4 px-6 text-sm text-[#555] text-left max-w-xs truncate">
                {row.items && row.items.length > 0 ? row.items.map(i => i.costume?.name).join(', ') : "N/A"}
              </td>
              <td className="py-4 px-6 text-sm text-[#555] text-left">
                {row.startDate ? new Date(row.startDate).toLocaleDateString('vi-VN') : "N/A"}
              </td>
              <td className="py-4 px-6 text-sm text-[#555] text-left">
                {row.endDate ? new Date(row.endDate).toLocaleDateString('vi-VN') : "N/A"}
              </td>
              <td className="py-4 px-6 text-sm text-[#555] text-left">
                <span className="font-semibold text-[#1a1a1a]">{row.totalAmount?.toLocaleString('vi-VN') || 0} đ</span>
              </td>
              <td className="py-4 px-6 text-left" onClick={(e) => e.stopPropagation()}>
                {row.status === 'pending' && role === 'staff' ? (
                  <div className="inline-flex gap-1.5">
                    <button
                      className="py-1.5 px-3 border border-transparent bg-emerald-100 text-emerald-700 font-semibold rounded-lg hover:bg-emerald-200 transition-colors text-[11px] whitespace-nowrap text-center shadow-sm"
                      onClick={async () => {
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
                      className="py-1.5 px-3 border border-transparent bg-red-100 text-red-700 font-semibold rounded-lg hover:bg-red-200 transition-colors text-[11px] whitespace-nowrap text-center shadow-sm"
                      onClick={() => handleUpdateStatus(row._id, 'cancelled')}
                    >
                      Hủy
                    </button>
                  </div>
                ) : (
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusColor(row.status)}`}>
                    {getStatusLabel(row.status)}
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </DataTable>

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

            <div className="grid grid-cols-2 gap-4 mb-6 border-t border-gray-100 pt-4">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Khách hàng</p>
                <p className="font-semibold text-gray-800 mt-1">{selectedOrder.shippingAddress?.receiverName || selectedOrder.customerId?.fullName || "Khách vãng lai"}</p>
                <p className="text-sm text-gray-500 mt-0.5">{selectedOrder.shippingAddress?.receiverPhone || selectedOrder.customerId?.phone}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Thời gian thuê</p>
                <p className="font-semibold text-gray-800 mt-1">
                  {selectedOrder.startDate ? new Date(selectedOrder.startDate).toLocaleDateString('vi-VN') : "-"}
                  {" → "}
                  {selectedOrder.endDate ? new Date(selectedOrder.endDate).toLocaleDateString('vi-VN') : "-"}
                </p>
              </div>
              {selectedOrder.shippingAddress && (
                <div className="col-span-2 bg-gray-50 p-3 rounded-lg border border-gray-100 mt-1">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Địa chỉ nhận hàng</p>
                  <p className="text-sm font-medium text-gray-700 mt-1 leading-relaxed">
                    {[
                      selectedOrder.shippingAddress.addressDetail,
                      selectedOrder.shippingAddress.ward,
                      selectedOrder.shippingAddress.district,
                      selectedOrder.shippingAddress.province
                    ].filter(Boolean).join(', ') || "Chưa cập nhật địa chỉ"}
                  </p>
                </div>
              )}
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

      {/* MODAL THUÊ OFFLINE TẠI CỬA HÀNG */}
      {offlineModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4 overflow-y-auto py-10">
          <div className="bg-white rounded-2xl shadow-2xl border border-[#eaeaea] max-w-2xl w-full p-6 relative max-h-[90vh] overflow-y-auto flex flex-col gap-6 animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setOfflineModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-black text-xl transition-colors w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
            >
              ✕
            </button>
            
            <div>
              <h2 className="text-xl font-bold text-[#1a1a1a]">Tạo Đơn Thuê Offline Tại Cửa Hàng</h2>
              <p className="text-xs text-[#777] mt-1">Ghi nhận thông tin khách thuê trực tiếp tại quầy và trừ tồn kho tự động.</p>
            </div>

            <form onSubmit={handleSubmitOfflineOrder} className="space-y-5">
              {/* 1. Chọn thời gian */}
              <div className="bg-gray-50/50 border border-[#eaeaea] rounded-xl p-4 space-y-3">
                <h3 className="text-xs font-bold text-[#999] uppercase tracking-wider">1. Thời gian thuê</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Ngày bắt đầu *</label>
                    <input
                      type="date"
                      required
                      value={offlineData.startDate}
                      onChange={e => setOfflineData({ ...offlineData, startDate: e.target.value })}
                      className="w-full border border-[#eaeaea] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1a1a1a]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Ngày kết thúc *</label>
                    <input
                      type="date"
                      required
                      value={offlineData.endDate}
                      onChange={e => setOfflineData({ ...offlineData, endDate: e.target.value })}
                      className="w-full border border-[#eaeaea] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1a1a1a]"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Thông tin khách thuê */}
              <div className="bg-gray-50/50 border border-[#eaeaea] rounded-xl p-4 space-y-3">
                <h3 className="text-xs font-bold text-[#999] uppercase tracking-wider">2. Thông tin khách hàng</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Họ và tên khách *</label>
                    <input
                      type="text"
                      required
                      placeholder="Nguyễn Văn A"
                      value={offlineData.customerName}
                      onChange={e => setOfflineData({ ...offlineData, customerName: e.target.value })}
                      className="w-full border border-[#eaeaea] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1a1a1a]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Số điện thoại *</label>
                    <input
                      type="tel"
                      required
                      placeholder="09xxxxxxxx"
                      value={offlineData.customerPhone}
                      onChange={e => setOfflineData({ ...offlineData, customerPhone: e.target.value })}
                      className="w-full border border-[#eaeaea] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1a1a1a]"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Địa chỉ khách hàng</label>
                    <input
                      type="text"
                      placeholder="Số nhà, Tên đường, Quận/Huyện, Tỉnh/TP"
                      value={offlineData.customerAddress}
                      onChange={e => setOfflineData({ ...offlineData, customerAddress: e.target.value })}
                      className="w-full border border-[#eaeaea] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1a1a1a]"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Trang phục thuê */}
              <div className="bg-gray-50/50 border border-[#eaeaea] rounded-xl p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-bold text-[#999] uppercase tracking-wider">3. Danh sách trang phục thuê</h3>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    + Thêm trang phục
                  </button>
                </div>

                <div className="space-y-3">
                  {offlineData.items.map((item, index) => (
                    <div key={index} className="flex flex-wrap sm:flex-nowrap gap-3 items-end border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                      <div className="flex-1 min-w-[200px]">
                        <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">Trang phục *</label>
                        <select
                          required
                          value={item.costume}
                          onChange={e => handleCostumeChange(index, e.target.value)}
                          className="w-full border border-[#eaeaea] rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-[#1a1a1a] bg-white"
                        >
                          <option value="">-- Chọn trang phục --</option>
                          {costumesList.map(c => (
                            <option key={c._id} value={c._id}>
                              {c.name} ({Math.round(c.pricePerDay).toLocaleString('vi-VN')}đ/ngày)
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="w-24">
                        <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">Size *</label>
                        <select
                          required
                          value={item.size}
                          disabled={!item.costume}
                          onChange={e => handleSizeChange(index, e.target.value)}
                          className="w-full border border-[#eaeaea] rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-[#1a1a1a] bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                        >
                          <option value="">Size</option>
                          {item.availableSizes.map(sz => (
                            <option key={sz} value={sz}>{sz}</option>
                          ))}
                        </select>
                      </div>

                      <div className="w-20">
                        <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">SL *</label>
                        <input
                          type="number"
                          required
                          min="1"
                          value={item.quantity}
                          onChange={e => handleQuantityChange(index, e.target.value)}
                          className="w-full border border-[#eaeaea] rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-[#1a1a1a]"
                        />
                      </div>

                      {offlineData.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          className="text-red-500 hover:text-red-700 text-sm font-semibold py-1.5 px-2.5 rounded hover:bg-red-50 transition-colors flex-shrink-0"
                        >
                          Xóa
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 justify-end pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setOfflineModalOpen(false)}
                  className="px-4 py-2 border border-[#eaeaea] hover:bg-[#faf9f7] rounded-xl text-sm font-semibold transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#1a1a1a] hover:bg-[#333] text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
                >
                  Xác nhận đặt đơn
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast.show && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />
      )}
    </div>
  );
}