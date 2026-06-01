import { Navigate, Outlet } from "react-router-dom";
import { ROUTES } from "./routePaths";
import { useAuth } from "../context/AuthContext";

function StaffRoutes() {
  const { token, role } = useAuth();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  const isStaff =
    role == "staff";

  if (!isStaff) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

export default StaffRoutes;
