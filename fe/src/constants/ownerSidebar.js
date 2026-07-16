import {
  faChartPie,
  faUsers,
  faFolder,
  faBox,
  faShirt,
  faChartLine,
  faFileExport,
  faCircleExclamation,
} from "@fortawesome/free-solid-svg-icons";

const ownerSidebar = [
  { path: "/owner", label: "Dashboard", icon: faChartPie, end: true },
  { path: "/owner/accounts/", label: "Quản lý Tài khoản", icon: faUsers },
  { path: "/owner/categories", label: "Danh mục", icon: faFolder },
  { path: "/owner/products", label: "Sản phẩm", icon: faBox },
  { path: "/owner/rentals", label: "Quần áo cho thuê", icon: faShirt },
  { path: "/owner/revenue", label: "Thống kê Doanh thu", icon: faChartLine },
  { path: "/owner/export", label: "Xuất file", icon: faFileExport },
  { path: "/owner/issues", label: "Xử lý khiếu nại", icon: faCircleExclamation },
];

export default ownerSidebar;