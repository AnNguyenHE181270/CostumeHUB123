import { faHouse, faRightLeft, faCalendarCheck, faUsers } from "@fortawesome/free-solid-svg-icons";

const receptionistSidebar = [
  { path: "/receptionist", label: "Tổng quan", icon: faHouse, end: true },
  { path: "/receptionist/rentals", label: "Cho thuê & Trả đồ", icon: faRightLeft },
  { path: "/receptionist/appointments", label: "Lịch hẹn", icon: faCalendarCheck },
  { path: "/receptionist/customers", label: "Khách hàng", icon: faUsers },
];
export default receptionistSidebar;