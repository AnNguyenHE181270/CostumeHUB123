import { Outlet, useNavigate } from "react-router-dom";
import Sidebar from "../components/layout/Sidebar";
import { useAuth } from "../context/AuthContext"; // Cập nhật đường dẫn
import { useState, useRef, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown, faSignOutAlt } from "@fortawesome/free-solid-svg-icons";

import ownerSidebar from "../constants/ownerSidebar";
import staffSidebar from "../constants/staffSidebar";

export default function DashboardLayout() {
  const { role, user, logout } = useAuth();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  let currentMenu
  if (role == "owner") {
    currentMenu = ownerSidebar
  }
  if (role == "staff") {
    currentMenu = staffSidebar
  }

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar menuItems={currentMenu} />

      <main className="flex-1 overflow-x-hidden">
        <header className="h-16 bg-white shadow-sm px-6 flex items-center justify-between border-b relative z-10">
          <h1 className="text-xl font-semibold">Luxe Rent Admin</h1>

          {user && (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 text-gray-700 hover:text-gray-900 focus:outline-none"
              >
                <img
                  src={user.avatar || "https://ui-avatars.com/api/?name=" + (user.fullName || "User")}
                  alt="Avatar"
                  className="w-8 h-8 rounded-full border border-gray-200"
                />
                <span className="font-medium">{user.fullName || "Admin"}</span>
                <FontAwesomeIcon icon={faChevronDown} className="text-xs ml-1" />
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 border border-gray-100">
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-50 text-left"
                  >
                    <FontAwesomeIcon icon={faSignOutAlt} className="mr-2" />
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          )}
        </header>
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}