import { faCube, faBoxOpen, faTruck, faRotateLeft, faClock, faCheckCircle, faCircleXmark, faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";

export const statusOrder = {
    pending: { label: "Chờ xác nhận", className: "bg-yellow-100 text-yellow-800 border-yellow-200" },
    delivering: { label: "Đang vận chuyển", className: "bg-indigo-100 text-indigo-800 border-indigo-200" },
    delivered: { label: "Đã giao hàng", className: "bg-teal-100 text-teal-800 border-teal-200" },
    renting: { label: "Đang thuê", className: "bg-emerald-100 text-emerald-800 border-emerald-200" },
    completed: { label: "Hoàn tất", className: "bg-gray-100 text-gray-800 border-gray-200" },
    cancelled: { label: "Đã hủy", className: "bg-red-100 text-red-800 border-red-200" },
    // Màu cam đậm — cố tình KHÁC tông đỏ của "cancelled" vì ý nghĩa trái ngược nhau
    // (quá hạn cần khách hành động ngay; đã hủy là trạng thái kết thúc, không cần làm gì thêm).
    overdue: { label: "Quá hạn", className: "bg-orange-100 text-orange-800 border-orange-300" },
    returning: { label: "Đang trả hàng", className: "bg-purple-100 text-purple-800 border-purple-200" }
};

export const tabs = [
    { id: "all", label: "Tất cả", icon: faCube },
    { id: "pending", label: "Chờ xác nhận", icon: faBoxOpen },
    { id: "delivering", label: "Đang giao đến bạn", icon: faTruck },
    { id: "returning", label: "Đang trả hàng", icon: faRotateLeft },
    { id: "renting", label: "Đang thuê", icon: faClock },
    { id: "overdue", label: "Quá hạn", icon: faTriangleExclamation },
    { id: "completed", label: "Đã thuê", icon: faCheckCircle },
    { id: "cancelled", label: "Đã hủy", icon: faCircleXmark },
];