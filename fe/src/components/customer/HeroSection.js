import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";

// Ảnh do chủ shop cung cấp, đã upload lên Cloudinary (homepage/hero-model)
const HERO_IMAGE =
  "https://res.cloudinary.com/du0xdjnrx/image/upload/q_auto,f_auto/v1783964454/homepage/hero-model.png";

const QUICK_FILTERS = ["Dạ hội", "Áo dài", "Váy dạ tiệc", "Đầm trắng"];

export default function HeroSection() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/collections?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate("/collections");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSearch();
  };

  return (
    <section className="relative bg-[#faf6f0] overflow-hidden lg:min-h-[620px] flex items-center">
      {/* Ảnh nền bên phải, tràn sát viền phải, mờ dần sang trái để hoà vào nền */}
      <div className="hidden lg:block absolute inset-y-0 right-0 w-[58%]">
        <img
          src={HERO_IMAGE}
          alt="CostumeHUB — Trang phục cao cấp"
          className="w-full h-full object-cover select-none pointer-events-none"
          style={{
            maskImage: "linear-gradient(to right, transparent 0%, rgba(0,0,0,0.55) 16%, rgba(0,0,0,1) 34%)",
            WebkitMaskImage: "linear-gradient(to right, transparent 0%, rgba(0,0,0,0.55) 16%, rgba(0,0,0,1) 34%)",
          }}
        />
      </div>

      {/* Ảnh dạng card cho mobile/tablet (không đủ chỗ tràn viền) */}
      <div className="lg:hidden w-full px-6 pt-8">
        <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden shadow-xl">
          <img
            src={HERO_IMAGE}
            alt="CostumeHUB — Trang phục cao cấp"
            className="w-full h-full object-cover select-none pointer-events-none"
          />
        </div>
      </div>

      <div className="relative z-10 w-full max-w-[1300px] mx-auto px-6 lg:px-12 py-16 lg:py-0 flex flex-col lg:flex-row items-center gap-12 lg:gap-16">

        {/* LEFT TEXT */}
        <div className="flex-1 w-full max-w-3xl lg:py-20">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center gap-3 mb-5"
          >
            <span className="w-8 h-px bg-[#c9a869]" />
            <span className="text-[11px] tracking-[0.2em] uppercase text-[#b8935a] font-semibold">
              Luxury Rental
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="font-display-lux text-7xl lg:text-8xl leading-[1.05] font-bold tracking-tight"
          >
            <span className="text-shine-black">Trang Phục</span><br />
            <span className="text-shine-gold">Cao Cấp</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-gray-500 mt-6 text-lg leading-relaxed max-w-lg"
          >
            Cho thuê trang phục thiết kế cao cấp để bạn tỏa sáng trong mọi khoảnh khắc.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-8"
          >
            <div className="bg-white rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.08)] flex items-center gap-2 p-2.5 pl-7 border border-[#eaeaea] max-w-xl">
              <FontAwesomeIcon icon={faMagnifyingGlass} className="text-gray-400 text-[16px] shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Tìm kiếm trang phục bạn yêu thích..."
                className="flex-1 min-w-0 text-[15px] text-[#1a1a1a] placeholder-gray-400 bg-transparent border-none outline-none focus:ring-0"
              />
              <button
                onClick={handleSearch}
                className="shrink-0 bg-[#1a1a1a] text-white px-7 py-3.5 rounded-full font-semibold text-[12px] uppercase tracking-wider hover:bg-black transition-all whitespace-nowrap"
              >
                Tìm kiếm
              </button>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              {QUICK_FILTERS.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => navigate(`/collections?q=${encodeURIComponent(f)}`)}
                  className="px-5 py-2.5 bg-white/70 border border-gray-200 rounded-full text-[13px] font-medium text-[#1a1a1a] hover:border-[#c9a869] hover:bg-white transition-all"
                >
                  {f}
                </button>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Cột phải để trống trên desktop — ảnh đã render dạng nền tràn viền ở trên */}
        <div className="hidden lg:block flex-1" />
      </div>
    </section>
  );
}
