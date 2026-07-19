import React from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFacebookF, faInstagram, faTiktok } from "@fortawesome/free-brands-svg-icons";
import { faPhone, faEnvelope, faLocationDot } from "@fortawesome/free-solid-svg-icons";

import logoImg from "../../assets/logo.png";

export default function Footer() {
  return (
    <footer className="bg-white pt-24 pb-12 border-t border-gray-100 text-center lg:text-left">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 grid grid-cols-1 lg:grid-cols-4 gap-12 lg:gap-8">

        {/* Brand */}
        <div className="flex flex-col items-center lg:items-start">
          <Link to="/" className="mb-6 block group">
            <img
              src={logoImg}
              alt="CostumeHUB"
              className="h-11 lg:h-12 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
            />
          </Link>
          <p className="text-[13px] leading-relaxed text-gray-500 max-w-[280px]">
            CostumeHUB mang đến cho bạn những bộ trang phục cao cấp nhất, giúp bạn tự tin tỏa sáng trong mọi khoảnh khắc quan trọng.
          </p>
          <div className="flex gap-3 mt-6">
            <a href="https://facebook.com" target="_blank" rel="noreferrer" className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-black hover:text-white hover:border-black transition-colors">
              <FontAwesomeIcon icon={faFacebookF} className="text-[13px]" />
            </a>
            <a href="https://instagram.com" target="_blank" rel="noreferrer" className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-black hover:text-white hover:border-black transition-colors">
              <FontAwesomeIcon icon={faInstagram} className="text-[13px]" />
            </a>
            <a href="https://tiktok.com" target="_blank" rel="noreferrer" className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-black hover:text-white hover:border-black transition-colors">
              <FontAwesomeIcon icon={faTiktok} className="text-[13px]" />
            </a>
          </div>
        </div>

        {/* Danh muc */}
        <div className="flex flex-col items-center lg:items-start">
          <h3 className="text-[10px] tracking-[0.2em] font-semibold text-black uppercase mb-6">Danh Mục</h3>
          <ul className="space-y-4 text-[13px] text-gray-500">
            <li><Link to="/category?q=Váy Dạ Hội" className="hover:text-black transition-colors">Váy Dạ Hội</Link></li>
            <li><Link to="/category?q=Váy Cocktail" className="hover:text-black transition-colors">Váy Cocktail</Link></li>
            <li><Link to="/category?q=Áo Dài" className="hover:text-black transition-colors">Áo Dài</Link></li>
            <li><Link to="/category?q=Vest" className="hover:text-black transition-colors">Vest & Set</Link></li>
            <li><Link to="/category?q=Phụ Kiện" className="hover:text-black transition-colors">Phụ Kiện</Link></li>
          </ul>
        </div>

        {/* Thong tin */}
        <div className="flex flex-col items-center lg:items-start">
          <h3 className="text-[10px] tracking-[0.2em] font-semibold text-black uppercase mb-6">Thông Tin</h3>
          <ul className="space-y-4 text-[13px] text-gray-500">
            <li><Link to="/about" className="hover:text-black transition-colors">Về chúng tôi</Link></li>
            <li><Link to="/faq" className="hover:text-black transition-colors">Câu hỏi thường gặp</Link></li>
            <li><Link to="/contact" className="hover:text-black transition-colors">Liên hệ</Link></li>
          </ul>
        </div>

        {/* Lien he */}
        <div className="flex flex-col items-center lg:items-start">
          <h3 className="text-[10px] tracking-[0.2em] font-semibold text-black uppercase mb-6">Liên Hệ</h3>
          <ul className="space-y-4 text-[13px] text-gray-500">
            <li className="flex items-center gap-2.5 justify-center lg:justify-start">
              <FontAwesomeIcon icon={faPhone} className="text-gray-400 text-[12px]" />
              <span>0123 456 789</span>
            </li>
            <li className="flex items-center gap-2.5 justify-center lg:justify-start">
              <FontAwesomeIcon icon={faEnvelope} className="text-gray-400 text-[12px]" />
              <span>support@costumehub.vn</span>
            </li>
            <li className="flex items-center gap-2.5 justify-center lg:justify-start">
              <FontAwesomeIcon icon={faLocationDot} className="text-gray-400 text-[12px]" />
              <span>123 Nguyễn Huệ, Quận 1, TP.HCM</span>
            </li>
          </ul>
        </div>

      </div>

      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 mt-10 pt-6 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] text-gray-400 tracking-[0.05em] uppercase">
        <p>© {new Date().getFullYear()} COSTUMEHUB. ALL RIGHTS RESERVED.</p>
        <div className="flex gap-6">
          <Link to="/privacy" className="hover:text-black transition-colors">Chính sách bảo mật</Link>
          <Link to="/terms" className="hover:text-black transition-colors">Điều khoản sử dụng</Link>
        </div>
      </div>
    </footer>
  );
}
