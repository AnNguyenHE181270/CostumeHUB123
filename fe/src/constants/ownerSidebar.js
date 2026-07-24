import {
  faChartPie,
  faUsers,
  faFolder,
  faBox,
  faShirt,
  faWarehouse,
  faCircleExclamation,
  faMoneyBillTransfer,
} from "@fortawesome/free-solid-svg-icons";

const ownerSidebar = [
  { 
    path: "/owner", 
    label: "Dashboard", 
    title: "Dashboard", 
    subtitle: "Tổng quan báo cáo, số liệu thống kê của cửa hàng", 
    icon: faChartPie, 
    end: true 
  },
  { 
    path: "/owner/accounts", 
    label: "Quản lý Tài khoản", 
    title: "Quản lý Tài khoản", 
    subtitle: "Quản lý thông tin và quyền truy cập của người dùng trên hệ thống", 
    icon: faUsers 
  },
  { 
    path: "/owner/categories", 
    label: "Danh mục", 
    title: "Quản lý Danh mục", 
    subtitle: "Xem, thêm, sửa, quản lý trạng thái, hoặc ẩn danh mục", 
    icon: faFolder 
  },
  { 
    path: "/owner/products", 
    label: "Sản phẩm", 
    title: "Quản lý Sản phẩm", 
    subtitle: "Xem, thêm, sửa, quản lý trạng thái, hoặc ẩn sản phẩm", 
    icon: faBox 
  },
  { 
    path: "/owner/rentals", 
    label: "Quần áo cho thuê", 
    title: "Quản lý Đơn thuê", 
    subtitle: "Quản lý và kiểm tra danh sách đơn hàng đang được thuê", 
    icon: faShirt 
  },
  {
    path: "/owner/inventory",
    label: "Kho hàng",
    title: "Quản lý Kho hàng",
    subtitle: "Theo dõi tồn kho, ghi nhận nhập/xuất kho và xem lịch sử giao dịch",
    icon: faWarehouse
  },
  {
    path: "/owner/issues",
    label: "Xử lý khiếu nại", 
    title: "Xử lý khiếu nại", 
    subtitle: "Tiếp nhận và giải quyết các phản hồi, sự cố từ khách hàng", 
    icon: faCircleExclamation 
  },
];

export default ownerSidebar;