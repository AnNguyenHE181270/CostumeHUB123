import { useState, useEffect } from "react";
import DataTable from "../../components/ui/DataTable";
import Toast from "../../components/ui/Toast";
// Import useAuth để lấy token chuẩn từ hệ thống
import { useAuth } from "../../context/AuthContext";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:9999";

export default function OrdersPage() {
  // Lấy token trực tiếp từ Context thay vì localStorage
  const { token } = useAuth(); 

  const [orders, setOrders] = useState([]);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  
  const [paymentModal, setPaymentModal] = useState({ isOpen: false, order: null });
  const [paymentMethod, setPaymentMethod] = useState("cash");

  const [handoverModal, setHandoverModal] = useState({ isOpen: false, order: null });
  const [handoverNote, setHandoverNote] = useState("");
  const [handoverPhotos, setHandoverPhotos] = useState([]);

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
        fetchOrders();
      } else {
        setToast({ show: true, message: data.message || "Lỗi cập nhật", type: "error" });
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
        body: JSON.stringify({ 
          status: "confirmed",
          paymentMethod: paymentMethod 
        })
      });

      if (res.ok) {
        setToast({ show: true, message: "Ghi nhận thu tiền thành công! Vui lòng giao đồ cho khách.", type: "success" });
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

  const getStatusColor = (status) => {
    switch(status) {
      case 'pending': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'confirmed': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'renting': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'returning': return 'bg-[#faf9f7] text-orange-700 border-orange-200';
      case 'completed': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'cancelled': return 'bg-[#faf9f7] text-[#999] border-[#eaeaea]';
      default: return 'bg-white text-[#555] border-[#eaeaea]';
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
        if (row.status === 'pending') {
          return (
            <button 
              onClick={() => setPaymentModal({ isOpen: true, order: row })}
              className="text-[12px] font-semibold bg-[#1a1a1a] text-white px-3 py-1.5 rounded hover:bg-[#333] transition-colors"
            >
              Thu tiền
            </button>
          );
        }
        if (row.status === 'confirmed') {
          return (
            <button 
              onClick={() => setHandoverModal({ isOpen: true, order: row })}
              className="text-[12px] font-semibold bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700 transition-colors"
            >
              Giao đồ
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
        return (
          <select 
            value={row.status || ""} 
            onChange={(e) => updateStatus(row._id, e.target.value)}
            disabled={isLocked}
            className={`border px-2 py-1.5 rounded-md text-[13px] font-semibold outline-none transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-70 ${getStatusColor(row.status)}`}
          >
            <option value="pending">Chờ xử lý</option>
            <option value="confirmed">Đã xác nhận</option>
            <option value="renting">Đang thuê (Đã lấy)</option>
            <option value="returning">Đã trả (Chờ kiểm tra)</option>
            <option value="completed">Hoàn tất</option>
            <option value="cancelled">Đã hủy</option>
          </select>
        );
      }
    }
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-[#eaeaea] p-6 relative">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold text-[#1a1a1a]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Quản lý Đơn Thuê</h1>
      </div>
      
      <div className="overflow-hidden rounded-lg border border-[#eaeaea]">
        <DataTable columns={columns} data={orders} />
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
    </div>
  );
}