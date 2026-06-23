import {
  faChartPie,
  faUsers,
  faFolder,
  faBox,
  faShirt,
  faBoxes,
  faFileExport, // <- ĐÃ ĐỔI TỪ faFileDown SANG faFileExport
} from "@fortawesome/free-solid-svg-icons";

const ownerSidebar = [
  { path: "/owner", label: "Dashboard", icon: faChartPie, end: true },
  { path: "/owner/accounts/", label: "Quản lý Tài khoản", icon: faUsers },
  { path: "/owner/categories", label: "Danh mục", icon: faFolder },
  { path: "/owner/products", label: "Sản phẩm", icon: faBox },
  { path: "/owner/rentals", label: "Quần áo cho thuê", icon: faShirt },
  { path: "/owner/inventory", label: "Quản lý Kho", icon: faBoxes },
  { path: "/owner/export", label: "Xuất file", icon: faFileExport }, // <- ĐÃ ĐỔI Ở ĐÂY
];

export default ownerSidebar;