export const ROUTES = {
  // Public Routes
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  VERIFY: "/verify-otp/:email",
  FORGOTPASSWORD: "/forgot-password",
  RESETPASSWORD: "/reset-password/:token",

  // Store Owner Routes
  STORE_OWNER_BASE: "/store-owner", // Dùng cho Layout Route bọc bên ngoài
  STOR_OWNER_ACCOUNT: "accounts"
  
  // Sau này bạn có thể thêm các path khác của Owner ở đây
  // STORE_OWNER_PRODUCTS: "/store-owner/products",
  // STORE_OWNER_ORDERS: "/store-owner/orders",

  // Staff Routes
  // STAFF_BASE: "/staff",
  // STAFF_DASHBOARD: "/staff/dashboard",
};