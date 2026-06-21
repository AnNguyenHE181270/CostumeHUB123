import { faCube, faBoxOpen, faTruck, faClock, faCheckCircle, faCircleXmark } from "@fortawesome/free-solid-svg-icons";

export const statusOrder = {
    pending: { label: "Chờ xác nhận", className: "bg-yellow-100 text-yellow-800 border-yellow-200" },
    awaitingPayment: { label: "Chờ thanh toán", className: "bg-orange-100 text-orange-800 border-orange-200" },
    preparing: { label: "Đang xử lý", className: "bg-blue-100 text-blue-800 border-blue-200" },
    delivering: { label: "Đang giao", className: "bg-indigo-100 text-indigo-800 border-indigo-200" },
    delivered: { label: "Đã giao hàng", className: "bg-teal-100 text-teal-800 border-teal-200" },
    renting: { label: "Đang thuê", className: "bg-emerald-100 text-emerald-800 border-emerald-200" },
    completed: { label: "Hoàn tất", className: "bg-gray-100 text-gray-800 border-gray-200" },
    cancelled: { label: "Đã hủy", className: "bg-red-100 text-red-800 border-red-200" },
    overdue: { label: "Quá hạn", className: "bg-red-100 text-red-800 border-red-200" }
};

export const tabs = [
    { id: "all", label: "Tất cả", icon: faCube },
    { id: "pending", label: "Chờ xác nhận", icon: faBoxOpen },
    { id: "delivering", label: "Đang giao", icon: faTruck },
    { id: "renting", label: "Đang thuê", icon: faClock },
    { id: "completed", label: "Hoàn thành", icon: faCheckCircle },
    { id: "cancelled", label: "Đã hủy", icon: faCircleXmark },
];