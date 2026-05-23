import { Routes, Route } from "react-router-dom";
import { ROUTES } from "./routePaths";

import PublicRoutes from "./PublicRoutes";
import PrivateRoutes from "./PrivateRoutes";

import Register from "../pages/RegisterPage";
import VerifyPage from "../pages/VerifyOtpPage";
import LoginPage from "../pages/LoginPage";
import HomePage from "../pages/HomePage";
import ForgotPasswordPage from './../pages/ForgotPasswordPage';
import ResetPasswordPage from './../pages/ResetPasswordPage';

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes: chưa login mới vào được */}
      <Route element={<PublicRoutes />}>
        <Route path={ROUTES.REGISTER} element={<Register />} />
        <Route path={ROUTES.VERIFY} element={<VerifyPage />} />
        <Route path={ROUTES.LOGIN} element={<LoginPage />} />
        <Route path={ROUTES.FORGOTPASSWORD} element={<ForgotPasswordPage/>}/>
        <Route path={ROUTES.RESETPASSWORD} element={<ResetPasswordPage/>}/>
      </Route>
      <Route path={ROUTES.HOME} element={<HomePage />} />
      {/* Private routes: login rồi mới vào được */}
      <Route element={<PrivateRoutes />}>
        {/* <Route path={ROUTES.HOME} element={<HomePage />} /> */}
      </Route>
    </Routes>
  );
}

export default AppRoutes;