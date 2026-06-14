import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faShoppingBag, faBars, faTimes } from "@fortawesome/free-solid-svg-icons";
import SearchBar from "../customer/SearchBar";

export default function Header() {
  const { user, role, logout } = useAuth();
  const { cartCount } = useCart();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const profileDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const NAV_LINKS = [
    { label: "TRANG PHỤC", href: "/products" },
    { label: "BỘ SƯU TẬP", href: "/collections" },
    { label: "VỀ CHÚNG TÔI", href: "/about" },
  ];

  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const API_URL = process.env.REACT_APP_API_URL || "http://localhost:9999";
        const res = await fetch(`${API_URL}/api/categories?all=true`);
        if (res.ok) {
          const data = await res.json();
          const cats = data.categories || [];
          
          // Build tree
          const parents = cats.filter(c => !c.parentId);
          const tree = parents.map(p => ({
            ...p,
            children: cats.filter(c => c.parentId === p._id || c.parentId?.$oid === p._id)
          }));
          setCategories(tree);
        }
      } catch (err) {
        console.error("Failed to fetch categories:", err);
      }
    };
    fetchCategories();
  }, []);

  return (
    <header className={`fixed w-full top-0 z-50 transition-all duration-300 ${scrolled ? "bg-white/90 backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.03)] pt-4" : "bg-white pt-6"}`}>
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 flex items-center justify-between pb-6">
        
        {/* Left: Mobile Menu Toggle or Desktop Links */}
        <div className="flex-1 flex items-center">
          <button className="lg:hidden text-gray-800 text-xl hover:text-black transition-colors" onClick={() => setMobileMenuOpen(true)}>
            <FontAwesomeIcon icon={faBars} />
          </button>
          <nav className="hidden lg:flex gap-10 items-center">
            {NAV_LINKS.map(link => (
              <Link key={link.href} to={link.href} className="text-[12px] font-medium tracking-[0.15em] text-gray-600 hover:text-black transition-colors uppercase">
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Center: Logo */}
        <div className="flex-shrink-0 text-center -translate-y-2">
          <Link to="/" className="flex flex-col items-center">
            <h1 className="text-3xl lg:text-4xl font-semibold text-black leading-none tracking-tight" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
              CostumeHUB
            </h1>
            <span className="text-[9px] tracking-[0.3em] uppercase text-gray-400 mt-2 font-medium">
              LUXE RENTAL
            </span>
          </Link>
        </div>

        {/* Right: Actions */}
        <div className="flex-1 flex items-center justify-end gap-6 lg:gap-8 relative z-[60]">
          <div className="hidden lg:flex flex-1 max-w-[300px] justify-end w-full">
            <SearchBar />
          </div>
          
          <Link to="/cart" className="relative text-gray-600 hover:text-black transition-colors">
            <FontAwesomeIcon icon={faShoppingBag} className="text-[15px] lg:text-[16px]" />
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-black text-white text-[10px] font-bold w-[18px] h-[18px] flex items-center justify-center rounded-full shadow-sm">
                {cartCount}
              </span>
            )}
          </Link>

          {user ? (
            <div className="relative hidden sm:block" ref={profileDropdownRef}>
              <button 
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="text-gray-600 hover:text-black transition-colors flex items-center gap-2 outline-none focus:outline-none"
              >
                {user.avatar ? (
                  <img src={user.avatar} alt="Avatar" className="w-6 h-6 rounded-full object-cover border border-gray-200" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center text-[10px] font-bold">
                    {user.fullName ? user.fullName.charAt(0).toUpperCase() : "U"}
                  </div>
                )}
              </button>
              
              <div className={`absolute right-0 top-full mt-4 w-48 bg-white border border-gray-100 shadow-lg rounded-md transition-all duration-200 z-50 py-2 ${profileDropdownOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-2'}`}>
                <Link to="/user/my-profile" onClick={() => setProfileDropdownOpen(false)} className="block px-4 py-2 text-[13px] text-gray-700 hover:bg-gray-50 hover:text-black transition-colors">
                  Hồ sơ của tôi
                </Link>
                <button onClick={() => { setProfileDropdownOpen(false); handleLogout(); }} className="w-full text-left px-4 py-2 text-[13px] text-red-600 hover:bg-red-50 transition-colors">
                  Đăng xuất
                </button>
              </div>
            </div>
          ) : (
            <Link to="/login" className="text-gray-600 hover:text-black transition-colors hidden sm:block">
              <FontAwesomeIcon icon={faUser} className="text-[15px] lg:text-[16px]" />
            </Link>
          )}
        </div>
      </div>

      {/* Bottom Category Bar */}
      <div className="hidden lg:block w-full bg-[#f9f5ed] border-t border-[#e8dfc8]">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <nav className="flex justify-center gap-12 items-center">
            {categories.map(cat => (
              <div key={cat._id} className="relative group">
                <Link to={`/category/${cat._id}`} className="block text-[11px] font-bold tracking-[0.15em] text-[#4a453e] hover:text-black transition-colors uppercase py-4">
                  {cat.name}
                </Link>
                
                {/* Dropdown for child categories */}
                {cat.children && cat.children.length > 0 && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 bg-white shadow-xl border border-gray-50 transition-all duration-200 z-50 min-w-[220px] opacity-0 invisible group-hover:opacity-100 group-hover:visible translate-y-2 group-hover:translate-y-0 py-2">
                    <div className="flex flex-col text-center">
                      {cat.children.map(child => (
                        <Link 
                          key={child._id} 
                          to={`/category/${child._id}`} 
                          className="px-6 py-3.5 text-[11px] text-[#555] hover:bg-[#fcfaf5] hover:text-black transition-colors font-normal uppercase tracking-[0.15em]"
                        >
                          {child.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </nav>
        </div>
      </div>

      {/* Mobile Drawer Overlay */}
      <div className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] transition-opacity duration-300 lg:hidden ${mobileMenuOpen ? "opacity-100 visible" : "opacity-0 invisible"}`} onClick={() => setMobileMenuOpen(false)}>
        {/* Mobile Drawer */}
        <div className={`absolute top-0 left-0 w-[80%] max-w-[320px] h-full bg-white shadow-2xl transition-transform duration-300 ease-in-out flex flex-col ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`} onClick={e => e.stopPropagation()}>
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h2 className="text-2xl font-semibold" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Menu</h2>
            <button onClick={() => setMobileMenuOpen(false)} className="text-gray-400 hover:text-black text-xl transition-colors">
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>
          <nav className="flex flex-col px-6 py-8 gap-6 flex-1 overflow-y-auto">
            {categories.map(cat => (
              <div key={cat._id} className="flex flex-col gap-3">
                <Link to={`/category/${cat._id}`} className="text-[13px] font-bold tracking-[0.1em] text-gray-800 hover:text-black uppercase transition-colors">
                  {cat.name}
                </Link>
                {cat.children && cat.children.length > 0 && (
                  <div className="flex flex-col gap-3 pl-4 border-l border-gray-100">
                    {cat.children.map(child => (
                      <Link 
                        key={child._id} 
                        to={`/category/${child._id}`} 
                        className="text-[12px] font-medium tracking-[0.05em] text-gray-500 hover:text-black uppercase transition-colors"
                      >
                        {child.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <hr className="border-gray-100 my-2" />
            <Link to={user ? "/my-profile" : "/login"} className="text-[13px] font-medium tracking-[0.1em] text-gray-800 hover:text-black uppercase flex items-center gap-3 transition-colors">
               {user ? (
                 user.avatar ? (
                   <img src={user.avatar} alt="Avatar" className="w-6 h-6 rounded-full object-cover border border-gray-200" />
                 ) : (
                   <div className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center text-[10px] font-bold">
                     {user.fullName ? user.fullName.charAt(0).toUpperCase() : "U"}
                   </div>
                 )
               ) : (
                 <FontAwesomeIcon icon={faUser} className="text-gray-500 text-[15px]" />
               )}
               {user ? (user.fullName || "Tài khoản") : "Đăng nhập"}
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
