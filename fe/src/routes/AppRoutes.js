import { Routes, Route, Navigate } from "react-router-dom";
import { ROUTES } from "./routePaths";

import PublicRoutes from "./PublicRoutes";
import PrivateRoutes from "./PrivateRoutes";

import Register from "../pages/RegisterPage";
import VerifyPage from "../pages/VerifyOtpPage";
import LoginPage from "../pages/LoginPage";
import HomePage from "../pages/HomePage";
import ForgotPasswordPage from "../pages/ForgotPasswordPage";
import ResetPasswordPage from "./../pages/ResetPasswordPage";

function AppRoutes() {
  return (
    <Routes>
      {/* 1. Public routes */}
      <Route element={<PublicRoutes />}>
        <Route path={ROUTES.REGISTER} element={<Register />} />
        <Route path={ROUTES.VERIFY} element={<VerifyPage />} />
        <Route path={ROUTES.LOGIN} element={<LoginPage />} />
        <Route path={ROUTES.FORGOTPASSWORD} element={<ForgotPasswordPage />} />
        <Route path={ROUTES.RESETPASSWORD} element={<ResetPasswordPage />} />
      </Route>

      {/* 2. Private routes */}
      <Route element={<PrivateRoutes />}>
        <Route path={ROUTES.HOME} element={<HomePage />} />
      </Route>

      {/* 3. Fallback */}
      <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
    </Routes>
  );
}

export default AppRoutes;