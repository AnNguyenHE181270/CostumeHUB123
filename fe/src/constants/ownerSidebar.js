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
  { path: "/store-owner", label: "Dashboard", icon: faChartPie, end: true },
  { path: "/store-owner/accounts", label: "Quản lý Tài khoản", icon: faUsers },
  { path: "/store-owner/users-staff", label: "Người dùng & Lễ tân", icon: faUserCheck },
  { path: "/store-owner/categories", label: "Danh mục", icon: faFolder },
  { path: "/store-owner/products", label: "Sản phẩm", icon: faBox },
  { path: "/store-owner/rentals", label: "Quần áo cho thuê", icon: faShirt },
  { path: "/store-owner/revenue", label: "Thống kê Doanh thu", icon: faChartLine },
  { path: "/store-owner/export", label: "Xuất file", icon: faFileExport }, // <- ĐÃ ĐỔI Ở ĐÂY
];

export default ownerSidebar;