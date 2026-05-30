import { Outlet } from "react-router-dom";
import Sidebar from "../components/layout/Sidebar";
import { useAuth } from "../context/AuthContext"; // Cập nhật đường dẫn

import ownerSidebar from "../constants/ownerSidebar";
import receptionistSidebar from "../constants/receptionistSidebar";

export default function DashboardLayout() {
  const { roles } = useAuth();

  // const currentMenu = user?.role === "owner" ? ownerSidebar : receptionistSidebar;

  let currentMenu
  if(roles.includes("store-owner")){
    currentMenu = ownerSidebar
  }
  if(roles.includes("receptionist")){
    currentMenu = receptionistSidebar
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar menuItems={currentMenu} />

      <main className="flex-1 overflow-x-hidden">
        <header className="h-16 bg-white shadow-sm px-6 flex items-center justify-between border-b">
          <h1 className="text-xl font-semibold">Luxe Rent Admin</h1>
        </header>
        <div className="p-6">
          <Outlet /> 
        </div>
      </main>
    </div>
  );
}