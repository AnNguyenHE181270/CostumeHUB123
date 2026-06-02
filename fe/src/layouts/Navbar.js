import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser,
  faHeart,
  faShoppingBag,
  faBars,
  faTimes,
  faChevronDown,
  faSearch,
} from "@fortawesome/free-solid-svg-icons";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:9999";

/* Static links that always show */
const STATIC_LINKS = [
  { label: "BLOG", href: "/blog" },
  { label: "LIÊN HỆ", href: "/lien-he" },
];

export default function Navbar() {
  const { user, logout, role } = useAuth();
  const { cartCount } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [allCategories, setAllCategories] = useState([]);
  const [parentCategories, setParentCategories] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [debugErr, setDebugErr] = useState("");
  const drawerRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  /* Fetch parent categories from API */
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch(`${API_URL}/api/categories`);
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data = await res.json();
        const allCats = data.categories || [];
        setAllCategories(allCats);
        const parents = allCats.filter((c) => !c.parentId);
        setParentCategories(parents);
      } catch (err) {
        setDebugErr(err.message);
        console.error("Failed to fetch categories:", err);
      }
    };
    fetchCategories();
  }, []);

  // Removed CATEGORY_NAV constant

  /* scroll shadow */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* close mobile on route change */
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  /* close on outside click */
  useEffect(() => {
    if (!mobileOpen) return;
    const handleClick = (e) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target)) {
        setMobileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [mobileOpen]);

  /* lock body scroll when drawer open */
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const isActive = (href) => location.pathname === href;

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchKeyword.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchKeyword.trim())}`);
      setSearchKeyword("");
    }
  };

  const wishlistCount = 0;

  return (
    <header
      className={`sticky top-0 z-50 transition-shadow duration-300 ${
        scrolled ? "shadow-md" : ""
      }`}
    >
      {/* ════════ TIER 1 — Top Banner ════════ */}
      <div className="bg-[#1a1a1a] text-white text-center py-2 px-4">
        <p className="text-[11px] tracking-[0.12em] uppercase font-normal">
          Vận chuyển nhanh | Trả hàng 7 ngày | Hỗ trợ 24/7
        </p>
      </div>

      {/* ════════ TIER 2 — Main Header ════════ */}
      <div className="bg-white border-b border-[#e8e8e8]">
        <div className="mx-auto max-w-[1200px] flex items-center justify-between h-[72px] px-6">
          {/* Left: Quick-links (desktop) */}
          <nav className="hidden lg:flex items-center gap-6 z-50">
            {STATIC_LINKS.map(link => (
              <Link
                key={link.href}
                to={link.href}
                className="text-[12px] tracking-[0.1em] uppercase font-medium text-[#474747] hover:text-[#1a1a1a] transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Mobile: hamburger */}
          <button
            className="lg:hidden w-10 h-10 flex items-center justify-center text-[#1a1a1a]"
            onClick={() => setMobileOpen(true)}
            aria-label="Mở menu"
          >
            <FontAwesomeIcon icon={faBars} className="text-[18px]" />
          </button>

          {/* Center: Logo */}
          <Link
            to="/"
            className="absolute left-1/2 -translate-x-1/2 text-center"
          >
            <h1
              className="text-[#1a1a1a] font-semibold tracking-[0.06em]"
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: "28px",
                lineHeight: 1,
              }}
            >
              CostumeHUB
            </h1>
            <span className="block text-[9px] tracking-[0.2em] uppercase text-[#858585] mt-0.5 font-medium">
              Cho Thuê Trang Phục Cao Cấp
            </span>
          </Link>

          {/* Right: Icons & Search */}
          <div className="flex items-center gap-3">
            {/* Search Bar (Desktop) */}
            <form 
              onSubmit={handleSearch}
              className="hidden lg:flex items-center bg-[#f5f5f5] rounded-full px-4 py-2 border border-transparent focus-within:border-[#e8e8e8] focus-within:bg-white transition-all duration-300"
            >
              <input 
                type="text"
                placeholder="Tìm sản phẩm..."
                className="bg-transparent text-[13px] text-[#1a1a1a] outline-none w-32 focus:w-48 transition-all duration-300 placeholder:text-[#999]"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
              />
              <button type="submit" className="text-[#858585] hover:text-[#1a1a1a] ml-2">
                <FontAwesomeIcon icon={faSearch} className="text-[13px]" />
              </button>
            </form>

            {user ? (
              <div className="relative group">
                <button
                  className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[#f5f5f5] transition-colors"
                  aria-label="Tài khoản"
                >
                  {user.avatar ? (
                    <img src={user.avatar} alt="Avatar" className="w-6 h-6 rounded-full object-cover" />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-[#1a1a1a] text-white flex items-center justify-center text-[10px] font-bold">
                      {user.fullName ? user.fullName.charAt(0).toUpperCase() : "U"}
                    </div>
                  )}
                </button>
                {/* Dropdown Menu */}
                <div className="absolute right-0 top-full pt-2 w-48 hidden group-hover:block z-50">
                  <div className="bg-white border border-[#e8e8e8] shadow-lg rounded-md overflow-hidden">
                    <div className="p-3 border-b border-[#e8e8e8]">
                      <p className="text-sm font-semibold text-[#1a1a1a] truncate">{user.fullName}</p>
                      <p className="text-xs text-[#858585] truncate">{user.email}</p>
                    </div>
                    <div className="py-1">
                      {role === "owner" && (
                        <Link to="/owner" className="block px-4 py-2 text-sm text-[#474747] hover:bg-[#f5f5f5]">
                          Trang Quản Trị
                        </Link>
                      )}
                      {role === "staff" && (
                        <Link to="/staff" className="block px-4 py-2 text-sm text-[#474747] hover:bg-[#f5f5f5]">
                          Trang Nhân Viên
                        </Link>
                      )}
                      <button
                        onClick={logout}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-[#f5f5f5]"
                      >
                        Đăng xuất
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <Link
                to="/login"
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[#f5f5f5] transition-colors"
                aria-label="Tài khoản"
              >
                <FontAwesomeIcon
                  icon={faUser}
                  className="text-[15px] text-[#474747]"
                />
              </Link>
            )}

            <Link
              to="/wishlist"
              className="relative w-10 h-10 flex items-center justify-center rounded-full hover:bg-[#f5f5f5] transition-colors"
              aria-label="Yêu thích"
            >
              <FontAwesomeIcon
                icon={faHeart}
                className="text-[15px] text-[#474747]"
              />
              {wishlistCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-[#1a1a1a] text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                  {wishlistCount}
                </span>
              )}
            </Link>

            <Link
              to="/cart"
              className="relative w-10 h-10 flex items-center justify-center rounded-full hover:bg-[#f5f5f5] transition-colors"
              aria-label="Giỏ hàng"
            >
              <FontAwesomeIcon
                icon={faShoppingBag}
                className="text-[15px] text-[#474747]"
              />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-[#1a1a1a] text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>

      {/* ════════ TIER 3 — REMOVED ════════ */}

      {/* ════════ MOBILE DRAWER ════════ */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[100] lg:hidden">
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/40 animate-fade-in" />

          {/* Drawer */}
          <aside
            ref={drawerRef}
            className="absolute left-0 top-0 h-full w-[300px] max-w-[85vw] bg-white shadow-2xl animate-slide-in-left flex flex-col"
          >
            {/* Drawer header */}
            <div className="flex items-center justify-between px-5 h-[64px] border-b border-[#e8e8e8]">
              <span
                className="text-[20px] font-semibold text-[#1a1a1a] tracking-[0.04em]"
                style={{ fontFamily: "'Cormorant Garamond', serif" }}
              >
                CostumeHUB
              </span>
              <button
                onClick={() => setMobileOpen(false)}
                className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[#f5f5f5] transition-colors"
                aria-label="Đóng menu"
              >
                <FontAwesomeIcon
                  icon={faTimes}
                  className="text-[16px] text-[#474747]"
                />
              </button>
            </div>

            {/* Drawer links */}
            <nav className="flex-1 overflow-y-auto py-4">
              {/* Mobile Search */}
              <div className="px-5 mb-5">
                <form 
                  onSubmit={(e) => {
                    handleSearch(e);
                    setMobileOpen(false);
                  }}
                  className="flex items-center bg-[#f5f5f5] rounded-lg px-4 py-2.5"
                >
                  <input 
                    type="text"
                    placeholder="Tìm kiếm sản phẩm..."
                    className="bg-transparent text-[14px] text-[#1a1a1a] outline-none w-full placeholder:text-[#999]"
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                  />
                  <button type="submit" className="text-[#858585] ml-2">
                    <FontAwesomeIcon icon={faSearch} />
                  </button>
                </form>
              </div>

              <div className="px-5 mb-3">
                <p className="text-[10px] uppercase tracking-[0.15em] text-[#858585] font-medium">
                  Danh mục
                </p>
              </div>
              {parentCategories.map((parent, i) => (
                <div key={parent._id} style={{ animationDelay: `${i * 30}ms` }}>
                  <Link
                    to={`/category/${parent._id}`}
                    className={`
                      flex items-center justify-between px-5 py-3
                      text-[14px] font-medium transition-colors
                      ${
                        location.pathname.includes(parent._id)
                          ? "text-[#1a1a1a] bg-[#f5f5f5]"
                          : "text-[#474747] hover:bg-[#f9f9f9] hover:text-[#1a1a1a]"
                      }
                    `}
                  >
                    {parent.name}
                  </Link>
                </div>
              ))}
              {STATIC_LINKS.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className="flex items-center justify-between px-5 py-3 text-[14px] font-medium text-[#474747] hover:bg-[#f9f9f9] hover:text-[#1a1a1a] transition-colors"
                >
                  {link.label}
                </Link>
              ))}

              {/* Divider */}
              <div className="mx-5 my-4 border-t border-[#e8e8e8]" />

              {/* Extra links */}
              {user ? (
                <>
                  <div className="px-5 py-3 flex items-center gap-3 bg-[#f9f9f9]">
                    {user.avatar ? (
                      <img src={user.avatar} alt="Avatar" className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-[#1a1a1a] text-white flex items-center justify-center text-[12px] font-bold">
                        {user.fullName ? user.fullName.charAt(0).toUpperCase() : "U"}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-[#1a1a1a] truncate">{user.fullName}</p>
                      <p className="text-[11px] text-[#858585] truncate">{user.email}</p>
                    </div>
                  </div>
                  {role === "owner" && (
                    <Link to="/owner" className="flex items-center gap-3 px-5 py-3 text-[14px] text-[#474747] hover:text-[#1a1a1a] hover:bg-[#f9f9f9] transition-colors">
                      Trang Quản Trị
                    </Link>
                  )}
                  {role === "staff" && (
                    <Link to="/staff" className="flex items-center gap-3 px-5 py-3 text-[14px] text-[#474747] hover:text-[#1a1a1a] hover:bg-[#f9f9f9] transition-colors">
                      Trang Nhân Viên
                    </Link>
                  )}
                  <button onClick={logout} className="w-full text-left flex items-center gap-3 px-5 py-3 text-[14px] text-red-600 hover:bg-[#f9f9f9] transition-colors">
                    Đăng xuất
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  className="flex items-center gap-3 px-5 py-3 text-[14px] text-[#474747] hover:text-[#1a1a1a] hover:bg-[#f9f9f9] transition-colors"
                >
                  <FontAwesomeIcon icon={faUser} className="text-[13px] w-5" />
                  Đăng nhập
                </Link>
              )}
              <Link
                to="/wishlist"
                className="flex items-center gap-3 px-5 py-3 text-[14px] text-[#474747] hover:text-[#1a1a1a] hover:bg-[#f9f9f9] transition-colors"
              >
                <FontAwesomeIcon icon={faHeart} className="text-[13px] w-5" />
                Yêu thích
                {wishlistCount > 0 && (
                  <span className="ml-auto bg-[#1a1a1a] text-white text-[10px] font-bold rounded-full min-w-[20px] h-[20px] flex items-center justify-center px-1.5">
                    {wishlistCount}
                  </span>
                )}
              </Link>
              <Link
                to="/cart"
                className="flex items-center gap-3 px-5 py-3 text-[14px] text-[#474747] hover:text-[#1a1a1a] hover:bg-[#f9f9f9] transition-colors"
              >
                <FontAwesomeIcon
                  icon={faShoppingBag}
                  className="text-[13px] w-5"
                />
                Giỏ hàng
                {cartCount > 0 && (
                  <span className="ml-auto bg-[#1a1a1a] text-white text-[10px] font-bold rounded-full min-w-[20px] h-[20px] flex items-center justify-center px-1.5">
                    {cartCount}
                  </span>
                )}
              </Link>
            </nav>

            {/* Drawer footer */}
            <div className="px-5 py-4 border-t border-[#e8e8e8] bg-[#fafafa]">
              <p className="text-[11px] text-[#858585] tracking-[0.05em]">
                Hỗ trợ: (+84) 93 453 0145
              </p>
              <p className="text-[11px] text-[#858585] tracking-[0.05em] mt-1">
                info@costumehub.com
              </p>
            </div>
          </aside>
        </div>
      )}
    </header>
  );
}
