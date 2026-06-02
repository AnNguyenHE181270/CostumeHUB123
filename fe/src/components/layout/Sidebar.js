import { useMemo, useState, useRef, useEffect } from "react"; // Thêm useRef, useEffect
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars, faChevronLeft, faSignOutAlt, faSearch } from "@fortawesome/free-solid-svg-icons";
import NavLinkSideBar from "../ui/NavLinkSideBar";

export default function Sidebar({ menuItems }) { // Nhận props menuItems
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [collapsed, setCollapsed] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  const searchInputRef = useRef(null); // Dùng để tự động focus vào ô search

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const filteredMenu = useMemo(() => {
    return menuItems.filter((item) =>
      item.label.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, menuItems]);

  // Khi sidebar được mở rộng, tự động focus vào ô search
  useEffect(() => {
    if (!collapsed && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [collapsed]);

  return (
    <aside
      className={`sticky top-0 h-screen bg-white border-r shadow-sm transition-all duration-300 flex flex-col ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      <div className="p-4 border-border">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div>
              <h1 className="font-bold text-lg">Luxe Rent</h1>
              <p className="text-sm text-gray-500">{user?.name}</p>
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

      <div className="p-3 border-t">
        <button
          onClick={handleLogout}
          className="w-full bg-red-500 text-white py-3 rounded-xl flex items-center justify-center gap-3 hover:bg-red-600"
        >
          <FontAwesomeIcon icon={faSignOutAlt} />
          {!collapsed && <span>Đăng xuất</span>}
        </button>
      </div>
    </aside>
  );
}