import { useState, useEffect } from "react";
import Toast from "../../components/ui/Toast";
import Pagination from "../../components/ui/Pagination";
// Import useAuth để lấy token chuẩn từ hệ thống
import { useAuth } from "../../context/AuthContext";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:9999";

export default function OrdersPage() {
  // Lấy token và role trực tiếp từ Context thay vì localStorage
  const { token, role } = useAuth();

  const [orders, setOrders] = useState([]);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [paymentModal, setPaymentModal] = useState({ isOpen: false, order: null });
  const [paymentMethod, setPaymentMethod] = useState("cash");

  const [handoverModal, setHandoverModal] = useState({ isOpen: false, order: null });
  const [handoverNote, setHandoverNote] = useState("");
  const [handoverPhotos, setHandoverPhotos] = useState([]);

  const [returnModal, setReturnModal] = useState({ isOpen: false, order: null });
  const [returnDamageFee, setReturnDamageFee] = useState(0);
  const [returnNotes, setReturnNotes] = useState("");

  const fetchOrders = async () => {
    // Rào chắn bảo vệ: Chỉ gọi API khi token đã thực sự sẵn sàng
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

  // Lắng nghe sự thay đổi của token. Chỉ khi có token mới bắt đầu gọi dữ liệu
  useEffect(() => {
    if (token) {
      fetchOrders();
    }
  }, [token]);

  const updateStatus = async (id, newStatus) => {
    if (!id || !token) return;
    try {
      const res = await fetch(`${API_URL}/api/rentals/${id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await res.json();

      if (res.ok) {
        setToast({ show: true, message: "Cập nhật trạng thái thành công!", type: "success" });
        fetchOrders();
      } else {
        setToast({ show: true, message: data.message || "Lỗi cập nhật", type: "error" });
      }
    } catch (error) {
      setToast({ show: true, message: "Mất kết nối đến máy chủ", type: "error" });
    }
  };

  const handleConfirmPreparation = async (id) => {
    if (!id || !token) return;
    try {
      const res = await fetch(`${API_URL}/api/rentals/${id}/confirm`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`
        }
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
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          status: "preparing",
          paymentMethod: paymentMethod
        })
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
    formData.append("status", "renting"); // Đổi trạng thái khớp với DB
    formData.append("note", handoverNote);
    handoverPhotos.forEach((file) => {
      formData.append("photos", file);
    });

    try {
      const res = await fetch(`${API_URL}/api/rentals/${handoverModal.order._id}/handover`, {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData
      });

      if (res.ok) {
        setToast({ show: true, message: "Đã giao đồ và lưu ảnh tình trạng thành công!", type: "success" });
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

  const handleInspectReturn = async () => {
    if (!returnModal.order || !returnModal.order._id || !token) return;

    try {
      const res = await fetch(`${API_URL}/api/rentals/${returnModal.order._id}/inspect-return`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          damageFee: Number(returnDamageFee),
          missingNotes: returnNotes
        })
      });

      const data = await res.json();

      if (res.ok) {
        setToast({ show: true, message: "Hoàn tất kiểm tra và trả cọc thành công!", type: "success" });
        setReturnModal({ isOpen: false, order: null });
        setReturnDamageFee(0);
        setReturnNotes("");
        fetchOrders();
      } else {
        setToast({ show: true, message: data.message || "Lỗi kiểm tra trả đồ", type: "error" });
      }
    } catch (error) {
      setToast({ show: true, message: "Mất kết nối đến máy chủ", type: "error" });
    }
  };

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
    { header: "Khách hàng", accessor: (row) => row.customerId?.fullName || "Khách vãng lai" },
    { header: "Trang phục", accessor: (row) => row.items && row.items.length > 0 ? row.items.map(i => i.costume?.name).join(', ') : "N/A" },
    { header: "Ngày lấy", accessor: (row) => row.startDate ? new Date(row.startDate).toLocaleDateString('vi-VN') : "N/A" },
    { header: "Ngày trả", accessor: (row) => row.endDate ? new Date(row.endDate).toLocaleDateString('vi-VN') : "N/A" },
    {
      header: "Thao tác",
      accessor: (row) => {
        if (row.status === 'pending' || row.status === 'preparing') {
          return (
            <button
              onClick={() => handleConfirmPreparation(row._id)}
              className="text-[12px] font-semibold bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700 transition-colors"
            >
              Xác nhận giao hàng
            </button>
          );
        }
        if (row.status === 'returning' || row.status === 'overdue' || row.status === 'renting') {
          return (
            <button
              onClick={() => setReturnModal({ isOpen: true, order: row })}
              className="text-[12px] font-semibold bg-purple-600 text-white px-3 py-1.5 rounded hover:bg-purple-700 transition-colors"
            >
              Kiểm tra trả đồ
            </button>
          );
        }
        return <span className="text-[12px] font-medium text-[#858585]">Không có</span>;
      }
    },
    {
      header: "Trạng thái",
      accessor: (row) => {
        const isLocked = row.status === 'completed' || row.status === 'cancelled';

        if (role === 'staff') {
          return (
            <span className={`px-2.5 py-1.5 border rounded-md text-[12px] font-semibold ${getStatusColor(row.status)}`}>
              {getStatusLabel(row.status)}
            </span>
          );
        }

        return (
          <select
            value={row.status || ""}
            onChange={(e) => updateStatus(row._id, e.target.value)}
            disabled={isLocked}
            className={`border px-2 py-1.5 rounded-md text-[13px] font-semibold outline-none transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-70 ${getStatusColor(row.status)}`}
          >
            <option value="pending">Chờ xử lý</option>
            <option value="awaitingPayment">Chờ thanh toán</option>
            <option value="preparing">Đang chuẩn bị đồ</option>
            <option value="delivering">Đang giao</option>
            <option value="delivered">Đã giao hàng</option>
            <option value="renting">Đang thuê </option>
            <option value="returning">Đang trả hàng</option>
            <option value="completed">Hoàn tất</option>
            <option value="cancelled">Đã hủy</option>
            <option value="overdue">Quá hạn</option>
          </select>
        );
      }
    }
  ];

  // Đưa về trang 1 khi filter đổi
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  const filteredOrders = orders.filter((order) => {
    const searchMatch =
      (order._id && order._id.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (order.customerId?.fullName && order.customerId.fullName.toLowerCase().includes(searchTerm.toLowerCase()));

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

      {/* Filter & Search Bar */}
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
          <option value="delivered">Đã giao hàng</option>
          <option value="renting">Đang thuê</option>
          <option value="returning">Đang trả hàng</option>
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
                <tr key={idx} className="border-b border-[#eaeaea] hover:bg-[#faf9f7] transition-colors">
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

      {toast.show && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />
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

      {/* Modal Kiểm tra trả đồ */}
      {returnModal.isOpen && returnModal.order && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-fade-in">
            <h2 className="text-lg font-bold text-[#1a1a1a] mb-2">Kiểm tra trả đồ</h2>
            <p className="text-sm text-[#555] mb-6">
              Vui lòng kiểm tra kỹ tình trạng đồ mã <span className="font-semibold text-[#1a1a1a]">{returnModal.order._id.slice(-6).toUpperCase()}</span>.
            </p>

            <div className="mb-4">
              <label className="block text-[13px] font-semibold text-[#1a1a1a] mb-2">Phí phạt hư hỏng / làm bẩn (VNĐ)</label>
              <input
                type="number" min="0" value={returnDamageFee} onChange={(e) => setReturnDamageFee(e.target.value)}
                placeholder="Nhập 0 nếu đồ nguyên vẹn"
                className="w-full px-3 py-2 border border-[#eaeaea] rounded-md text-sm outline-none focus:border-[#1a1a1a] transition-colors"
              />
            </div>

            <div className="mb-6">
              <label className="block text-[13px] font-semibold text-[#1a1a1a] mb-2">Ghi chú tình trạng (Bắt buộc nếu có phạt)</label>
              <textarea
                rows="3" value={returnNotes} onChange={(e) => setReturnNotes(e.target.value)}
                placeholder="Mô tả chi tiết hư hỏng..."
                className="w-full px-3 py-2 border border-[#eaeaea] rounded-md text-sm outline-none focus:border-[#1a1a1a] transition-colors resize-none"
              ></textarea>
            </div>

            <div className="bg-[#faf9f7] p-3 rounded-md mb-6 border border-[#eaeaea]">
              <p className="text-sm font-semibold text-gray-700">Tiền cọc ban đầu: <span className="font-bold text-gray-900">{(returnModal.order.totalDeposit || 0).toLocaleString()}đ</span></p>
              <p className="text-xs text-gray-500 mt-1">*Hệ thống sẽ tự động tính phí quá hạn và trừ vào cọc trước khi hoàn tiền cho khách.</p>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => { setReturnModal({ isOpen: false, order: null }); setReturnDamageFee(0); setReturnNotes(""); }}
                className="px-4 py-2 text-sm font-medium text-[#555] bg-[#f5f5f5] rounded-md hover:bg-[#eaeaea] transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleInspectReturn}
                className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 transition-colors"
              >
                Xác nhận hoàn tất
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}