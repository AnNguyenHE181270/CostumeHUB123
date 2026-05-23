import { Navigate, Outlet } from "react-router-dom";
import { ROUTES } from "./routePaths";
import { useAuth } from "../context/AuthContext";

function PublicRoutes() {
  const {token} = useAuth();

  if (token) {
    
  }

  return <Outlet />;
}

export default PublicRoutes;