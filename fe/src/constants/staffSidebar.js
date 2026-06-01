import { faHouse, faRightLeft, faCalendarCheck, faUsers } from "@fortawesome/free-solid-svg-icons";

const staffSidebar = [
  { path: "/staff", label: "Tổng quan", icon: faHouse, end: true },
  { path: "/staff/rentals", label: "Cho thuê & Trả đồ", icon: faRightLeft },
  { path: "/staff/appointments", label: "Lịch hẹn", icon: faCalendarCheck },
  { path: "/staff/customers", label: "Khách hàng", icon: faUsers },
];
export default staffSidebar;