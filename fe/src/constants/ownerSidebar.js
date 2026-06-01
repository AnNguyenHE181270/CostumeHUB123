import {
  faChartPie,
  faUsers,
  faUserCheck,
  faFolder,
  faBox,
  faShirt,
  faChartLine,
  faFileExport, // <- ĐÃ ĐỔI TỪ faFileDown SANG faFileExport
} from "@fortawesome/free-solid-svg-icons";

const ownerSidebar = [
  { path: "/owner", label: "Dashboard", icon: faChartPie, end: true },
  { path: "/owner/accounts/", label: "Quản lý Tài khoản", icon: faUsers },
  { path: "/owner/users-staff", label: "Người dùng & Lễ tân", icon: faUserCheck },
  { path: "/owner/categories", label: "Danh mục", icon: faFolder },
  { path: "/owner/products", label: "Sản phẩm", icon: faBox },
  { path: "/owner/rentals", label: "Quần áo cho thuê", icon: faShirt },
  { path: "/owner/revenue", label: "Thống kê Doanh thu", icon: faChartLine },
  { path: "/owner/export", label: "Xuất file", icon: faFileExport }, // <- ĐÃ ĐỔI Ở ĐÂY
];

export default ownerSidebar;