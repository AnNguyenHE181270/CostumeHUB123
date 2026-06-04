import { useState, useEffect } from "react";
import DataTable from "../../components/ui/DataTable";
import Toast from "../../components/ui/Toast";

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  const fetchOrders = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/rentals`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
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
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/rentals/${id}/status`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json", 
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (res.ok) {
        setToast({ show: true, message: "Cập nhật trạng thái thành công!", type: "success" });
        fetchOrders(); // Refresh bảng
      }
    } catch (error) {
      setToast({ show: true, message: "Lỗi cập nhật", type: "error" });
    }
  };

  const columns = [
    { header: "Mã Đơn", accessor: (row) => row._id.slice(-6).toUpperCase() },
    { header: "Khách hàng", accessor: (row) => row.user?.fullName || "N/A" },
    { header: "Trang phục", accessor: (row) => row.costume?.name || "N/A" },
    { header: "Ngày lấy", accessor: (row) => new Date(row.startDate).toLocaleDateString() },
    { header: "Ngày trả", accessor: (row) => new Date(row.endDate).toLocaleDateString() },
    { 
      header: "Trạng thái", 
      accessor: (row) => (
        <select 
          value={row.status} 
          onChange={(e) => updateStatus(row._id, e.target.value)}
          className={`border p-1.5 rounded text-sm font-medium outline-none
            ${row.status === 'completed' ? 'bg-green-100 text-green-700' : ''}
            ${row.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : ''}
          `}
        >
          <option value="pending">Chờ xử lý</option>
          <option value="confirmed">Đã xác nhận</option>
          <option value="picked_up">Đang thuê (Đã lấy)</option>
          <option value="returned">Đã trả (Chờ kiểm tra)</option>
          <option value="completed">Hoàn tất</option>
          <option value="cancelled">Đã hủy</option>
        </select>
      )
    }
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold text-gray-800">Quản lý Đơn Thuê</h1>
      </div>
      
      {/* Gọi component bảng có sẵn của team */}
      <DataTable columns={columns} data={orders} />

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