import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../components/layout/Sidebar";
import { useAuth } from "../context/AuthContext";

import ownerSidebar from "../constants/ownerSidebar";
import staffSidebar from "../constants/staffSidebar";

export default function DashboardLayout() {
  const { role } = useAuth();
  const location = useLocation();

  let currentMenu = [];
  if (role === "owner") {
    currentMenu = ownerSidebar;
  }
  if (role === "staff") {
    currentMenu = staffSidebar;
  }

  // Tìm menu item phù hợp với đường dẫn hiện tại (sắp xếp dài nhất trước để tránh trùng lặp prefix)
  const currentItem = [...currentMenu]
    .sort((a, b) => b.path.length - a.path.length)
    .find((item) => {
      if (item.end) {
        return location.pathname === item.path;
      }
      return location.pathname.startsWith(item.path);
    });

  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar menuItems={currentMenu} />

      <main className="flex-1 h-screen overflow-y-auto overflow-x-hidden flex flex-col">
        {/* Header chung tự động nạp theo trang */}
        {currentItem && (
          <div className="sticky top-0 z-20 bg-white pt-6 pb-4 px-6 border-b border-[#eaeaea]">
            <h2 className="text-2xl font-semibold tracking-tight text-[#1a1a1a]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
              {currentItem.title || currentItem.label}
            </h2>
            {currentItem.subtitle && (
              <p className="text-[#999] text-sm mt-1">
                {currentItem.subtitle}
              </p>
            )}
          </div>
        )}

        <div className="px-6 pb-6 pt-6 flex-1">
          <Outlet />
        </div>
      </main>
    </div>
  );
}