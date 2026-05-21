import { Navigate, Outlet } from "react-router-dom";
import { ROUTES } from "./routePaths";
import { useAuth } from "../context/AuthContext";

function PublicRoutes() {
  const { token, loading } = useAuth();

  // Chờ khôi phục session từ localStorage (chống nhấp nháy giao diện khi reload)
  if (loading) {
    return (
      <div className="min-h-screen bg-ghost-fog flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-action-blue"></div>
      </div>
    );
  }

  if (token) {
    return <Navigate to={ROUTES.HOME} replace />;
  }

  return <Outlet />;
}

export default PublicRoutes;