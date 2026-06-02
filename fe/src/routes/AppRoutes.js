import { Routes, Route, Navigate } from "react-router-dom";
import PublicRoutes from "./PublicRoutes";
import ProtectedRoutes from "./ProtectedRoutes";
import StaffRoutes from "./StaffRoutes";
import OwnerRoutes from "./OwnerRoutes";

import Register from "../pages/RegisterPage";
import VerifyPage from "../pages/VerifyOtpPage";
import LoginPage from "../pages/LoginPage";
import HomePage from "../pages/HomePage";
import CategoryPage from "../pages/CategoryPage";
import ProductDetailPage from "../pages/ProductDetailPage";
import CartPage from "../pages/CartPage";
import ForgotPasswordPage from "../pages/ForgotPasswordPage";
import ResetPasswordPage from "../pages/ResetPasswordPage";

// Trang của Owner
import StoreOwnerDashboard from "../pages/store-owner/StoreOwnerDashboard";
import AccountsPage from "../pages/store-owner/AccountsPage";
import ProductsPage from "../pages/store-owner/ProductsPage";
import CategoriesPage from "../pages/store-owner/CategoriesPage";

// === CÁC TRANG BẠN CẦN TẠO THÊM ===
import RentCostumePage from "../pages/customer/RentCostumePage";
import OrdersPage from "../pages/store-owner/OrdersPage"; 

import { ROUTES } from "./routePaths";
import DashboardLayout from "../layouts/DashboardLayout";
import MainLayout from "../layouts/MainLayout";

function AppRoutes() {
  return (
    <Routes>
      {/* Public — Customer pages with Navbar + Footer */}
      <Route element={<MainLayout />}>
        <Route path={ROUTES.HOME} element={<HomePage />} />
        <Route path={ROUTES.CATEGORY} element={<CategoryPage />} />
        <Route path="/products" element={<CategoryPage />} />
        <Route path="/product/:id" element={<ProductDetailPage />} />
      </Route>

      <Route element={<PublicRoutes />}>
        <Route path={ROUTES.LOGIN} element={<LoginPage />} />
        <Route path={ROUTES.REGISTER} element={<Register />} />
        <Route path={ROUTES.VERIFY} element={<VerifyPage />} />
        <Route path={ROUTES.FORGOTPASSWORD} element={<ForgotPasswordPage />} />
        <Route path={ROUTES.RESETPASSWORD} element={<ResetPasswordPage />} />
      </Route>

      {/* User thường (Khách hàng) */}
      <Route element={<ProtectedRoutes />}>
        <Route path="/cart" element={<CartPage />} />
        {/* Nơi khách hàng thực hiện Đặt thuê (MATSL-05-07) */}
        <Route path={ROUTES.RENT_COSTUME} element={<RentCostumePage />} />
      </Route>

      {/* Staff / Lễ tân */}
      <Route element={<StaffRoutes />}>
        <Route path={ROUTES.STAFF_BASE} element={<DashboardLayout />}>
           {/* Nhân viên cũng cần vào xem và đổi trạng thái đơn */}
           <Route path={ROUTES.STAFF_ORDERS} element={<OrdersPage />} />
        </Route>
      </Route>

      {/* Store Owner */}
      <Route element={<OwnerRoutes />}>
        <Route path={ROUTES.STORE_OWNER_BASE} element={<DashboardLayout />}>
          <Route index element={<StoreOwnerDashboard />} />
          <Route path={ROUTES.STOR_OWNER_ACCOUNT} element={<AccountsPage />} />
          <Route path={ROUTES.STORE_OWNER_CATEGORIES} element={<CategoriesPage />} />
          <Route path={ROUTES.STORE_OWNER_PRODUCTS} element={<ProductsPage />} />
          
          {/* Nơi Owner quản lý và duyệt đơn hàng (MATSL-04-08) */}
          <Route path={ROUTES.STORE_OWNER_ORDERS} element={<OrdersPage />} />
        </Route>
      </Route>

      {/* 404 Not Found */}
      <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
    </Routes>
  );
}

export default AppRoutes;