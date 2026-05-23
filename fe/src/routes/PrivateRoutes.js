import { Navigate, Outlet } from "react-router-dom";
import { ROUTES } from "./routePaths";
import { useAuth } from "../context/AuthContext";

function PrivateRoutes() {
  const { token, loading, isProfileComplete, user } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-ghost-fog flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-action-blue"></div>
      </div>
    );
  }

  if (!token) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  if (!isProfileComplete && user?.email) {
    return <Navigate to={`/complete-with-google/${encodeURIComponent(user.email)}`} replace />;
  }

  return <Outlet />;
}

export default PrivateRoutes;