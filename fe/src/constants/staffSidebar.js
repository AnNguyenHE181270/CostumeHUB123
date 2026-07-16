import { 
  faHouse, 
  faRightLeft, 
  faCalendarCheck, 
  faUsers, 
  faBox, 
  faCircleExclamation 
} from "@fortawesome/free-solid-svg-icons";

const staffSidebar = [
  { 
    path: "/staff", 
    label: "Tổng quan", 
    title: "Tổng quan", 
    subtitle: "Tổng quan các số liệu và hoạt động của nhân viên", 
    icon: faHouse, 
    end: true 
  },
  { 
    path: "/staff/products", 
    label: "Tra cứu sản phẩm", 
    title: "Tra cứu Sản phẩm", 
    subtitle: "Tìm kiếm thông tin, trạng thái và chi tiết sản phẩm", 
    icon: faBox 
  },
  { 
    path: "/staff/rentals", 
    label: "Cho thuê & Trả đồ", 
    title: "Cho thuê & Trả đồ", 
    subtitle: "Quản lý quy trình cho thuê trang phục và trả đồ của khách hàng", 
    icon: faRightLeft 
  },
  { 
    path: "/staff/appointments", 
    label: "Lịch hẹn", 
    title: "Quản lý Lịch hẹn", 
    subtitle: "Theo dõi và quản lý các lịch hẹn thử đồ của khách hàng", 
    icon: faCalendarCheck 
  },
  { 
    path: "/staff/customers", 
    label: "Khách hàng", 
    title: "Danh sách Khách hàng", 
    subtitle: "Quản lý danh sách khách hàng và lịch sử giao dịch", 
    icon: faUsers 
  },
  { 
    path: "/staff/issues", 
    label: "Xử lý khiếu nại", 
    title: "Xử lý khiếu nại", 
    subtitle: "Xem và xử lý các khiếu nại hoặc sự cố phát sinh từ đơn thuê", 
    icon: faCircleExclamation 
  },
];

export default staffSidebar;