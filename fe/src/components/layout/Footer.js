import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFacebookF, faInstagram, faTiktok } from "@fortawesome/free-brands-svg-icons";
import { faPhone, faEnvelope, faLocationDot, faChevronRight, faShirt, faCircleInfo } from "@fortawesome/free-solid-svg-icons";
import categoryService from "../../services/category.service";

const DEFAULT_CATEGORIES = [
  { _id: "default-1", name: "Váy Dạ Hội" },
  { _id: "default-2", name: "Váy Cocktail" },
  { _id: "default-3", name: "Áo Dài" },
  { _id: "default-4", name: "Vest & Set" },
  { _id: "default-5", name: "Phụ Kiện" }
];

export default function Footer() {
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await categoryService.getAll();
        const cats = data.categories || [];
        const activeRoots = cats.filter(c => !c.parentId && c.isActive);
        if (activeRoots.length > 0) {
          setCategories(activeRoots.slice(0, 5));
        }
      } catch (err) {
        console.error("Failed to load footer categories:", err);
      }
    };
    fetchCategories();
  }, []);
  return (
    <footer className="bg-[#FAF6F0] pt-20 pb-12 border-t border-[#EAE3D8] text-center lg:text-left relative overflow-hidden">
      {/* Decorative leaf bottom-left */}
      <div className="absolute bottom-0 left-0 w-48 h-48 opacity-[0.04] pointer-events-none select-none">
        <svg viewBox="0 0 200 200" fill="none" stroke="#BFA888" strokeWidth="1.5" className="w-full h-full">
          <path d="M10,190 C60,160 100,100 120,40" />
          <path d="M120,40 C110,60 90,75 70,85 C90,90 105,80 120,40" />
          <path d="M100,100 C90,115 70,125 50,130 C70,135 85,125 100,100" />
          <path d="M70,140 C60,150 45,158 30,162 C45,165 58,157 70,140" />
          <path d="M120,40 C135,55 155,65 175,70 C155,75 140,65 120,40" />
          <path d="M100,100 C115,115 135,125 155,130 C135,135 120,125 100,100" />
        </svg>
      </div>

      <div className="max-w-[1280px] mx-auto px-6 lg:px-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 relative z-10">

        {/* Brand */}
        <div className="flex flex-col items-center lg:items-start">
          <Link to="/" className="mb-6 flex flex-col items-center lg:items-start group">
            <div className="flex items-center gap-1">
              <span className="text-[28px] font-bold text-[#1a1a1a]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Costume</span>
              <span className="text-[28px] font-bold text-[#BFA888]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>HUB</span>
            </div>
            <div className="flex items-center justify-center lg:justify-start w-full gap-2 mt-1">
              <div className="h-[1px] bg-[#EAE3D8] w-8"></div>
              <span className="text-[9px] tracking-[0.3em] uppercase text-gray-500 font-medium whitespace-nowrap">LUXE RENTAL</span>
              <div className="h-[1px] bg-[#EAE3D8] w-8"></div>
            </div>
          </Link>
          <p className="text-[13px] leading-relaxed text-gray-600 max-w-[280px]">
            CostumeHUB mang đến cho bạn những bộ trang phục cao cấp nhất, giúp bạn tự tin tỏa sáng trong mọi khoảnh khắc quan trọng.
          </p>
          <div className="flex gap-3 mt-6">
            <a href="https://facebook.com" target="_blank" rel="noreferrer" className="w-9 h-9 rounded-full border border-[#eaeaea] flex items-center justify-center text-gray-600 hover:bg-[#BFA888] hover:text-white hover:border-[#BFA888] transition-colors bg-white shadow-sm">
              <FontAwesomeIcon icon={faFacebookF} className="text-[13px]" />
            </a>
            <a href="https://instagram.com" target="_blank" rel="noreferrer" className="w-9 h-9 rounded-full border border-[#eaeaea] flex items-center justify-center text-gray-600 hover:bg-[#BFA888] hover:text-white hover:border-[#BFA888] transition-colors bg-white shadow-sm">
              <FontAwesomeIcon icon={faInstagram} className="text-[13px]" />
            </a>
            <a href="https://tiktok.com" target="_blank" rel="noreferrer" className="w-9 h-9 rounded-full border border-[#eaeaea] flex items-center justify-center text-gray-600 hover:bg-[#BFA888] hover:text-white hover:border-[#BFA888] transition-colors bg-white shadow-sm">
              <FontAwesomeIcon icon={faTiktok} className="text-[13px]" />
            </a>
          </div>
        </div>

        {/* Danh muc */}
        <div className="flex flex-col items-center lg:items-start">
          <h3 className="text-[11px] tracking-[0.15em] font-bold text-black uppercase flex items-center gap-2">
            <FontAwesomeIcon icon={faShirt} className="text-[#BFA888] text-sm" />
            DANH MỤC
          </h3>
          <div className="w-8 h-[1.5px] bg-[#BFA888] mt-2 mb-6"></div>
          <ul className="space-y-1 w-full max-w-[240px]">
            {categories.map((cat) => (
              <li key={cat._id}>
                <Link to={`/category?q=${encodeURIComponent(cat.name)}`} className="flex items-center justify-between py-2 border-b border-gray-200/60 hover:text-[#BFA888] transition-all group">
                  <span className="text-[13px] text-gray-700 font-medium group-hover:text-black">{cat.name}</span>
                  <FontAwesomeIcon icon={faChevronRight} className="text-[9px] text-gray-400 group-hover:text-[#BFA888] transition-colors" />
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Thong tin */}
        <div className="flex flex-col items-center lg:items-start">
          <h3 className="text-[11px] tracking-[0.15em] font-bold text-black uppercase flex items-center gap-2">
            <FontAwesomeIcon icon={faCircleInfo} className="text-[#BFA888] text-sm" />
            THÔNG TIN
          </h3>
          <div className="w-8 h-[1.5px] bg-[#BFA888] mt-2 mb-6"></div>
          <ul className="space-y-1 w-full max-w-[240px]">
            <li>
              <Link to="/about" className="flex items-center justify-between py-2 border-b border-gray-200/60 hover:text-[#BFA888] transition-all group">
                <span className="text-[13px] text-gray-700 font-medium group-hover:text-black">Về chúng tôi</span>
                <FontAwesomeIcon icon={faChevronRight} className="text-[9px] text-gray-400 group-hover:text-[#BFA888] transition-colors" />
              </Link>
            </li>
            <li>
              <Link to="/faq" className="flex items-center justify-between py-2 border-b border-gray-200/60 hover:text-[#BFA888] transition-all group">
                <span className="text-[13px] text-gray-700 font-medium group-hover:text-black">Câu hỏi thường gặp</span>
                <FontAwesomeIcon icon={faChevronRight} className="text-[9px] text-gray-400 group-hover:text-[#BFA888] transition-colors" />
              </Link>
            </li>
            <li>
              <Link to="/contact" className="flex items-center justify-between py-2 border-b border-gray-200/60 hover:text-[#BFA888] transition-all group">
                <span className="text-[13px] text-gray-700 font-medium group-hover:text-black">Liên hệ</span>
                <FontAwesomeIcon icon={faChevronRight} className="text-[9px] text-gray-400 group-hover:text-[#BFA888] transition-colors" />
              </Link>
            </li>
          </ul>
        </div>

        {/* Lien he */}
        <div className="flex flex-col items-center lg:items-start">
          <h3 className="text-[11px] tracking-[0.15em] font-bold text-black uppercase flex items-center gap-2">
            <FontAwesomeIcon icon={faPhone} className="text-[#BFA888] text-sm" />
            LIÊN HỆ
          </h3>
          <div className="w-8 h-[1.5px] bg-[#BFA888] mt-2 mb-6"></div>
          <div className="space-y-4 w-full max-w-[280px] text-left">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-[#F5EFEB] flex items-center justify-center text-[#BFA888] shrink-0 mt-0.5 shadow-sm">
                <FontAwesomeIcon icon={faPhone} className="text-xs" />
              </div>
              <div>
                <p className="text-[13px] font-medium text-gray-700 tracking-wide">0123 456 789</p>
                <p className="text-[12px] text-gray-400 mt-0.5">Hỗ trợ 8:00 – 21:00</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-[#F5EFEB] flex items-center justify-center text-[#BFA888] shrink-0 mt-0.5 shadow-sm">
                <FontAwesomeIcon icon={faEnvelope} className="text-xs" />
              </div>
              <div>
                <p className="text-[13px] font-medium text-gray-700 tracking-wide">support@costumehub.vn</p>
                <p className="text-[12px] text-gray-400 mt-0.5">Phản hồi trong 24h</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-[#F5EFEB] flex items-center justify-center text-[#BFA888] shrink-0 mt-0.5 shadow-sm">
                <FontAwesomeIcon icon={faLocationDot} className="text-xs" />
              </div>
              <div>
                <p className="text-[13px] font-medium text-gray-700 tracking-wide leading-snug">
                  Số 18 Tràng Thi, Hoàn Kiếm, Hà Nội
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>

      <div className="max-w-[1280px] mx-auto px-6 lg:px-12 mt-12 pt-6 border-t border-[#EAE3D8] flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] text-gray-500 tracking-[0.05em] relative z-10">
        <p>© {new Date().getFullYear()} COSTUMEHUB. ALL RIGHTS RESERVED.</p>
        <div className="flex gap-6">
          <Link to="/privacy" className="hover:text-black transition-colors">Chính sách bảo mật</Link>
          <Link to="/terms" className="hover:text-black transition-colors">Điều khoản sử dụng</Link>
        </div>
      </div>
    </footer>
  );
}
