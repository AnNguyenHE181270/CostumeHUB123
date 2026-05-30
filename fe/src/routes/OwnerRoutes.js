import { Navigate, Outlet } from "react-router-dom";
import { ROUTES } from "./routePaths";
import { useAuth } from "../context/AuthContext";

function OwnerRoutes() {
  const { token, roles, loading } = useAuth();

  // Chưa đăng nhập -> văng ra login
  if (loading) {
    return <div>Loading...</div>;
  }
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  const isOwner = roles?.includes("store-owner"); 

  // Đã đăng nhập nhưng không phải owner -> văng về trang chủ
  if (!isOwner) {
    return <Navigate to="/" replace />; 
  }

  return <Outlet />;
}
export default OwnerRoutes;
