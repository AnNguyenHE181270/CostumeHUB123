import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars, faChevronLeft, faSignOutAlt } from "@fortawesome/free-solid-svg-icons";
import NavLinkSideBar from "../ui/NavLinkSideBar";
import logoImg from "../../assets/logo.png";

export default function Sidebar({ menuItems }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [collapsed, setCollapsed] = useState(true);
  const sidebarRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!collapsed && sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        setCollapsed(true);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [collapsed]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <aside
      ref={sidebarRef}
      className={`sticky top-0 h-screen bg-white border-r border-[#eaeaea] shadow-sm transition-all duration-300 flex flex-col z-50 ${collapsed ? "w-20" : "w-64"
        }`}
    >
      {/* Header section */}
      <div className="p-4 border-b border-[#eaeaea] relative flex items-center justify-center">
        {!collapsed ? (
          <div className="relative w-full flex items-center justify-center">
            <img
              src={logoImg}
              alt="CostumeHUB"
              onClick={() => navigate("/")}
              title="Về trang chủ"
              className="h-14 w-auto object-contain cursor-pointer hover:scale-105 transition-transform"
            />
            <button
              onClick={() => setCollapsed(true)}
              className="absolute right-0 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg hover:bg-surface flex items-center justify-center text-gray-500"
              title="Thu gọn"
            >
              <FontAwesomeIcon icon={faChevronLeft} className="text-sm" />
            </button>
          </div>
        ) : (
          <div className="flex justify-center w-full">
            <button
              onClick={() => setCollapsed(false)}
              className="w-10 h-10 rounded-lg hover:bg-surface flex items-center justify-center text-gray-500"
              title="Mở rộng"
            >
              <FontAwesomeIcon icon={faBars} />
            </button>
          </div>
        )}
      </div>

      {/* Navigation menu */}
      <nav className="flex-1 p-3 space-y-2 overflow-y-auto">
        {menuItems.map((item) => (
          <NavLinkSideBar key={item.path} item={item} collapsed={collapsed} />
        ))}
      </nav>

      {/* Footer with Profile and Logout button next to each other */}
      <div className="p-3 border-t flex flex-col gap-3">
        <div className="w-full text-gray-700 py-3 flex flex-col items-center justify-center gap-2 px-2">
          {/* Clickable Profile Card (Avatar, Name, and Role all link to profile) */}
          <div
            onClick={() => navigate("/user/my-profile")}
            className="cursor-pointer hover:scale-105 transition-transform flex flex-col items-center justify-center"
            title="Hồ sơ cá nhân"
          >
            {user?.avatar ? (
              <div className="w-12 h-12 rounded-full overflow-hidden border border-gray-200 shrink-0 aspect-square">
                <img
                  src={user.avatar}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-full bg-[#1a1a1a] text-[#f5e6ca] flex items-center justify-center text-xs font-bold shrink-0 border border-gray-200 aspect-square">
                {user?.fullName ? user.fullName.split(" ").pop().substring(0, 2).toUpperCase() : "U"}
              </div>
            )}
          </div>

          {!collapsed && (
            <div className="flex items-center justify-center gap-2.5 mt-1.5 w-full pl-6">
              {/* Clickable Name and Role Block */}
              <div
                onClick={() => navigate("/user/my-profile")}
                className="text-center min-w-0 flex-1 cursor-pointer hover:opacity-85 transition-opacity"
                title="Hồ sơ cá nhân"
              >
                <p className="text-sm font-bold text-gray-900 truncate">
                  {user?.fullName || "Người dùng"}
                </p>
                <p className="text-[10px] text-[#b8935a] font-semibold uppercase tracking-wider mt-0.5">
                  {user?.role === "owner" ? "Chủ cửa hàng" : user?.role === "staff" ? "Nhân viên" : user?.role || "Thành viên"}
                </p>
              </div>
              {/* Logout button next to both name and role */}
              <button
                onClick={handleLogout}
                className="text-black hover:opacity-75 transition-opacity p-1 text-sm shrink-0 mr-4"
                title="Đăng xuất"
              >
                <FontAwesomeIcon icon={faSignOutAlt} />
              </button>
            </div>
          )}

          {collapsed && (
            <button
              onClick={handleLogout}
              className="text-black hover:opacity-75 transition-opacity p-2 text-sm mt-1"
              title="Đăng xuất"
            >
              <FontAwesomeIcon icon={faSignOutAlt} />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}