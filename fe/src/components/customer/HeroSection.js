import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass, faGem, faCrown } from "@fortawesome/free-solid-svg-icons";

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
    <section className="relative bg-[#faf6f0] overflow-hidden lg:min-h-[640px] flex items-center">
      {/* Dynamic ambient gold background aura */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-amber-200/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-1/2 right-1/4 w-80 h-80 bg-[#c9a869]/15 rounded-full blur-[110px] pointer-events-none" />

      {/* Ảnh nền bên phải, tràn sát viền phải, mờ dần sang trái để hoà vào nền */}
      <div className="hidden lg:block absolute inset-y-0 right-0 w-[58%]">
        <motion.img
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          src={HERO_IMAGE}
          alt="CostumeHUB — Trang phục cao cấp"
          className="w-full h-full object-cover select-none pointer-events-none"
          style={{
            maskImage: "linear-gradient(to right, transparent 0%, rgba(0,0,0,0.55) 16%, rgba(0,0,0,1) 34%)",
            WebkitMaskImage: "linear-gradient(to right, transparent 0%, rgba(0,0,0,0.55) 16%, rgba(0,0,0,1) 34%)",
          }}
        />
        {/* Floating luxury badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="absolute bottom-16 right-16 bg-white/85 backdrop-blur-md px-5 py-3 rounded-2xl shadow-xl border border-[#e8c471]/40 flex items-center gap-3 animate-float-gentle"
        >
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#d4af37] to-[#8a6a2f] flex items-center justify-center text-white text-[13px] shadow-md">
            <FontAwesomeIcon icon={faCrown} />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-[#b8935a] font-bold">Bộ sưu tập độc quyền</p>
            <p className="text-[13px] font-semibold text-[#1a1a1a]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
              Haute Couture 2026
            </p>
          </div>
        </motion.div>
      </div>

      {/* Ảnh dạng card cho mobile/tablet */}
      <div className="lg:hidden w-full px-6 pt-8">
        <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden shadow-xl border border-[#c9a869]/30 relative">
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
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
            className="flex items-center gap-3 mb-5"
          >
            <motion.span
              initial={{ width: 0 }}
              animate={{ width: 36 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="h-px bg-gradient-to-r from-[#b8935a] to-[#e8c471]"
            />
            <span className="text-[11px] tracking-[0.22em] uppercase text-[#b8935a] font-bold flex items-center gap-2">
              <FontAwesomeIcon icon={faGem} className="text-[10px] text-[#d4af37]" />
              Luxury Rental Experience
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 35 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="font-display-lux text-7xl lg:text-8xl leading-[1.05] font-bold tracking-tight"
          >
            <span className="text-shine-black">Trang Phục</span><br />
            <span className="text-shine-gold-animated">Cao Cấp</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.7 }}
            className="text-gray-600 mt-6 text-lg leading-relaxed max-w-lg font-light"
          >
            Cho thuê trang phục thiết kế cao cấp & dạ hội sang trọng để bạn tự tin tỏa sáng rực rỡ trong mọi sự kiện.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="mt-9"
          >
            {/* LUXURY SEARCH BAR */}
            <div className="search-bar-luxury rounded-full p-2 pl-7 flex items-center gap-3 border border-[#c9a869]/30 max-w-xl">
              <FontAwesomeIcon icon={faMagnifyingGlass} className="text-[#b8935a] text-[17px] shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Tìm kiếm váy dạ hội, áo dài, đầm tiệc..."
                className="flex-1 min-w-0 text-[15px] text-[#1a1a1a] placeholder-gray-400 bg-transparent border-none outline-none focus:ring-0 font-medium"
              />
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleSearch}
                className="shrink-0 bg-gradient-to-r from-[#1a1a1a] via-[#2a2a2a] to-[#1a1a1a] text-[#f5e6ca] px-8 py-3.5 rounded-full font-bold text-[12px] uppercase tracking-[0.14em] luxury-btn-gold-shine shadow-lg hover:shadow-[0_8px_25px_rgba(184,147,90,0.35)] transition-all whitespace-nowrap border border-[#c9a869]/40"
              >
                Tìm kiếm
              </motion.button>
            </div>

            {/* QUICK FILTERS */}
            <div className="mt-5 flex flex-wrap items-center gap-2.5">
              <span className="text-[11px] text-[#8c764e] font-semibold uppercase tracking-wider mr-1">
                Gợi ý:
              </span>
              {QUICK_FILTERS.map((f, idx) => (
                <motion.button
                  key={f}
                  type="button"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 + idx * 0.08 }}
                  whileHover={{ scale: 1.06, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate(`/collections?q=${encodeURIComponent(f)}`)}
                  className="px-5 py-2 bg-white/90 backdrop-blur-sm border border-[#e2d5c3] rounded-full text-[13px] font-medium text-[#2d2519] hover:border-[#c9a869] hover:bg-white hover:text-[#b8935a] hover:shadow-[0_6px_18px_rgba(201,168,105,0.2)] transition-all duration-300"
                >
                  {f}
                </motion.button>
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

