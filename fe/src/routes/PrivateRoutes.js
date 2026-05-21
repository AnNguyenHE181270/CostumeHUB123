import { Navigate, Outlet, useLocation } from "react-router-dom";
import { ROUTES } from "./routePaths";
import { useAuth } from "../context/AuthContext";

function PrivateRoutes() {
  const { token, loading, isProfileComplete, user } = useAuth();
  const location = useLocation();

  // Chờ khôi phục session từ localStorage (chống lỗi F5 văng ra ngoài)
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

  const isAtCompleteProfilePage = location.pathname.startsWith("/complete-with-google");

  if (!isProfileComplete && !isAtCompleteProfilePage && user?.email) {
    return <Navigate to={`/complete-with-google/${encodeURIComponent(user.email)}`} replace />;
  }

  if (isProfileComplete && isAtCompleteProfilePage) {
    return <Navigate to={ROUTES.HOME} replace />;
  }

  return <Outlet />;
}

export default PrivateRoutes;