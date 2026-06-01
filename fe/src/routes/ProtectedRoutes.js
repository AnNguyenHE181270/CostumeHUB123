import { Navigate, Outlet } from "react-router-dom";
import { ROUTES } from "./routePaths";
import { useAuth } from "../context/AuthContext";

function ProtectedRoutes() {
  const { token, loading} = useAuth();

   if (loading) {
    return <div>Loading...</div>;
  }

  if (!token) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  return <Outlet />;
}

export default ProtectedRoutes;