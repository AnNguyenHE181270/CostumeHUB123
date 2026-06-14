import { Navigate, Outlet } from "react-router-dom";
import { ROUTES } from "./routePaths";
import { useAuth } from "../context/AuthContext";

function StaffRoutes() {
  const { token, role, loading } = useAuth(); // Thêm loading

  if (loading) {
    return <div>Loading...</div>; // Chờ tải xong thông tin mới check quyền
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  const isStaff = role == "staff";

  if (!isStaff) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

export default StaffRoutes;