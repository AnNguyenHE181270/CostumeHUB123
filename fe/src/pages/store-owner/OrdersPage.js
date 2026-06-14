import { useState, useEffect } from "react";
import DataTable from "../../components/ui/DataTable";
import Toast from "../../components/ui/Toast";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:9999";

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  
  // State cho Modal thu tiền tại quầy
  const [paymentModal, setPaymentModal] = useState({ isOpen: false, order: null });
  const [paymentMethod, setPaymentMethod] = useState("cash");

  const fetchOrders = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_URL}/api/rentals`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      } else {
        console.error("Không thể tải danh sách đơn hàng");
      }
    } catch (error) {
      console.error("Lỗi fetch đơn hàng", error);
    }
  };

  useEffect(() => { 
    fetchOrders(); 
  }, []);

  const updateStatus = async (id, newStatus) => {
    const token = localStorage.getItem("token");
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

  // Hàm xử lý khi xác nhận thu tiền tại quầy
  const handleConfirmPayment = async () => {
    if (!paymentModal.order) return;
    const token = localStorage.getItem("token");
    
    try {
      // Gửi request cập nhật trạng thái đơn hàng thành picked_up và kèm phương thức thanh toán
      const res = await fetch(`${API_URL}/api/rentals/${paymentModal.order._id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ 
          status: "picked_up",
          paymentMethod: paymentMethod 
        })
      });

      if (res.ok) {
        setToast({ show: true, message: "Ghi nhận thu tiền thành công! Đơn đã chuyển sang Đang thuê.", type: "success" });
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

  const getStatusColor = (status) => {
    switch(status) {
      case 'pending': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'confirmed': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'picked_up': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'returned': return 'bg-[#faf9f7] text-orange-700 border-orange-200';
      case 'completed': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'cancelled': return 'bg-[#faf9f7] text-[#999] border-[#eaeaea]';
      default: return 'bg-white text-[#555] border-[#eaeaea]';
    }
  };

  const columns = [
    { header: "Mã Đơn", accessor: (row) => <span className="font-medium text-[#555]">{row._id.slice(-6).toUpperCase()}</span> },
    { header: "Khách hàng", accessor: (row) => row.user?.fullName || "Khách vãng lai" },
    { header: "Trang phục", accessor: (row) => row.costume?.name || "N/A" },
    { header: "Ngày lấy", accessor: (row) => new Date(row.startDate).toLocaleDateString('vi-VN') },
    { header: "Ngày trả", accessor: (row) => new Date(row.endDate).toLocaleDateString('vi-VN') },
    { 
      header: "Thanh toán", 
      accessor: (row) => {
        if (row.status === 'pending' || row.status === 'draft') {
          return (
            <button 
              onClick={() => setPaymentModal({ isOpen: true, order: row })}
              className="text-[12px] font-semibold bg-[#1a1a1a] text-white px-3 py-1.5 rounded hover:bg-[#333] transition-colors"
            >
              Thu tiền
            </button>
          );
        }
        return <span className="text-[12px] font-medium text-[#858585]">Đã thanh toán</span>;
      }
    },
    { 
      header: "Trạng thái", 
      accessor: (row) => {
        const isLocked = row.status === 'completed' || row.status === 'cancelled';
        
        return (
          <select 
            value={row.status} 
            onChange={(e) => updateStatus(row._id, e.target.value)}
            disabled={isLocked}
            className={`border px-2 py-1.5 rounded-md text-[13px] font-semibold outline-none transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-70 ${getStatusColor(row.status)}`}
          >
            <option value="pending">Chờ xử lý</option>
            <option value="confirmed">Đã xác nhận</option>
            <option value="picked_up">Đang thuê (Đã lấy)</option>
            <option value="returned">Đã trả (Chờ kiểm tra)</option>
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
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast({ ...toast, show: false })} 
        />
      )}

      {/* Modal Ghi nhận thanh toán tại quầy */}
      {paymentModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 animate-fade-in">
            <h2 className="text-lg font-bold text-[#1a1a1a] mb-2">Ghi nhận thanh toán</h2>
            <p className="text-sm text-[#555] mb-6">
              Xác nhận thu đủ tiền cọc và tiền thuê cho đơn hàng mã <span className="font-semibold text-[#1a1a1a]">{paymentModal.order._id.slice(-6).toUpperCase()}</span>.
            </p>

            <div className="mb-6 space-y-3">
              <label className="flex items-center gap-3 p-3 border border-[#eaeaea] rounded-lg cursor-pointer hover:bg-[#f9f9f9] transition-colors">
                <input 
                  type="radio" 
                  name="paymentMethod" 
                  value="cash" 
                  checked={paymentMethod === "cash"}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-4 h-4 text-[#1a1a1a] focus:ring-[#1a1a1a]"
                />
                <span className="text-sm font-medium text-[#1a1a1a]">Tiền mặt</span>
              </label>
              
              <label className="flex items-center gap-3 p-3 border border-[#eaeaea] rounded-lg cursor-pointer hover:bg-[#f9f9f9] transition-colors">
                <input 
                  type="radio" 
                  name="paymentMethod" 
                  value="vnpay_qr" 
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
    </div>
  );
}