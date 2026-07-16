import { Outlet } from "react-router-dom";
import Sidebar from "../components/layout/Sidebar";
import { useAuth } from "../context/AuthContext";

import ownerSidebar from "../constants/ownerSidebar";
import staffSidebar from "../constants/staffSidebar";

export default function DashboardLayout() {
  const { role } = useAuth();

  let currentMenu;
  if (role === "owner") {
    currentMenu = ownerSidebar;
  }
  if (role === "staff") {
    currentMenu = staffSidebar;
  }

  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar menuItems={currentMenu} />

      <main className="flex-1 h-screen overflow-y-auto overflow-x-hidden">
        <div className="px-6 pb-6 pt-0">
          <Outlet />
        </div>
      </main>
    </div>
  );
}