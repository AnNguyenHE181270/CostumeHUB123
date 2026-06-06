export const profile = [
  {
    id: "my-profile",
    title: "Thông tin cá nhân",
    role: "all",
    path: "/user/my-profile"
  },
  {
    id: "address",
    title: "Sổ địa chỉ",
    role: "online-customer",
    path: "/user/addresses"
  },
  {
    id: "orders",
    title: "Đơn đã mua",
    role: "online-customer",
    path: "/user/orders",
    subMenu: [
      { id: "all", title: "Tất cả", path: "/customer/orders?status=all" },
      { id: "pending", title: "Chờ xác nhận", path: "/customer/orders?status=pending" },
      { id: "pickup", title: "Chờ lấy hàng", path: "/customer/orders?status=pickup" },
      { id: "delivering", title: "Chờ giao hàng", path: "/customer/orders?status=delivering" },
      { id: "delivered", title: "Đã giao", path: "/customer/orders?status=delivered" },
      { id: "returned", title: "Trả hàng", path: "/customer/orders?status=returned" },
      { id: "cancelled", title: "Đã hủy", path: "/customer/orders?status=cancelled" }
    ]
  },
  {
    id: "wishlist",
    title: "Danh sách yêu thích",
    role: "online-customer",
    path: "/wishlist"
  }
];
