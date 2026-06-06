import { Routes, Route, Navigate } from "react-router-dom";
import PublicRoutes from "./PublicRoutes";
import ProtectedRoutes from "./ProtectedRoutes";
import StaffRoutes from "./StaffRoutes";
import OwnerRoutes from "./OwnerRoutes";

import Register from "../pages/RegisterPage";
import VerifyPage from "../pages/VerifyOtpPage";
import LoginPage from "../pages/LoginPage";
import HomePage from "../pages/HomePage";
import ForgotPasswordPage from "../pages/ForgotPasswordPage";
import ResetPasswordPage from "../pages/ResetPasswordPage";
import CartPage from "../pages/customer/CartPage";
import ProductDetailPage from "../pages/ProductDetailPage";

// Trang của Owner
import StoreOwnerDashboard from "../pages/store-owner/StoreOwnerDashboard";
import AccountsPage from "../pages/store-owner/AccountsPage";
import AccountDetailPage from "../pages/store-owner/AccountDetailPage";
import ProductsPage from "../pages/store-owner/ProductsPage";
import CategoriesPage from "../pages/store-owner/CategoriesPage";
import OrdersPage from "../pages/store-owner/OrdersPage";
import CreateUserPage from "../pages/store-owner/CreateUserPage";

// Trang Customer
import RentCostumePage from "../pages/customer/RentCostumePage";
import { Checkout } from "../pages/customer/CheckoutPage";
import RentalHistoryPage from "../pages/customer/RentalHistoryPage";
import ProfilePage from "../pages/customer/ProfilePage";

import { ROUTES } from "./routePaths";
import DashboardLayout from "../layouts/DashboardLayout";
import MainLayout from "../layouts/MainLayout";

function AppRoutes() {
  return (
    <Routes>
      {/* ======================================================== */}
      {/* LUỒNG KHÁCH HÀNG: ĐƯỢC BỌC TRONG MAINLAYOUT CÓ NAVBAR    */}
      {/* ======================================================== */}
      <Route element={<MainLayout />}>
        <Route path={ROUTES.HOME} element={<HomePage />} />
        <Route path={ROUTES.PRODUCT_DETAIL} element={<ProductDetailPage />} />

        <Route element={<ProtectedRoutes />}>
          <Route path="/cart" element={<CartPage />} />
          <Route path={ROUTES.RENT_COSTUME} element={<RentCostumePage />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/rental-history" element={<RentalHistoryPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
      </Route>

      {/* ======================================================== */}
      {/* LUỒNG XÁC THỰC (AUTH): KHÔNG CÓ NAVBAR / FOOTER          */}
      {/* ======================================================== */}
      <Route element={<PublicRoutes />}>
        <Route path={ROUTES.LOGIN} element={<LoginPage />} />
        <Route path={ROUTES.REGISTER} element={<Register />} />
        <Route path={ROUTES.VERIFY} element={<VerifyPage />} />
        <Route path={ROUTES.FORGOTPASSWORD} element={<ForgotPasswordPage />} />
        <Route path={ROUTES.RESETPASSWORD} element={<ResetPasswordPage />} />
      </Route>

      {/* ======================================================== */}
      {/* LUỒNG NHÂN VIÊN & QUẢN LÝ: ĐƯỢC BỌC TRONG DASHBOARDLAYOUT  */}
      {/* ======================================================== */}
      <Route element={<StaffRoutes />}>
        <Route path={ROUTES.STAFF_BASE} element={<DashboardLayout />}>
          <Route path={ROUTES.STAFF_ORDERS} element={<OrdersPage />} />
        </Route>
      </Route>

      <Route element={<OwnerRoutes />}>
        <Route path={ROUTES.STORE_OWNER_BASE} element={<DashboardLayout />}>
          <Route index element={<StoreOwnerDashboard />} />
          <Route path={ROUTES.STOR_OWNER_ACCOUNT} element={<AccountsPage />} />
          <Route path={ROUTES.STOR_OWNER_CREATE_ACCOUNT} element={<CreateUserPage />} />
          <Route path={ROUTES.STOR_OWNER_DETAIL_ACCOUNT} element={<AccountDetailPage />} />
          <Route path={ROUTES.STORE_OWNER_CATEGORIES} element={<CategoriesPage />} />
          <Route path={ROUTES.STORE_OWNER_PRODUCTS} element={<ProductsPage />} />
          <Route path={ROUTES.STORE_OWNER_ORDERS} element={<OrdersPage />} />
        </Route>
      </Route>

      {/* 404 Not Found */}
      <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
    </Routes>
  );
}

export default AppRoutes;