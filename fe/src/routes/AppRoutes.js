import { Routes, Route } from "react-router-dom";
import { ROUTES } from "./routePaths";

import PublicRoutes from "./PublicRoutes";
import PrivateRoutes from "./PrivateRoutes";

import Register from "../pages/RegisterPage";
import VerifyOtpPage from "../pages/VerifyOtpPage";
import LoginPage from "../pages/LoginPage";
import HomePage from "../pages/HomePage";
import CompleteProfilePage from "../pages/CompleteProfilePage";
import ForgotPasswordPage from "../pages/ForgotPasswordPage";
import ResetPasswordPage from './../pages/ResetPasswordPage';

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes: chưa login mới vào được */}
      <Route element={<PublicRoutes />}>
        <Route path={ROUTES.REGISTER} element={<Register />} />
        <Route path={ROUTES.VERIFY} element={<VerifyOtpPage />} />
        <Route path={ROUTES.COMPLETEWITHGOOGLE} element={<CompleteProfilePage/>} />
        <Route path={ROUTES.LOGIN} element={<LoginPage />} />
        <Route path={ROUTES.FORGOTPASSWORD} element={<ForgotPasswordPage/>}/>
        <Route path={ROUTES.RESETPASSWORD} element={<ResetPasswordPage/>}/>
      </Route>

      {/* Private routes: login rồi mới vào được */}
      <Route element={<PrivateRoutes />}>
        <Route path={ROUTES.HOME} element={<HomePage />} />
      </Route>
    </Routes>
  );
}

export default AppRoutes;