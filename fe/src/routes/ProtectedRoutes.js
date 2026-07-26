import { Navigate, Outlet, useLocation } from "react-router-dom";
import { ROUTES } from "./routePaths";
import { useAuth } from "../context/AuthContext";

function ProtectedRoutes() {
  const { token, loading} = useAuth();
  const location = useLocation();

   if (loading) {
    return <div>Loading...</div>;
  }

  if (!token) {
    // Nhớ lại trang khách đang định vào (VD: link "Xem chi tiết hoàn tiền" từ email) — LoginPage đọc
    // lại state.from để tự động điều hướng về đúng trang đó ngay sau khi đăng nhập thành công.
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  return <Outlet />;
}

export default ProtectedRoutes;