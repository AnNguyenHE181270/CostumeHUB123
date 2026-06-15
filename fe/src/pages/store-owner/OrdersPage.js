import { useState, useEffect } from "react";
import Toast from "../../components/ui/Toast";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:9999";

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [role, setRole] = useState("");
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  const [paymentModal, setPaymentModal] = useState({ isOpen: false, order: null });
  const [paymentMethod, setPaymentMethod] = useState("cash");

  const [handoverModal, setHandoverModal] = useState({ isOpen: false, order: null });
  const [handoverNote, setHandoverNote] = useState("");
  const [handoverPhotos, setHandoverPhotos] = useState([]);

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

    // GIẢI MÃ TOKEN ĐỂ LẤY QUYỀN (ROLE)
    try {
      const payload = JSON.parse(atob(currentToken.split('.')[1]));
      setRole(payload.role); // Kết quả sẽ là "owner" hoặc "staff"
    } catch (e) {
      console.error("Không đọc được quyền từ token");
    }

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
        setToast({ show: true, message: "Cập nhật trạng thái thành công!", type: "success" });
        fetchOrders();
      } else {
        setToast({ show: true, message: "Lỗi cập nhật", type: "error" });
      }
    } catch (error) {
      setToast({ show: true, message: "Mất kết nối đến máy chủ", type: "error" });
    }
  };

  const handleConfirmPayment = async () => {
    const currentToken = localStorage.getItem("token");
    if (!paymentModal.order || !paymentModal.order._id || !currentToken) return;

    try {
      const res = await fetch(`${API_URL}/api/rentals/${paymentModal.order._id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${currentToken}`
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
      }
    } catch (error) {
      setToast({ show: true, message: "Mất kết nối", type: "error" });
    }
  };

  const handlePhotoChange = (e) => {
    setHandoverPhotos([...e.target.files]);
  };

  const handleConfirmHandover = async () => {
    const currentToken = localStorage.getItem("token");
    if (!handoverModal.order || !handoverModal.order._id || !currentToken) return;

    const formData = new FormData();
    formData.append("status", "renting");
    formData.append("note", handoverNote);
    handoverPhotos.forEach((file) => formData.append("photos", file));

    try {
      const res = await fetch(`${API_URL}/api/rentals/${handoverModal.order._id}/handover`, {
        method: "PATCH",
        headers: { "Authorization": `Bearer ${currentToken}` },
        body: formData
      });

      if (res.ok) {
        setToast({ show: true, message: "Giao đồ thành công!", type: "success" });
        setHandoverModal({ isOpen: false, order: null });
        setHandoverNote("");
        setHandoverPhotos([]);
        fetchOrders();
      }
    } catch (error) {
      setToast({ show: true, message: "Mất kết nối", type: "error" });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'confirmed': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'renting': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'returning': return 'bg-[#faf9f7] text-orange-700 border-orange-200';
      case 'completed': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'cancelled': return 'bg-[#faf9f7] text-[#999] border-[#eaeaea]';
      default: return 'bg-white text-[#555] border-[#eaeaea]';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-[#eaeaea] p-6 relative">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold text-[#1a1a1a]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Quản lý Đơn Thuê</h1>
      </div>

      <div className="overflow-x-auto rounded-lg border border-[#eaeaea]">
        {orders.length === 0 ? (
          <div className="p-10 text-center text-[#858585] text-sm font-medium">
            Hiện tại không có đơn hàng nào trong hệ thống.
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#f8f9fa] border-b border-[#eaeaea]">
                <th className="p-4 text-[13px] font-semibold text-[#555] whitespace-nowrap">Mã Đơn</th>
                <th className="p-4 text-[13px] font-semibold text-[#555] whitespace-nowrap">Khách hàng</th>
                <th className="p-4 text-[13px] font-semibold text-[#555]">Trang phục</th>
                <th className="p-4 text-[13px] font-semibold text-[#555] whitespace-nowrap">Ngày lấy</th>
                <th className="p-4 text-[13px] font-semibold text-[#555] whitespace-nowrap">Ngày trả</th>
                <th className="p-4 text-[13px] font-semibold text-[#555] whitespace-nowrap">Thao tác</th>
                <th className="p-4 text-[13px] font-semibold text-[#555] whitespace-nowrap">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((row) => {
                const isLocked = row.status === 'completed' || row.status === 'cancelled';
                return (
                  <tr key={row._id} className="border-b border-[#eaeaea] hover:bg-[#fafafa] transition-colors">
                    <td className="p-4 text-sm font-medium text-[#1a1a1a]">{row._id?.slice(-6).toUpperCase()}</td>
                    <td className="p-4 text-sm text-[#555]">{row.customerId?.fullName || "Khách vãng lai"}</td>
                    <td className="p-4 text-sm text-[#555]">
                      {row.items && row.items.length > 0 ? row.items.map(i => i.costume?.name).join(', ') : "N/A"}
                    </td>
                    <td className="p-4 text-sm text-[#555]">{row.startDate ? new Date(row.startDate).toLocaleDateString('vi-VN') : "N/A"}</td>
                    <td className="p-4 text-sm text-[#555]">{row.endDate ? new Date(row.endDate).toLocaleDateString('vi-VN') : "N/A"}</td>
                    <td className="p-4 text-sm">
                      {/* PHÂN QUYỀN: Owner thì chỉ xem, Staff mới có nút */}
                      {role === "owner" ? (
                        <span className="text-[12px] font-medium text-[#858585] italic">Chỉ xem</span>
                      ) : (
                        <>
                          {row.status === 'pending' && (
                            <button onClick={() => setPaymentModal({ isOpen: true, order: row })} className="text-[12px] font-semibold bg-[#1a1a1a] text-white px-3 py-1.5 rounded hover:bg-[#333]">Thu tiền</button>
                          )}
                          {row.status === 'confirmed' && (
                            <button onClick={() => setHandoverModal({ isOpen: true, order: row })} className="text-[12px] font-semibold bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700">Giao đồ</button>
                          )}
                          {row.status !== 'pending' && row.status !== 'confirmed' && (
                            <span className="text-[12px] font-medium text-[#858585]">---</span>
                          )}
                        </>
                      )}
                    </td>
                    <td className="p-4 text-sm">
                      <select 
                        value={row.status || ""} 
                        onChange={(e) => updateStatus(row._id, e.target.value)}
                        // PHÂN QUYỀN: Khóa select nếu là Owner hoặc đơn đã xong
                        disabled={isLocked || role === "owner"}
                        className={`border px-2 py-1.5 rounded-md text-[13px] font-semibold outline-none transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-70 ${getStatusColor(row.status)}`}
                      >
                        <option value="pending">Chờ xử lý</option>
                        <option value="confirmed">Đã xác nhận</option>
                        <option value="renting">Đang thuê</option>
                        <option value="returning">Đã trả (Chờ KT)</option>
                        <option value="completed">Hoàn tất</option>
                        <option value="cancelled">Đã hủy</option>
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {toast.show && <Toast message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />}

      {/* Modal Thu tiền */}
      {paymentModal.isOpen && paymentModal.order && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 animate-fade-in">
            <h2 className="text-lg font-bold text-[#1a1a1a] mb-2">Ghi nhận thanh toán</h2>
            <p className="text-sm text-[#555] mb-6">
              Xác nhận thu đủ tiền cho đơn mã <span className="font-semibold text-[#1a1a1a]">{paymentModal.order._id?.slice(-6).toUpperCase()}</span>.
            </p>
            <div className="mb-6 space-y-3">
              <label className="flex items-center gap-3 p-3 border border-[#eaeaea] rounded-lg cursor-pointer hover:bg-[#f9f9f9]">
                <input type="radio" name="paymentMethod" value="cash" checked={paymentMethod === "cash"} onChange={(e) => setPaymentMethod(e.target.value)} className="w-4 h-4" />
                <span className="text-sm font-medium">Tiền mặt</span>
              </label>
              <label className="flex items-center gap-3 p-3 border border-[#eaeaea] rounded-lg cursor-pointer hover:bg-[#f9f9f9]">
                <input type="radio" name="paymentMethod" value="vnpay_qr" checked={paymentMethod === "vnpay_qr"} onChange={(e) => setPaymentMethod(e.target.value)} className="w-4 h-4" />
                <span className="text-sm font-medium">Mã QR VNPay (Tĩnh)</span>
              </label>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setPaymentModal({ isOpen: false, order: null })} className="px-4 py-2 text-sm font-medium bg-[#f5f5f5] rounded-md">Hủy bỏ</button>
              <button onClick={handleConfirmPayment} className="px-4 py-2 text-sm font-medium text-white bg-[#1a1a1a] rounded-md">Xác nhận đã thu</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Giao đồ */}
      {handoverModal.isOpen && handoverModal.order && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-fade-in">
            <h2 className="text-lg font-bold text-[#1a1a1a] mb-2">Xác nhận giao đồ</h2>
            <p className="text-sm text-[#555] mb-6">Lưu tình trạng <span className="font-semibold text-[#1a1a1a]">{handoverModal.order.items?.[0]?.costume?.name || "sản phẩm"}</span> trước khi giao.</p>
            <div className="mb-4">
              <label className="block text-[13px] font-semibold mb-2">Ảnh tình trạng hiện tại</label>
              <input type="file" multiple accept="image/*" onChange={handlePhotoChange} className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-[#f5f5f5] cursor-pointer" />
            </div>
            <div className="mb-6">
              <label className="block text-[13px] font-semibold mb-2">Ghi chú thêm (Tùy chọn)</label>
              <textarea rows="3" value={handoverNote} onChange={(e) => setHandoverNote(e.target.value)} placeholder="Ghi nhận lỗi nhỏ..." className="w-full px-3 py-2 border border-[#eaeaea] rounded-md text-sm outline-none resize-none"></textarea>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => { setHandoverModal({ isOpen: false, order: null }); setHandoverPhotos([]); }} className="px-4 py-2 text-sm font-medium bg-[#f5f5f5] rounded-md">Đóng</button>
              <button onClick={handleConfirmHandover} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md">Giao đồ & Cập nhật</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}