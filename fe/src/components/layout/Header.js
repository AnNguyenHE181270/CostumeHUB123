import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faShoppingBag, faBars, faTimes, faSearch } from "@fortawesome/free-solid-svg-icons";

export default function Header() {
  const { user, role } = useAuth();
  const { cartCount } = useCart();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

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

  return (
    <header className={`fixed w-full top-0 z-50 transition-all duration-300 ${scrolled ? "bg-white/90 backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.03)] py-4" : "bg-white py-6"}`}>
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 flex items-center justify-between">
        
        {/* Left: Mobile Menu Toggle or Desktop Links */}
        <div className="flex-1 flex items-center">
          <button className="lg:hidden text-gray-800 text-xl hover:text-black transition-colors" onClick={() => setMobileMenuOpen(true)}>
            <FontAwesomeIcon icon={faBars} />
          </button>
          <nav className="hidden lg:flex gap-10">
            {NAV_LINKS.map(link => (
              <Link key={link.href} to={link.href} className="text-[12px] font-medium tracking-[0.15em] text-gray-600 hover:text-black transition-colors">
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Center: Logo */}
        <div className="flex-shrink-0 text-center">
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
        <div className="flex-1 flex items-center justify-end gap-6 lg:gap-8">
          <button className="text-gray-600 hover:text-black transition-colors" aria-label="Search">
            <FontAwesomeIcon icon={faSearch} className="text-[15px] lg:text-[16px]" />
          </button>
          
          <Link to={user ? "/my-profile" : "/login"} className="text-gray-600 hover:text-black transition-colors hidden sm:block">
            {user ? (
              user.avatar ? (
                <img src={user.avatar} alt="Avatar" className="w-6 h-6 rounded-full object-cover border border-gray-200" />
              ) : (
                <div className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center text-[10px] font-bold">
                  {user.fullName ? user.fullName.charAt(0).toUpperCase() : "U"}
                </div>
              )
            ) : (
              <FontAwesomeIcon icon={faUser} className="text-[15px] lg:text-[16px]" />
            )}
          </Link>

          <Link to="/cart" className="relative text-gray-600 hover:text-black transition-colors">
            <FontAwesomeIcon icon={faShoppingBag} className="text-[15px] lg:text-[16px]" />
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-black text-white text-[10px] font-bold w-[18px] h-[18px] flex items-center justify-center rounded-full shadow-sm">
                {cartCount}
              </span>
            )}
          </Link>
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
            {NAV_LINKS.map(link => (
              <Link key={link.href} to={link.href} className="text-[13px] font-medium tracking-[0.1em] text-gray-800 hover:text-black uppercase transition-colors">
                {link.label}
              </Link>
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
