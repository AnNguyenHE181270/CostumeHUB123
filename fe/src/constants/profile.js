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
    path: "/rental-history",
    subMenu: [
      { id: "all", title: "Tất cả", path: "/rental-history?status=all" },
      { id: "pending", title: "Chờ xác nhận", path: "/rental-history?status=pending" },
      { id: "pickup", title: "Chờ lấy hàng", path: "/rental-history?status=pickup" },
      { id: "delivering", title: "Chờ giao hàng", path: "/rental-history?status=delivering" },
      { id: "delivered", title: "Đã giao", path: "/rental-history?status=delivered" },
      { id: "returned", title: "Trả hàng", path: "/rental-history?status=returned" },
      { id: "cancelled", title: "Đã hủy", path: "/rental-history?status=cancelled" }
    ]
  },
  {
    id: "transactions",
    title: "Lịch sử giao dịch",
    role: "all",
    path: "/user/transactions"
  }
];
