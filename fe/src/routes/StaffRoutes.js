import { Navigate, Outlet } from "react-router-dom";
import { ROUTES } from "./routePaths";
import { useAuth } from "../context/AuthContext";

function StaffRoutes() {
  const { token, roles } = useAuth();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  const isStaff =
    roles.includes("receptionist");

  if (!isStaff) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

export default StaffRoutes;
