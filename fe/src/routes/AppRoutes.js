import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { ROUTES } from "./routePaths";
import { useAuth } from "../context/AuthContext";

import PublicRoutes from "./PublicRoutes";
import PrivateRoutes from "./PrivateRoutes";

import Register from "../pages/RegisterPage";
import VerifyPage from "../pages/VerifyOtpPage";
import LoginPage from "../pages/LoginPage";
import HomePage from "../pages/HomePage";
import CompleteProfilePage from "../pages/CompleteProfilePage";
import ForgotPasswordPage from "../pages/ForgotPasswordPage";
import ResetPasswordPage from "./../pages/ResetPasswordPage";

function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicRoutes />}>
        <Route path={ROUTES.REGISTER} element={<Register />} />
        <Route path={ROUTES.VERIFY} element={<VerifyPage />} />
        <Route path={ROUTES.LOGIN} element={<LoginPage />} />
        <Route path={ROUTES.FORGOTPASSWORD} element={<ForgotPasswordPage />} />
        <Route path={ROUTES.RESETPASSWORD} element={<ResetPasswordPage />} />
      </Route>

      <Route element={<PrivateRoutes />}>
        <Route path={ROUTES.HOME} element={<HomePage />} />
      </Route>

      <Route element={<PrivateRoutesIgnoreProfileCheck />}>
        <Route path={ROUTES.COMPLETEWITHGOOGLE} element={<CompleteProfilePage />} />
      </Route>

      <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
    </Routes>
  );
}

function PrivateRoutesIgnoreProfileCheck() {
  const { token, loading, isProfileComplete } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-ghost-fog flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-action-blue"></div>
      </div>
    );
  }

  if (!token) return <Navigate to={ROUTES.LOGIN} replace />;
  
  if (isProfileComplete) return <Navigate to={ROUTES.HOME} replace />;

  return <Outlet />;
}

export default AppRoutes;