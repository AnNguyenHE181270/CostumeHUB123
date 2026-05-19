import { Routes, Route } from "react-router-dom";
import { ROUTES } from "./routePaths";

import PublicRoutes from "./PublicRoutes";
import PrivateRoutes from "./PrivateRoutes";

import Register from "../pages/RegisterPage";
import VerifyOtpPage from "../pages/VerifyOtpPage";
// import LoginPage from "../pages/Auth/LoginPage";
import HomePage from "../pages/HomePage";
import CompleteProfilePage from "../pages/CompleteProfilePage";

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes: chưa login mới vào được */}
      <Route element={<PublicRoutes />}>
        <Route path={ROUTES.REGISTER} element={<Register />} />
        <Route path={ROUTES.VERIFY} element={<VerifyOtpPage />} />
        <Route path={ROUTES.COMPLETEWITHGOOGLE} element={<CompleteProfilePage/>} />
        {/* <Route path={ROUTES.LOGIN} element={<LoginPage />} /> */}
      </Route>

      {/* Private routes: login rồi mới vào được */}
      <Route element={<PrivateRoutes />}>
        <Route path={ROUTES.HOME} element={<HomePage />} />
      </Route>
    </Routes>
  );
}

export default AppRoutes;