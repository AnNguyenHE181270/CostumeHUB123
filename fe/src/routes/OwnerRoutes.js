import { Navigate, Outlet } from "react-router-dom";
import { ROUTES } from "./routePaths";
import { useAuth } from "../context/AuthContext";

function OwnerRoutes() {
  const { token, role, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  const isOwner = role == "owner"; 

  if (!isOwner) {
    return <Navigate to="/" replace />; 
  }

  return <Outlet />;
}
export default OwnerRoutes;
