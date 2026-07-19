import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass, faGem } from "@fortawesome/free-solid-svg-icons";
import categoryService from "../../services/category.service";

// Ảnh do chủ shop cung cấp, đã upload lên Cloudinary (homepage/hero-model)
const HERO_IMAGE =
  "https://res.cloudinary.com/du0xdjnrx/image/upload/q_auto,f_auto/v1783964454/homepage/hero-model.png";

export default function HeroSection() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [quickCategories, setQuickCategories] = useState([]);

  useEffect(() => {
    const fetchQuickCats = async () => {
      try {
        const data = await categoryService.getAll();
        const cats = (data.categories || []).filter(c => c.isActive !== false);
        const parentCats = cats.filter(c => !c.parentId);
        const displayCats = parentCats.length > 0 ? parentCats : cats;
        setQuickCategories(displayCats.slice(0, 5));
      } catch (err) {
        console.error("Failed to fetch quick categories:", err);
      }
    };
    fetchQuickCats();
  }, []);

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
            {quickCategories.length > 0 && (
              <div className="mt-5 flex flex-wrap items-center gap-2.5">
                <span className="text-[11px] text-[#8c764e] font-semibold uppercase tracking-wider mr-1">
                  Gợi ý:
                </span>
                {quickCategories.map((cat, idx) => (
                  <motion.button
                    key={cat._id || cat.name}
                    type="button"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.6 + idx * 0.08 }}
                    whileHover={{ scale: 1.06, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate(`/category/${cat._id}`)}
                    className="px-5 py-2 bg-white/90 backdrop-blur-sm border border-[#e2d5c3] rounded-full text-[13px] font-medium text-[#2d2519] hover:border-[#c9a869] hover:bg-white hover:text-[#b8935a] hover:shadow-[0_6px_18px_rgba(201,168,105,0.2)] transition-all duration-300"
                  >
                    {cat.name}
                  </motion.button>
                ))}
              </div>
            )}
          </motion.div>
        </div>

        {/* Cột phải để trống trên desktop — ảnh đã render dạng nền tràn viền ở trên */}
        <div className="hidden lg:block flex-1" />
      </div>
    </section>
  );
}

