import { Outlet, useNavigate, Link } from "react-router-dom";
import Sidebar from "../components/layout/Sidebar";
import { useAuth } from "../context/AuthContext"; // Cập nhật đường dẫn
import { useState, useRef, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown, faUser } from "@fortawesome/free-solid-svg-icons";

import ownerSidebar from "../constants/ownerSidebar";
import staffSidebar from "../constants/staffSidebar";

export default function DashboardLayout() {
  const { role, user, logout } = useAuth();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  let currentMenu
  if (role === "owner") {
    currentMenu = ownerSidebar
  }
  if (role === "staff") {
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
    <div className="flex min-h-screen bg-surface">
      <Sidebar menuItems={currentMenu} />

      <main className="flex-1 overflow-x-hidden">
        <header className="h-[72px] bg-white border-b border-[#eaeaea] shadow-[0_2px_4px_rgba(0,0,0,0.02)] px-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-[#1a1a1a]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Admin Portal</h1>

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
                  <Link
                    to="/profile"
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 text-left"
                  >
                    <FontAwesomeIcon icon={faUser} className="mr-2" />
                    Hồ Sơ Của Tôi
                  </Link>
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