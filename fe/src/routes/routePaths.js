export const ROUTES = {
  // Public Routes
  HOME: "/",
  CATEGORY: "/category/:categoryId",
  LOGIN: "/login",
  REGISTER: "/register",
  VERIFY: "/verify-otp/:email",
  FORGOTPASSWORD: "/forgot-password",
  RESETPASSWORD: "/reset-password/:token",
  MY_PROFILE: "/user/my-profile",
  MY_ADDRESS: "/user/addresses",
  MY_DETAIL_ADDRESS: "/user/address/:id",
  // Customer / Protected Routes (Cần đăng nhập để thuê)
  RENT_COSTUME: "/rent/:costumeId",
  PRODUCT_DETAIL: "/product/:id",

  // Store Owner Routes
  STORE_OWNER_BASE: "/owner", // Dùng cho Layout Route bọc bên ngoài
  STOR_OWNER_ACCOUNT: "accounts",
  STOR_OWNER_DETAIL_ACCOUNT: "accounts/detail-account/:id",

  // Sau này bạn có thể thêm các path khác của Owner ở đây
  STORE_OWNER_PRODUCTS: "products",
  STORE_OWNER_CATEGORIES: "categories",
  STORE_OWNER_ORDERS: "orders",

  // Staff Routes
  STAFF_BASE: "/staff",
  STAFF_ORDERS: "orders",
  STAFF_PRODUCTS: "products",
  // STAFF_DASHBOARD: "/staff/dashboard",
};