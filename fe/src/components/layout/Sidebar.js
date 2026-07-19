import React, { useMemo, useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars, faChevronLeft, faSignOutAlt, faSearch, faUser } from "@fortawesome/free-solid-svg-icons";
import NavLinkSideBar from "../ui/NavLinkSideBar";
import logoImg from "../../assets/logo.png";

export default function Sidebar({ menuItems }) { // Nhận props menuItems
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [collapsed, setCollapsed] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  const searchInputRef = useRef(null); // Dùng để tự động focus vào ô search
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

  const filteredMenu = useMemo(() => {
    return menuItems.filter((item) =>
      item.label.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, menuItems]);

  useEffect(() => {
    if (!collapsed && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [collapsed]);

  return (
    <aside
      ref={sidebarRef}
      className={`sticky top-0 h-screen bg-white border-r border-[#eaeaea] shadow-sm transition-all duration-300 flex flex-col z-50 ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      <div className="p-4 border-b border-[#eaeaea]">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div>
              <img
                src={logoImg}
                alt="CostumeHUB"
                onClick={() => navigate("/")}
                title="Về trang chủ"
                className="h-9 w-auto object-contain cursor-pointer hover:scale-105 transition-transform"
              />
              <p className="text-[9px] uppercase tracking-[0.2em] text-[#858585] mt-1 font-medium">{user?.fullName || "Admin"}</p>
            </div>
          )}

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-10 h-10 rounded-lg hover:bg-surface flex items-center justify-center"
          >
            <FontAwesomeIcon icon={collapsed ? faBars : faChevronLeft} />
          </button>
        </div>

        {collapsed ? (
          <div className="mt-4 flex justify-center">
            <button
              onClick={() => setCollapsed(false)}
              className="w-10 h-10 rounded-lg hover:bg-surface flex items-center justify-center text-gray-500"
              title="Tìm kiếm"
            >
              <FontAwesomeIcon icon={faSearch} className="text-lg" />
            </button>
          </div>
        ) : (
          <div className="relative mt-4">
            <FontAwesomeIcon
              icon={faSearch}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Tìm menu..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        )}
      </div>

      <nav className="flex-1 p-3 space-y-2 overflow-y-auto">
        {filteredMenu.length > 0
          ? filteredMenu.map((item) => (
              <NavLinkSideBar key={item.path} item={item} collapsed={collapsed} />
            ))
          : !collapsed && (
              <p className="text-center text-sm text-gray-400 mt-4">
                Không tìm thấy menu
              </p>
            )}
      </nav>

      <div className="p-3 border-t flex flex-col gap-2">
        <button
          onClick={() => navigate("/user/my-profile")}
          className="w-full text-gray-700 py-3 rounded-xl flex items-center justify-center gap-3 hover:bg-gray-100 transition-colors"
          title="Hồ sơ của tôi"
        >
          <FontAwesomeIcon icon={faUser} />
          {!collapsed && <span>Hồ sơ của tôi</span>}
        </button>
        <button
          onClick={handleLogout}
          className="w-full bg-red-500 text-white py-3 rounded-xl flex items-center justify-center gap-3 hover:bg-red-600 transition-colors"
          title="Đăng xuất"
        >
          <FontAwesomeIcon icon={faSignOutAlt} />
          {!collapsed && <span>Đăng xuất</span>}
        </button>
      </div>
    </aside>
  );
}