import { useState, useEffect } from "react";
import Toast from "../../components/ui/Toast";
import Pagination from "../../components/ui/Pagination";
import { useAuth } from "../../context/AuthContext";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:9999";

export default function OrdersPage() {
  const { token, role } = useAuth();
  const [orders, setOrders] = useState([]);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [selectedOrder, setSelectedOrder] = useState(null);
  
  const [showInspectModal, setShowInspectModal] = useState(false);
  const [inspectForm, setInspectForm] = useState({ damageFee: "", missingNotes: "" });

  const [paymentModal, setPaymentModal] = useState({ isOpen: false, order: null });
  const [paymentMethod, setPaymentMethod] = useState("cash");

  const [handoverModal, setHandoverModal] = useState({ isOpen: false, order: null });
  const [handoverNote, setHandoverNote] = useState("");
  const [handoverPhotos, setHandoverPhotos] = useState([]);

  const fetchOrders = async () => {
    if (!token) return; 

    try {
      const res = await fetch(`${API_URL}/api/rentals`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const validOrders = Array.isArray(data) ? data : (data.rentals || data.data || data.orders || []);
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

  const updateStatus = async (id, newStatus) => {
    if (!id || !token) return;
    try {
      const res = await fetch(`${API_URL}/api/rentals/${id}/status`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json", 
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      const data = await res.json();

      if (res.ok) {
        setToast({ show: true, message: "Cập nhật trạng thái thành công!", type: "success" });
        if (selectedOrder && selectedOrder._id === id) {
          setSelectedOrder({ ...selectedOrder, status: newStatus });
        }
        fetchOrders();
      } else {
        setToast({ show: true, message: data.message || "Lỗi cập nhật", type: "error" });
      }
    } catch (error) {
      setToast({ show: true, message: "Mất kết nối đến máy chủ", type: "error" });
    }
  };

  const handleReturnItem = async (id) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/rentals/${id}/return`, {
        method: "PATCH",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        setToast({ show: true, message: "Đã nhận đồ từ khách!", type: "success" });
        if (selectedOrder && selectedOrder._id === id) {
          setSelectedOrder({ ...selectedOrder, status: 'returning' });
        }
        fetchOrders();
      } else {
        setToast({ show: true, message: "Lỗi khi nhận đồ", type: "error" });
      }
    } catch (error) {
      setToast({ show: true, message: "Lỗi kết nối", type: "error" });
    }
  };

  const submitInspection = async () => {
    if (!token || !selectedOrder) return;
    try {
      const res = await fetch(`${API_URL}/api/rentals/${selectedOrder._id}/inspect`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({
          damageFee: Number(inspectForm.damageFee) || 0,
          missingNotes: inspectForm.missingNotes || "Đồ nguyên vẹn"
        })
      });
      if (res.ok) {
        const data = await res.json();
        setToast({ show: true, message: `Hoàn tất! Phạt: ${data.data.totalFine}đ. Hoàn cọc: ${data.data.refundAmount}đ`, type: "success" });
        setShowInspectModal(false);
        setSelectedOrder({ ...selectedOrder, status: 'completed' });
        fetchOrders();
      } else {
        setToast({ show: true, message: "Lỗi kiểm tra đồ", type: "error" });
      }
    } catch (error) {
      setToast({ show: true, message: "Lỗi kết nối", type: "error" });
    }
  };

  const handleConfirmPreparation = async (id) => {
    if (!id || !token) return;
    try {
      const res = await fetch(`${API_URL}/api/rentals/${id}/confirm`, {
        method: "PUT",
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setToast({ show: true, message: data.message || "Xác nhận thành công!", type: "success" });
        fetchOrders();
      } else {
        setToast({ show: true, message: data.message || "Lỗi khi xác nhận", type: "error" });
      }
    } catch (error) {
      setToast({ show: true, message: "Mất kết nối đến máy chủ", type: "error" });
    }
  };

  const handleConfirmPayment = async () => {
    if (!paymentModal.order || !paymentModal.order._id || !token) return;
    try {
      const res = await fetch(`${API_URL}/api/rentals/${paymentModal.order._id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ status: "preparing", paymentMethod: paymentMethod })
      });
      if (res.ok) {
        setToast({ show: true, message: "Ghi nhận thu tiền thành công! Vui lòng chuẩn bị đồ.", type: "success" });
        setPaymentModal({ isOpen: false, order: null });
        fetchOrders();
      } else {
        const data = await res.json();
        setToast({ show: true, message: data.message || "Lỗi ghi nhận thanh toán", type: "error" });
      }
    } catch (error) {
      setToast({ show: true, message: "Mất kết nối đến máy chủ", type: "error" });
    }
  };

  const handlePhotoChange = (e) => {
    setHandoverPhotos([...e.target.files]);
  };

  const handleConfirmHandover = async () => {
    if (!handoverModal.order || !handoverModal.order._id || !token) return;
    const formData = new FormData();
    formData.append("status", "renting"); 
    formData.append("note", handoverNote);
    handoverPhotos.forEach((file) => {
      formData.append("photos", file);
    });

    try {
      const res = await fetch(`${API_URL}/api/rentals/${handoverModal.order._id}/handover`, {
        method: "PATCH",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData 
      });

      if (res.ok) {
        setToast({ show: true, message: "Đã giao đồ và lưu ảnh thành công!", type: "success" });
        setHandoverModal({ isOpen: false, order: null });
        setHandoverNote("");
        setHandoverPhotos([]);
        fetchOrders();
      } else {
        const data = await res.json();
        setToast({ show: true, message: data.message || "Lỗi khi xác nhận giao đồ", type: "error" });
      }
    } catch (error) {
      setToast({ show: true, message: "Mất kết nối đến máy chủ", type: "error" });
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'pending': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'awaitingPayment': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'preparing': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'delivering': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'renting': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'returning': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'completed': return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'cancelled': return 'bg-[#faf9f7] text-[#999] border-[#eaeaea]';
      case 'overdue': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-white text-[#555] border-[#eaeaea]';
    }
  };

  const getStatusLabel = (status) => {
    switch(status) {
      case 'pending': return 'Chờ xử lý';
      case 'awaitingPayment': return 'Chờ thanh toán';
      case 'preparing': return 'Đang chuẩn bị đồ';
      case 'delivering': return 'Đang giao';
      case 'renting': return 'Đang thuê';
      case 'returning': return 'Chờ kiểm tra';
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
    { header: "Tổng tiền", accessor: (row) => <span className="font-semibold text-[#555]">{row.totalAmount?.toLocaleString('vi-VN')} đ</span> },
    { 
      header: "Thao tác", 
      accessor: (row) => {
        if (row.status === 'pending' || row.status === 'awaitingPayment') {
          return <button onClick={(e) => { e.stopPropagation(); setPaymentModal({ isOpen: true, order: row }); }} className="text-[12px] font-semibold bg-[#1a1a1a] text-white px-3 py-1.5 rounded hover:bg-[#333] transition-colors">Xác nhận tiền</button>;
        }
        if (row.status === 'preparing') {
          return <button onClick={(e) => { e.stopPropagation(); handleConfirmPreparation(row._id); }} className="text-[12px] font-semibold bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700 transition-colors">Chuẩn bị xong</button>;
        }
        if (row.status === 'renting') {
          return <button onClick={(e) => { e.stopPropagation(); handleReturnItem(row._id); }} className="text-[12px] font-semibold bg-orange-500 text-white px-3 py-1.5 rounded hover:bg-orange-600 transition-colors">Khách trả đồ</button>;
        }
        if (row.status === 'returning') {
          return <button onClick={(e) => { e.stopPropagation(); setSelectedOrder(row); setShowInspectModal(true); }} className="text-[12px] font-semibold bg-red-600 text-white px-3 py-1.5 rounded hover:bg-red-700 transition-colors">Kiểm tra hao mòn</button>;
        }
        return <span className="text-[12px] font-medium text-[#858585]">Không có</span>;
      }
    },
    { 
      header: "Trạng thái", 
      accessor: (row) => {
        const isLocked = row.status === 'completed' || row.status === 'cancelled';
        return (
          <select 
            value={row.status || ""} 
            onChange={(e) => updateStatus(row._id, e.target.value)}
            onClick={(e) => e.stopPropagation()}
            disabled={isLocked}
            className={`border px-2 py-1.5 rounded-md text-[13px] font-semibold outline-none transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-70 ${getStatusColor(row.status)}`}
          >
            <option value="pending">Chờ xử lý</option>
            <option value="awaitingPayment">Chờ thanh toán</option>
            <option value="preparing">Đang chuẩn bị đồ</option>
            <option value="delivering">Đang giao</option>
            <option value="renting">Đang thuê</option>
            <option value="returning">Chờ kiểm tra</option>
            <option value="completed">Hoàn tất</option>
            <option value="cancelled">Đã hủy</option>
            <option value="overdue">Quá hạn</option>
          </select>
        );
      }
    }
  ];

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  const filteredOrders = orders.filter((order) => {
    const nameStr = (order.shippingAddress?.receiverName || order.customerId?.fullName || "").toLowerCase();
    const searchMatch = (order._id && order._id.toLowerCase().includes(searchTerm.toLowerCase())) || nameStr.includes(searchTerm.toLowerCase());
    const statusMatch = statusFilter === "all" || order.status === statusFilter;
    return searchMatch && statusMatch;
  });

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const currentOrders = filteredOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-[#eaeaea] p-6 relative">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold text-[#1a1a1a]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Quản lý Đơn Thuê</h1>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <input 
          type="text" 
          placeholder="Tìm mã đơn, tên khách hàng..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="px-4 py-2 border border-[#eaeaea] rounded-lg text-sm outline-none focus:border-[#1a1a1a] transition-colors w-full sm:w-80"
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
          <option value="renting">Đang thuê</option>
          <option value="returning">Chờ kiểm tra</option>
          <option value="completed">Hoàn tất</option>
          <option value="cancelled">Đã hủy</option>
          <option value="overdue">Quá hạn</option>
        </select>
      </div>
      
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
        
        {filteredOrders.length > 0 && (
          <Pagination 
            displayCount={currentOrders.length}
            totalCount={filteredOrders.length}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(page) => setCurrentPage(page)}
          />
        )}
      </div>

      {/* MODAL CHI TIẾT ĐƠN HÀNG */}
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
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Trạng thái hiện tại:</p>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(selectedOrder.status)}`}>
                  {getStatusLabel(selectedOrder.status)}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                {selectedOrder.status === 'pending' && <button onClick={() => updateStatus(selectedOrder._id, 'confirmed')} className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700">Xác nhận đơn</button>}
                {selectedOrder.status === 'confirmed' && <button onClick={() => updateStatus(selectedOrder._id, 'renting')} className="bg-indigo-600 text-white px-4 py-2 rounded text-sm hover:bg-indigo-700">Giao đồ cho khách</button>}
                {selectedOrder.status === 'renting' && <button onClick={() => handleReturnItem(selectedOrder._id)} className="bg-orange-500 text-white px-4 py-2 rounded text-sm hover:bg-orange-600 font-bold">Khách trả đồ (Nhận lại)</button>}
                {selectedOrder.status === 'returning' && <button onClick={() => setShowInspectModal(true)} className="bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700 font-bold">Kiểm tra hao mòn & Chốt đơn</button>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Thu tiền */}
      {paymentModal.isOpen && paymentModal.order && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 animate-fade-in">
            <h2 className="text-lg font-bold text-[#1a1a1a] mb-2">Ghi nhận thanh toán</h2>
            <p className="text-sm text-[#555] mb-6">
              Xác nhận thu đủ tiền cọc và tiền thuê cho đơn hàng mã <span className="font-semibold text-[#1a1a1a]">{paymentModal.order._id ? paymentModal.order._id.slice(-6).toUpperCase() : ""}</span>.
            </p>

            <div className="mb-6 space-y-3">
              <label className="flex items-center gap-3 p-3 border border-[#eaeaea] rounded-lg cursor-pointer hover:bg-[#f9f9f9] transition-colors">
                <input 
                  type="radio" name="paymentMethod" value="cash" 
                  checked={paymentMethod === "cash"}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-4 h-4 text-[#1a1a1a] focus:ring-[#1a1a1a]"
                />
                <span className="text-sm font-medium text-[#1a1a1a]">Tiền mặt</span>
              </label>
              <label className="flex items-center gap-3 p-3 border border-[#eaeaea] rounded-lg cursor-pointer hover:bg-[#f9f9f9] transition-colors">
                <input 
                  type="radio" name="paymentMethod" value="vnpay_qr" 
                  checked={paymentMethod === "vnpay_qr"}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-4 h-4 text-[#1a1a1a] focus:ring-[#1a1a1a]"
                />
                <span className="text-sm font-medium text-[#1a1a1a]">Mã QR VNPay (Tĩnh)</span>
              </label>
            </div>

            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setPaymentModal({ isOpen: false, order: null })}
                className="px-4 py-2 text-sm font-medium text-[#555] bg-[#f5f5f5] rounded-md hover:bg-[#eaeaea] transition-colors"
              >
                Hủy bỏ
              </button>
              <button 
                onClick={handleConfirmPayment}
                className="px-4 py-2 text-sm font-medium text-white bg-[#1a1a1a] rounded-md hover:bg-[#333] transition-colors"
              >
                Xác nhận đã thu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Giao đồ */}
      {handoverModal.isOpen && handoverModal.order && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-fade-in">
            <h2 className="text-lg font-bold text-[#1a1a1a] mb-2">Xác nhận giao đồ</h2>
            <p className="text-sm text-[#555] mb-6">
              Lưu lại tình trạng của <span className="font-semibold text-[#1a1a1a]">{handoverModal.order.items?.[0]?.costume?.name || "sản phẩm"}</span> trước khi giao cho khách.
            </p>

            <div className="mb-4">
              <label className="block text-[13px] font-semibold text-[#1a1a1a] mb-2">Ảnh tình trạng hiện tại</label>
              <input 
                type="file" multiple accept="image/*" onChange={handlePhotoChange}
                className="w-full text-sm text-[#555] file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-[#f5f5f5] file:text-[#1a1a1a] hover:file:bg-[#eaeaea] cursor-pointer"
              />
            </div>

            <div className="mb-6">
              <label className="block text-[13px] font-semibold text-[#1a1a1a] mb-2">Ghi chú thêm (Tùy chọn)</label>
              <textarea 
                rows="3" value={handoverNote} onChange={(e) => setHandoverNote(e.target.value)}
                placeholder="Ghi nhận lỗi nhỏ, vết bẩn (nếu có)..."
                className="w-full px-3 py-2 border border-[#eaeaea] rounded-md text-sm outline-none focus:border-[#1a1a1a] transition-colors resize-none"
              ></textarea>
            </div>

            <div className="flex justify-end gap-3">
              <button 
                onClick={() => { setHandoverModal({ isOpen: false, order: null }); setHandoverPhotos([]); }}
                className="px-4 py-2 text-sm font-medium text-[#555] bg-[#f5f5f5] rounded-md hover:bg-[#eaeaea] transition-colors"
              >
                Đóng
              </button>
              <button 
                onClick={handleConfirmHandover}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
              >
                Giao đồ & Cập nhật
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP KIỂM TRA HAO MÒN (KAN-125) */}
      {showInspectModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-bold mb-4 text-red-600">Kiểm tra Hao mòn & Khấu trừ</h3>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Tiền phạt hư hỏng / mất đồ (VNĐ):</label>
              <input
                type="number"
                value={inspectForm.damageFee}
                onChange={e => setInspectForm({ ...inspectForm, damageFee: e.target.value })}
                placeholder="Nhập số tiền phạt (nếu có)"
                className="w-full border px-3 py-2 rounded outline-none focus:border-red-500"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium mb-1">Ghi chú tình trạng trả đồ:</label>
              <textarea
                value={inspectForm.missingNotes}
                onChange={e => setInspectForm({ ...inspectForm, missingNotes: e.target.value })}
                placeholder="Vd: Rách nhẹ tà áo, đền 50k..."
                className="w-full border px-3 py-2 rounded outline-none focus:border-red-500 min-h-[80px]"
              />
            </div>

            <div className="flex justify-end gap-3">
              <button onClick={() => setShowInspectModal(false)} className="px-4 py-2 border rounded text-sm hover:bg-gray-50">Hủy</button>
              <button onClick={submitInspection} className="bg-red-600 text-white px-4 py-2 rounded text-sm font-bold hover:bg-red-700">Hoàn tất kiểm tra</button>
            </div>
          </div>
        </div>
      )}

      {toast.show && <Toast message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />}
    </div>
  );
}