import { useState, useEffect } from "react";
import DataTable from "../../components/ui/DataTable";
import Toast from "../../components/ui/Toast";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:9999";

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

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
        fetchOrders(); // Tải lại bảng để cập nhật màu sắc và trạng thái khóa
      } else {
        setToast({ show: true, message: data.message || "Lỗi cập nhật", type: "error" });
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
      case 'returned': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'completed': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'cancelled': return 'bg-gray-50 text-gray-500 border-gray-200';
      default: return 'bg-white text-gray-700 border-gray-200';
    }
  };

  const columns = [
    { header: "Mã Đơn", accessor: (row) => <span className="font-medium text-gray-600">{row._id.slice(-6).toUpperCase()}</span> },
    { header: "Khách hàng", accessor: (row) => row.user?.fullName || "N/A" },
    { header: "Trang phục", accessor: (row) => row.costume?.name || "N/A" },
    { header: "Ngày lấy", accessor: (row) => new Date(row.startDate).toLocaleDateString('vi-VN') },
    { header: "Ngày trả", accessor: (row) => new Date(row.endDate).toLocaleDateString('vi-VN') },
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
    <div className="bg-white rounded-xl shadow-sm border border-[#e8e8e8] p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold text-[#1a1a1a]">Quản lý Đơn Thuê</h1>
      </div>
      
      <div className="overflow-hidden rounded-lg border border-[#e8e8e8]">
        <DataTable columns={columns} data={orders} />
      </div>

      {toast.show && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast({ ...toast, show: false })} 
        />
      )}
    </div>
  );
}