import React from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFacebookF, faInstagram, faTiktok } from "@fortawesome/free-brands-svg-icons";

export default function Footer() {
  return (
    <footer className="bg-white pt-24 pb-12 border-t border-gray-100 text-center lg:text-left">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 grid grid-cols-1 lg:grid-cols-4 gap-12 lg:gap-8">
        
        {/* Brand */}
        <div className="lg:col-span-1 flex flex-col items-center lg:items-start">
          <Link to="/" className="mb-6">
            <h2 className="text-3xl font-semibold text-black leading-none" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
              CostumeHUB
            </h2>
            <span className="block text-[9px] tracking-[0.3em] uppercase text-gray-400 mt-2 font-medium">
              LUXE RENTAL
            </span>
          </Link>
          <p className="text-[13px] leading-relaxed text-gray-500 max-w-[280px]">
            Nâng tầm phong cách với bộ sưu tập trang phục thiết kế cao cấp, sẵn sàng cho những khoảnh khắc đáng nhớ nhất của bạn.
          </p>
        </div>

        {/* Links */}
        <div className="flex flex-col items-center lg:items-start">
          <h3 className="text-[10px] tracking-[0.2em] font-semibold text-black uppercase mb-6">Khám Phá</h3>
          <ul className="space-y-4 text-[13px] text-gray-500">
            <li><Link to="/products" className="hover:text-black transition-colors">Bộ sưu tập mới</Link></li>
            <li><Link to="/about" className="hover:text-black transition-colors">Về chúng tôi</Link></li>
            <li><Link to="/blog" className="hover:text-black transition-colors">Tạp chí thời trang</Link></li>
          </ul>
        </div>

        {/* Support */}
        <div className="flex flex-col items-center lg:items-start">
          <h3 className="text-[10px] tracking-[0.2em] font-semibold text-black uppercase mb-6">Hỗ Trợ</h3>
          <ul className="space-y-4 text-[13px] text-gray-500">
            <li><Link to="/faq" className="hover:text-black transition-colors">Câu hỏi thường gặp</Link></li>
            <li><Link to="/shipping" className="hover:text-black transition-colors">Vận chuyển & Trả hàng</Link></li>
            <li><Link to="/contact" className="hover:text-black transition-colors">Liên hệ</Link></li>
          </ul>
        </div>

        {/* Newsletter & Socials */}
        <div className="flex flex-col items-center lg:items-start">
          <h3 className="text-[10px] tracking-[0.2em] font-semibold text-black uppercase mb-6">Nhận Tin Tức Mới</h3>
          <div className="w-full max-w-[300px] flex border-b border-gray-200 focus-within:border-black transition-colors pb-2">
            <input 
              type="email" 
              placeholder="Email của bạn..." 
              className="w-full bg-transparent text-[13px] text-black outline-none placeholder:text-gray-400"
            />
            <button className="text-[11px] font-medium tracking-[0.1em] uppercase text-black hover:text-gray-500 transition-colors pl-4">
              Gửi
            </button>
          </div>
          <div className="flex gap-6 mt-8">
            <a href="#" aria-label="Instagram" className="text-gray-400 hover:text-black transition-colors"><FontAwesomeIcon icon={faInstagram} className="text-lg" /></a>
            <a href="#" aria-label="Facebook" className="text-gray-400 hover:text-black transition-colors"><FontAwesomeIcon icon={faFacebookF} className="text-lg" /></a>
            <a href="#" aria-label="TikTok" className="text-gray-400 hover:text-black transition-colors"><FontAwesomeIcon icon={faTiktok} className="text-lg" /></a>
          </div>
        </div>

      </div>

      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 mt-20 pt-8 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] text-gray-400 tracking-[0.05em] uppercase">
        <p>© 2026 CostumeHUB. All rights reserved.</p>
        <div className="flex gap-6">
          <Link to="/privacy" className="hover:text-black transition-colors">Bảo mật</Link>
          <Link to="/terms" className="hover:text-black transition-colors">Điều khoản</Link>
        </div>
      </div>
    </footer>
  );
}
