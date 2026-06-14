import { Routes, Route, Navigate } from "react-router-dom";
import PublicRoutes from "./PublicRoutes";
import ProtectedRoutes from "./ProtectedRoutes";
import StaffRoutes from "./StaffRoutes";
import OwnerRoutes from "./OwnerRoutes";

import Register from "../pages/RegisterPage";
import VerifyPage from "../pages/VerifyOtpPage";
import LoginPage from "../pages/LoginPage";
import HomePage from "../pages/HomePage";
import ProductDetailPage from "../pages/ProductDetailPage";
import ForgotPasswordPage from "../pages/ForgotPasswordPage";
import ResetPasswordPage from "../pages/ResetPasswordPage";

import CartPage from "../pages/CartPage";
import ProfilePage from "../pages/ProfilePage";

// Trang của Owner
import StoreOwnerDashboard from "../pages/store-owner/StoreOwnerDashboard";
import AccountsPage from "../pages/store-owner/AccountsPage";
import AccountDetailPage from "../pages/store-owner/AccountDetailPage";
import ProductsPage from "../pages/store-owner/ProductsPage";
import CategoriesPage from "../pages/store-owner/CategoriesPage";

import OrdersPage from "../pages/store-owner/OrdersPage";

// Trang Staff
import StaffDashboard from "../pages/staff/StaffDashboard";
import StaffProductsPage from "../pages/staff/StaffProductsPage";

// Trang Customer
import RentCostumePage from "../pages/customer/RentCostumePage";
import { Checkout } from "../pages/customer/CheckoutPage";
import RentalHistoryPage from "../pages/customer/RentalHistoryPage";
import AddressPage from "../pages/customer/AddressPage";
import DetailAddressPage from "../pages/customer/DetailAddressPage"
import { ROUTES } from "./routePaths";


import DashboardLayout from "../layouts/DashboardLayout";
import MainLayout from "../layouts/MainLayout";
import ProfileLayout from "../layouts/ProfileLayout";


function AppRoutes() {
  return (
    <Routes>

      <Route element={<MainLayout />}>
        <Route path={ROUTES.HOME} element={<HomePage />} />
        <Route path={ROUTES.PRODUCT_DETAIL} element={<ProductDetailPage />} />

        <Route element={<ProtectedRoutes />}>
          <Route path="/cart" element={<CartPage />} />
          <Route path={ROUTES.RENT_COSTUME} element={<RentCostumePage />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/rental-history" element={<RentalHistoryPage />} />

          <Route element={<ProfileLayout />}>
            <Route path={ROUTES.MY_ADDRESS} element={<AddressPage />} />
            <Route path={ROUTES.MY_DETAIL_ADDRESS} element={<DetailAddressPage />} />
            <Route path={ROUTES.MY_PROFILE} element={<ProfilePage />} />
          </Route>
        </Route>
      </Route>


      <Route element={<PublicRoutes />}>
        <Route path={ROUTES.LOGIN} element={<LoginPage />} />
        <Route path={ROUTES.REGISTER} element={<Register />} />
        <Route path={ROUTES.VERIFY} element={<VerifyPage />} />
        <Route path={ROUTES.FORGOTPASSWORD} element={<ForgotPasswordPage />} />
        <Route path={ROUTES.RESETPASSWORD} element={<ResetPasswordPage />} />
      </Route>


      <Route element={<StaffRoutes />}>
        <Route path={ROUTES.STAFF_BASE} element={<DashboardLayout />}>
          <Route index element={<StaffDashboard />} />
          <Route path={ROUTES.STAFF_PRODUCTS} element={<StaffProductsPage />} />
          <Route path={ROUTES.STAFF_ORDERS} element={<OrdersPage />} />
        </Route>
      </Route>

      <Route element={<OwnerRoutes />}>
        <Route path={ROUTES.STORE_OWNER_BASE} element={<DashboardLayout />}>
          <Route index element={<StoreOwnerDashboard />} />
          <Route path={ROUTES.STOR_OWNER_ACCOUNT} element={<AccountsPage />} />

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