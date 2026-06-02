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
import StoreOwnerDashboard from "../pages/store-owner/StoreOwnerDashboard";
import AccountsPage from "../pages/store-owner/AccountsPage";
import ProductsPage from "../pages/store-owner/ProductsPage";
import CategoriesPage from "../pages/store-owner/CategoriesPage";

import { ROUTES } from "./routePaths";
import DashboardLayout from "../layouts/DashboardLayout";

import MainLayout from "../layouts/MainLayout";
import { Checkout } from "../pages/customer/CheckoutPage";

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path={ROUTES.HOME} element={<HomePage />} />

      <Route element={<PublicRoutes />}>
        <Route path={ROUTES.LOGIN} element={<LoginPage />} />
        <Route path={ROUTES.REGISTER} element={<Register />} />
        <Route path={ROUTES.VERIFY} element={<VerifyPage />} />
        <Route path={ROUTES.FORGOTPASSWORD} element={<ForgotPasswordPage />} />
        <Route path={ROUTES.RESETPASSWORD} element={<ResetPasswordPage />} />
      </Route>

      {/* User thường */}
      <Route element={<ProtectedRoutes />}>

        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<Checkout />} />
      </Route>

      {/* Staff / Lễ tân */}
      <Route element={<StaffRoutes />}>
        {/* <Route path={ROUTES.STAFF_DASHBOARD} element={<StaffDashboard />} /> */}
      </Route>

      {/* Store Owner */}
      <Route element={<OwnerRoutes />}>
        {/* Route cha bọc Layout */}
        <Route path={ROUTES.STORE_OWNER_BASE} element={<DashboardLayout />}>

          <Route index element={<StoreOwnerDashboard />} />

          <Route path={ROUTES.STOR_OWNER_ACCOUNT} element={<AccountsPage />} />
          <Route path={ROUTES.STOR_OWNER_DETAIL_ACCOUNT} element={<AccountDetailPage />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path={ROUTES.STORE_OWNER_PRODUCTS} element={<ProductsPage />} />
          {/* <Route path="rentals" element={<RentalsPage />} /> */}
          {/* <Route path="revenue" element={<RevenuePage />} /> */}
          {/* <Route path="export" element={<ExportPage />} /> */}

        </Route>
      </Route>

      {/* 404 Not Found */}
      <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
    </Routes>
  );
}

export default AppRoutes;