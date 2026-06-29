import { faHouse, faRightLeft, faCalendarCheck, faUsers, faBox, faMessage } from "@fortawesome/free-solid-svg-icons";

const staffSidebar = [
  { path: "/staff", label: "Tổng quan", icon: faHouse, end: true },
  { path: "/staff/products", label: "Tra cứu sản phẩm", icon: faBox },
  { path: "/staff/rentals", label: "Cho thuê & Trả đồ", icon: faRightLeft },
  { path: "/staff/appointments", label: "Lịch hẹn", icon: faCalendarCheck },
  { path: "/staff/customers", label: "Khách hàng", icon: faUsers },
  { path: "/staff/chat", label: "Tin nhắn hỗ trợ", icon: faMessage },
];
export default staffSidebar;