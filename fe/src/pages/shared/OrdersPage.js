import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom"; // Import useLocation
import { QRCodeSVG } from "qrcode.react";
import Toast from "../../components/ui/Toast";
import Pagination from "../../components/ui/Pagination";
import DataTable from "../../components/ui/DataTable";
import SearchInput from "../../components/ui/SearchInput";
import rentalService from "../../services/rental.service";
import { OrderTrackingModal } from "../customer/OrderTrackingModal";
import { useAuth } from "../../context/AuthContext"; // Import useAuth để phân quyền
import { ChangeRentalDatesModal } from "./ChangeRentalDatesModal"; // NEW IMPORT
import InspectReturnModal from "../staff/InspectReturnModal"; // NEW IMPORT
import costumeService from "../../services/costume.service";
import { formatPrice, getRentalPriceFactor } from "../../utils/formatters";

const removeAccents = (str) => {
  return str ? str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D') : "";
};

export default function OrdersPage() {
  const { role } = useAuth(); // Lấy role (owner hoặc staff) từ Context
  const navigate = useNavigate(); // Get navigate function
  const location = useLocation(); // Get current location
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
  const [changeRequestTarget, setChangeRequestTarget] = useState(null); // NEW STATE
  const [inspectReturnOrder, setInspectReturnOrder] = useState(null); // NEW STATE

  // Offline Order States
  const [costumesList, setCostumesList] = useState([]);
  const [offlineModalOpen, setOfflineModalOpen] = useState(false);
  const [offlineData, setOfflineData] = useState({
    startDate: "",
    endDate: "",
    customerName: "",
    customerPhone: "",
    customerAddress: "",
    items: [{ costume: "", size: "", quantity: 1, availableSizes: [], searchInput: "", suggestions: [], showSuggestions: false }]
  });
  // Bước xác nhận thanh toán (QR) trước khi thực sự tạo đơn offline — khách xem hoá đơn + quét QR,
  // staff bấm "Đã thanh toán" thì mới gọi API tạo đơn (lúc đó BE tự đánh dấu đã thanh toán + Đang thuê).
  const [paymentPreviewOpen, setPaymentPreviewOpen] = useState(false);
  const [paymentPreview, setPaymentPreview] = useState(null);
  const [confirmingPayment, setConfirmingPayment] = useState(false);

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

  const handleCostumeSearchChange = (index, value) => {
    const newItems = [...offlineData.items];
    newItems[index].searchInput = value;

    // Reset costume and size selection when search query changes
    newItems[index].costume = "";
    newItems[index].size = "";
    newItems[index].availableSizes = [];

    if (value.trim() === "") {
      newItems[index].suggestions = [];
      newItems[index].showSuggestions = false;
    } else {
      const filtered = costumesList.filter(c =>
        removeAccents(c.name).toLowerCase().includes(removeAccents(value).toLowerCase())
      );
      newItems[index].suggestions = filtered.slice(0, 8);
      newItems[index].showSuggestions = true;
    }

    setOfflineData({ ...offlineData, items: newItems });
  };

  const handleSelectCostumeSuggestion = (index, costume) => {
    const newItems = [...offlineData.items];
    newItems[index].costume = costume._id;
    newItems[index].searchInput = costume.name;
    newItems[index].size = "";
    newItems[index].availableSizes = costume.variants?.map(v => v.size) || [];
    newItems[index].suggestions = [];
    newItems[index].showSuggestions = false;
    setOfflineData({ ...offlineData, items: newItems });
  };

  const handleCloseSuggestions = (index) => {
    const newItems = [...offlineData.items];
    newItems[index].showSuggestions = false;
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
      items: [...offlineData.items, { costume: "", size: "", quantity: 1, availableSizes: [], searchInput: "", suggestions: [], showSuggestions: false }]
    });
  };

  const handleRemoveItem = (index) => {
    const newItems = offlineData.items.filter((_, idx) => idx !== index);
    setOfflineData({ ...offlineData, items: newItems });
  };

  // Ngày hôm nay ở local time (không dùng toISOString() để tránh lệch ngày do múi giờ UTC).
  const getTodayStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  // Khoảng số ngày thuê hợp lệ, tính giao của minRentalDays/maxRentalDays của TẤT CẢ trang phục đã chọn —
  // giống cách trang chi tiết sản phẩm ở trang chủ giới hạn ngày thuê theo từng sản phẩm.
  const getRentalDayConstraints = () => {
    const selectedCostumes = offlineData.items
      .filter(item => item.costume)
      .map(item => costumesList.find(c => c._id === item.costume))
      .filter(Boolean);
    if (selectedCostumes.length === 0) return null;
    const minDays = Math.max(...selectedCostumes.map(c => c.minRentalDays || 1));
    const maxDays = Math.min(...selectedCostumes.map(c => c.maxRentalDays || 7));
    return { minDays, maxDays, valid: minDays <= maxDays };
  };

  const hasSelectedItem = offlineData.items.some(item => item.costume && item.size);
  const dayConstraints = getRentalDayConstraints();
  const currentRentalDays = offlineData.startDate && offlineData.endDate
    ? Math.ceil((new Date(offlineData.endDate) - new Date(offlineData.startDate)) / (1000 * 60 * 60 * 24))
    : null;
  const rentalDaysOutOfRange = !!(
    dayConstraints?.valid &&
    currentRentalDays !== null &&
    (currentRentalDays < dayConstraints.minDays || currentRentalDays > dayConstraints.maxDays)
  );

  const resetOfflineForm = () => {
    setOfflineData({
      startDate: "",
      endDate: "",
      customerName: "",
      customerPhone: "",
      customerAddress: "",
      items: [{ costume: "", size: "", quantity: 1, availableSizes: [], searchInput: "", suggestions: [], showSuggestions: false }]
    });
    setPaymentPreview(null);
    setPaymentPreviewOpen(false);
  };

  // Tính lại giá hiển thị ở màn xác nhận thanh toán — dùng đúng công thức backend đang tính
  // (getRentalPriceFactor) để số hiển thị khớp với số tiền thực sự được lưu vào đơn.
  const buildOfflinePreview = (rentalDays) => {
    const factor = getRentalPriceFactor(rentalDays);
    let totalRentalPrice = 0;
    let totalDeposit = 0;
    const items = offlineData.items.map((item) => {
      const costume = costumesList.find(c => c._id === item.costume);
      const pricePerDay = costume?.pricePerDay || 0;
      const deposit = costume?.deposit || costume?.price || 0;
      const lineRental = pricePerDay * factor * item.quantity;
      const lineDeposit = deposit * item.quantity;
      totalRentalPrice += lineRental;
      totalDeposit += lineDeposit;
      return {
        name: costume?.name || item.searchInput || "Sản phẩm",
        size: item.size,
        quantity: item.quantity,
        pricePerDay,
        lineRental,
        lineDeposit,
      };
    });
    return {
      rentalDays,
      items,
      totalRentalPrice,
      totalDeposit,
      totalAmount: totalRentalPrice + totalDeposit,
    };
  };

  // Bước 1: validate form + tính hoá đơn, mở màn xác nhận thanh toán (QR) — CHƯA gọi API tạo đơn.
  const handleReviewOfflineOrder = (e) => {
    e.preventDefault();
    if (!offlineData.startDate || !offlineData.endDate || !offlineData.customerName || !offlineData.customerPhone) {
      setToast({ show: true, message: "Vui lòng điền đầy đủ thông tin bắt buộc!", type: "error" });
      return;
    }
    if (offlineData.items.some(item => !item.costume || !item.size || item.quantity <= 0)) {
      setToast({ show: true, message: "Vui lòng chọn trang phục và size hợp lệ!", type: "error" });
      return;
    }

    const start = new Date(offlineData.startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(offlineData.endDate);
    end.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (start < today) {
      setToast({ show: true, message: "Ngày bắt đầu thuê không được ở trong quá khứ.", type: "error" });
      return;
    }

    const rentalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    if (rentalDays <= 0) {
      setToast({ show: true, message: "Ngày kết thúc thuê phải sau ngày bắt đầu thuê.", type: "error" });
      return;
    }

    for (const item of offlineData.items) {
      const costume = costumesList.find(c => c._id === item.costume);
      if (costume) {
        const minDays = costume.minRentalDays || 1;
        if (rentalDays < minDays) {
          setToast({ show: true, message: `Sản phẩm "${costume.name}" yêu cầu thuê tối thiểu ${minDays} ngày.`, type: "error" });
          return;
        }
        const maxDays = costume.maxRentalDays || 7;
        if (rentalDays > maxDays) {
          setToast({ show: true, message: `Sản phẩm "${costume.name}" giới hạn thuê tối đa ${maxDays} ngày.`, type: "error" });
          return;
        }
      }
    }

    setPaymentPreview(buildOfflinePreview(rentalDays));
    setPaymentPreviewOpen(true);
  };

  // Bước 2: staff bấm "Đã thanh toán" trên màn QR -> mới thực sự tạo đơn. BE tự đánh dấu
  // paymentStatus 'paid' + status 'renting' ngay khi tạo (không cần thêm bước xử lý nào khác).
  const handleConfirmOfflinePayment = async () => {
    try {
      setConfirmingPayment(true);
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
      setToast({ show: true, message: "Thanh toán thành công! Đơn hàng đã được tạo và chuyển sang trạng thái Đang thuê.", type: "success" });
      setOfflineModalOpen(false);
      resetOfflineForm();
      fetchOrders();
    } catch (error) {
      setToast({ show: true, message: error.message || "Tạo đơn hàng offline thất bại", type: "error" });
    } finally {
      setConfirmingPayment(false);
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
  const handleUpdateRentalDates = async (orderId, newStartDate, newEndDate) => {
    try {
      const data = await rentalService.updateRentalDates(orderId, { startDate: newStartDate, endDate: newEndDate });
      setToast({ show: true, message: "Cập nhật ngày thuê thành công!", type: "success" });
      setChangeRequestTarget(null); // Close modal

      // Update selectedOrder if it's the one being modified
      if (selectedOrder && selectedOrder._id === orderId) {
        setSelectedOrder(prev => ({
          ...prev,
          startDate: newStartDate,
          endDate: newEndDate,
          totalRentalPrice: data?.order?.totalRentalPrice || prev.totalRentalPrice,
          totalAmount: data?.order?.totalAmount || prev.totalAmount
        }));
      }

      await fetchOrders(); // Refresh orders list
    } catch (error) {
      setToast({ show: true, message: error.message || "Cập nhật ngày thuê thất bại", type: "error" });
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
                      className="py-1.5 px-3 border border-transparent bg-blue-100 text-blue-700 font-semibold rounded-lg hover:bg-blue-200 transition-colors text-[11px] whitespace-nowrap text-center shadow-sm"
                      onClick={() => setChangeRequestTarget(row)} // NEW: Open change request modal
                    >
                      Yêu cầu thay đổi
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
                      onClick={() => {
                        setInspectReturnOrder(selectedOrder);
                        setSelectedOrder(null);
                      }}
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

      {changeRequestTarget && (
        <ChangeRentalDatesModal
          order={changeRequestTarget}
          onClose={() => setChangeRequestTarget(null)}
          onUpdate={handleUpdateRentalDates}
        />
      )}

      {inspectReturnOrder && (
        <InspectReturnModal
          order={inspectReturnOrder}
          onClose={() => setInspectReturnOrder(null)}
          onSuccess={() => {
            setInspectReturnOrder(null);
            fetchOrders();
          }}
        />
      )}

      {/* MODAL THUÊ OFFLINE TẠI CỬA HÀNG — Bước 1: chọn sản phẩm */}
      {offlineModalOpen && !paymentPreviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4 overflow-y-auto py-10">
          <div className="bg-white rounded-2xl shadow-2xl border border-[#eaeaea] max-w-4xl w-full p-6 relative max-h-[90vh] overflow-y-auto flex flex-col gap-6 animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => { setOfflineModalOpen(false); resetOfflineForm(); }}
              className="absolute top-4 right-4 text-gray-400 hover:text-black text-xl transition-colors w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
            >
              ✕
            </button>

            <div>
              <h2 className="text-xl font-bold text-[#1a1a1a]">Tạo Đơn Thuê Offline Tại Cửa Hàng</h2>
              <p className="text-xs text-[#777] mt-1">Ghi nhận thông tin khách thuê trực tiếp tại quầy và trừ tồn kho tự động.</p>
            </div>

            <form onSubmit={handleReviewOfflineOrder} className="space-y-5">
              {/* 1. Thông tin khách thuê */}
              <div className="bg-gray-50/50 border border-[#eaeaea] rounded-xl p-4 space-y-3">
                <h3 className="text-xs font-bold text-[#999] uppercase tracking-wider">1. Thông tin khách hàng</h3>
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

              {/* 2. Trang phục thuê — chọn trước để biết giới hạn số ngày thuê cho phép */}
              <div className="bg-gray-50/50 border border-[#eaeaea] rounded-xl p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-bold text-[#999] uppercase tracking-wider">2. Danh sách trang phục thuê</h3>
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
                      <div className="flex-1 min-w-[200px] relative">
                        <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">Trang phục *</label>
                        <input
                          type="text"
                          required
                          placeholder="Nhập tên trang phục để tìm..."
                          value={item.searchInput || ""}
                          onChange={e => handleCostumeSearchChange(index, e.target.value)}
                          onFocus={() => {
                            if (item.searchInput && item.searchInput.trim()) {
                              handleCostumeSearchChange(index, item.searchInput);
                            } else {
                              const newItems = [...offlineData.items];
                              newItems[index].suggestions = costumesList.slice(0, 8);
                              newItems[index].showSuggestions = true;
                              setOfflineData({ ...offlineData, items: newItems });
                            }
                          }}
                          onBlur={() => setTimeout(() => handleCloseSuggestions(index), 200)}
                          className="w-full border border-[#eaeaea] rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:border-[#1a1a1a] bg-white"
                        />

                        {item.showSuggestions && item.suggestions && item.suggestions.length > 0 && (
                          <div className="absolute top-full left-0 w-full mt-1 bg-white border border-[#eaeaea] rounded-lg shadow-xl overflow-hidden z-50 max-h-60 overflow-y-auto">
                            <ul>
                              {item.suggestions.map(s => (
                                <li
                                  key={s._id}
                                  className="px-3 py-2 hover:bg-[#fafafa] cursor-pointer flex items-center gap-2 border-b border-[#f5f5f5] last:border-0"
                                  onClick={() => handleSelectCostumeSuggestion(index, s)}
                                >
                                  <img
                                    src={s.images?.[0] || "https://via.placeholder.com/40"}
                                    alt={s.name}
                                    className="w-8 h-8 object-cover rounded bg-[#f5f5f5]"
                                  />
                                  <div className="flex flex-col min-w-0">
                                    <span className="text-xs font-semibold text-[#1a1a1a] truncate">{s.name}</span>
                                    <span className="text-[10px] text-[#999]">{Math.round(s.pricePerDay).toLocaleString('vi-VN')} đ/ngày</span>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
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

              {/* 3. Chọn thời gian — chỉ mở sau khi đã chọn trang phục, giới hạn theo số ngày cho phép của trang phục đó */}
              <div className="bg-gray-50/50 border border-[#eaeaea] rounded-xl p-4 space-y-3">
                <h3 className="text-xs font-bold text-[#999] uppercase tracking-wider">3. Thời gian thuê</h3>

                {!hasSelectedItem ? (
                  <p className="text-xs text-amber-600 font-medium">Vui lòng chọn trang phục ở bước 2 trước khi chọn ngày thuê.</p>
                ) : dayConstraints && !dayConstraints.valid ? (
                  <p className="text-xs text-red-600 font-medium">
                    Các trang phục đã chọn có khoảng ngày thuê tối thiểu/tối đa không giao nhau — vui lòng bỏ bớt hoặc đổi trang phục.
                  </p>
                ) : dayConstraints ? (
                  <p className="text-xs text-blue-600 font-medium">
                    Khoảng thời gian thuê hợp lệ theo trang phục đã chọn: từ {dayConstraints.minDays} đến {dayConstraints.maxDays} ngày.
                  </p>
                ) : null}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Ngày bắt đầu *</label>
                    <input
                      type="date"
                      required
                      disabled={!hasSelectedItem}
                      min={getTodayStr()}
                      value={offlineData.startDate}
                      onChange={e => {
                        const newStart = e.target.value;
                        // Nếu ngày kết thúc đang trước ngày bắt đầu mới thì đẩy theo luôn, tránh khoảng ngày âm.
                        const newEnd = offlineData.endDate && offlineData.endDate < newStart ? newStart : offlineData.endDate;
                        setOfflineData({ ...offlineData, startDate: newStart, endDate: newEnd });
                      }}
                      className="w-full border border-[#eaeaea] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1a1a1a] disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Ngày kết thúc *</label>
                    <input
                      type="date"
                      required
                      disabled={!hasSelectedItem || !offlineData.startDate}
                      min={offlineData.startDate || getTodayStr()}
                      value={offlineData.endDate}
                      onChange={e => setOfflineData({ ...offlineData, endDate: e.target.value })}
                      className="w-full border border-[#eaeaea] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1a1a1a] disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>

                {rentalDaysOutOfRange && (
                  <p className="text-xs text-red-600 font-medium">
                    Đang chọn {currentRentalDays} ngày — cần trong khoảng {dayConstraints.minDays}-{dayConstraints.maxDays} ngày theo trang phục đã chọn.
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 justify-end pt-4 border-t">
                <button
                  type="button"
                  onClick={() => { setOfflineModalOpen(false); resetOfflineForm(); }}
                  className="px-4 py-2 border border-[#eaeaea] hover:bg-[#faf9f7] rounded-xl text-sm font-semibold transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={rentalDaysOutOfRange || (dayConstraints ? !dayConstraints.valid : false)}
                  className="px-5 py-2 bg-[#1a1a1a] hover:bg-[#333] text-white rounded-xl text-sm font-semibold transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Tiếp Tục — Xem Hoá Đơn
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL THUÊ OFFLINE TẠI CỬA HÀNG — Bước 2: xác nhận thanh toán bằng QR */}
      {offlineModalOpen && paymentPreviewOpen && paymentPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4 overflow-y-auto py-10">
          <div className="bg-white rounded-2xl shadow-2xl border border-[#eaeaea] max-w-md w-full p-6 relative max-h-[90vh] overflow-y-auto flex flex-col gap-5 animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setPaymentPreviewOpen(false)}
              disabled={confirmingPayment}
              className="absolute top-4 right-4 text-gray-400 hover:text-black text-xl transition-colors w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 disabled:opacity-40"
            >
              ✕
            </button>

            <div>
              <h2 className="text-xl font-bold text-[#1a1a1a]">Xác Nhận Thanh Toán</h2>
              <p className="text-xs text-[#777] mt-1">
                Khách quét mã QR bên dưới để thanh toán. Sau khi khách thanh toán xong, bấm "Xác nhận đã thanh toán".
              </p>
            </div>

            <div className="bg-gray-50/50 border border-[#eaeaea] rounded-xl p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Khách hàng</span>
                <span className="font-semibold text-[#1a1a1a]">{offlineData.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Số điện thoại</span>
                <span className="font-semibold text-[#1a1a1a]">{offlineData.customerPhone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Thời gian thuê</span>
                <span className="font-semibold text-[#1a1a1a]">{paymentPreview.rentalDays} ngày</span>
              </div>
            </div>

            <div className="border border-[#eaeaea] rounded-xl divide-y divide-[#f0f0f0]">
              {paymentPreview.items.map((item, idx) => (
                <div key={idx} className="p-3 flex items-center justify-between text-sm">
                  <div className="min-w-0">
                    <p className="font-medium text-[#1a1a1a] truncate">{item.name}</p>
                    <p className="text-xs text-gray-500">Size {item.size} • SL {item.quantity} • {formatPrice(item.pricePerDay)}/ngày</p>
                  </div>
                  <span className="font-semibold text-[#1a1a1a] shrink-0 ml-3">{formatPrice(item.lineRental + item.lineDeposit)}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-col items-center gap-3 py-3">
              <div className="p-3 bg-white border border-[#eaeaea] rounded-xl shadow-sm">
                <QRCodeSVG
                  value={`COSTUMEHUB-OFFLINE|${offlineData.customerPhone}|${paymentPreview.totalAmount}`}
                  size={168}
                  level="M"
                  marginSize={2}
                />
              </div>
              <p className="text-[11px] text-gray-400">Mã QR minh hoạ — dùng cho ghi nhận thanh toán tại quầy</p>
            </div>

            <div className="bg-[#faf9f7] border border-[#eaeaea] rounded-xl p-4 space-y-1.5">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Tiền thuê</span>
                <span>{formatPrice(paymentPreview.totalRentalPrice)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Tiền cọc</span>
                <span>{formatPrice(paymentPreview.totalDeposit)}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-[#eaeaea]">
                <span className="font-bold text-[#1a1a1a]">Tổng tiền cần thanh toán</span>
                <span className="font-bold text-lg text-[#1a1a1a]">{formatPrice(paymentPreview.totalAmount)}</span>
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-2 border-t">
              <button
                type="button"
                onClick={() => setPaymentPreviewOpen(false)}
                disabled={confirmingPayment}
                className="px-4 py-2 border border-[#eaeaea] hover:bg-[#faf9f7] rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
              >
                Quay Lại Chỉnh Sửa
              </button>
              <button
                type="button"
                onClick={handleConfirmOfflinePayment}
                disabled={confirmingPayment}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm disabled:opacity-60"
              >
                {confirmingPayment ? "Đang xử lý..." : "Xác Nhận Đã Thanh Toán"}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast.show && (
        <Toast message={toast.message} type={toast.type} isVisible={true} onClose={() => setToast({ ...toast, show: false })} />
      )}
    </div>
  );
}