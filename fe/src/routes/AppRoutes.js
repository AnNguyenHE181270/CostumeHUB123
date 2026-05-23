import { Routes, Route, Navigate } from "react-router-dom";
import { ROUTES } from "./routePaths";

import PublicRoutes from "./PublicRoutes";
import PrivateRoutes from "./PrivateRoutes";

import Register from "../pages/RegisterPage";
import VerifyOtpPage from "../pages/VerifyOtpPage";
import LoginPage from "../pages/LoginPage";
import HomePage from "../pages/HomePage";
import CompleteProfilePage from "../pages/CompleteProfilePage";
import ForgotPasswordPage from "../pages/ForgotPasswordPage";
import ResetPasswordPage from "./../pages/ResetPasswordPage";
import { useAuth } from "../context/AuthContext";

function AppRoutes() {

  const {isProfileComplete} = useAuth()
  return (


    <Routes>
      <Route element={<PublicRoutes />}>
        <Route path={ROUTES.REGISTER} element={<Register />} />
        <Route path={ROUTES.VERIFY} element={<VerifyOtpPage />} />
        <Route path={ROUTES.LOGIN} element={<LoginPage />} />
        <Route path={ROUTES.FORGOTPASSWORD} element={<ForgotPasswordPage />} />
        <Route path={ROUTES.RESETPASSWORD} element={<ResetPasswordPage />} />
      </Route>

      {/* 2. Trang chủ ai cũng vào được (Không bị bọc bởi PublicRoutes
  nữa) */}
      <Route path={ROUTES.HOME} element={<HomePage />} />

      {/* 3. Nhóm yêu cầu BẮT BUỘC phải đăng nhập mới vào được */}
      <Route element={<PrivateRoutes />}>
        
        <Route
          path={ROUTES.COMPLETEWITHGOOGLE}
          element={<CompleteProfilePage />}
        />
      </Route>
      <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
    </Routes>
  );
}

export default AppRoutes;
