import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight, faGem } from "@fortawesome/free-solid-svg-icons";

const EVENING_IMG = "/images/homepage/promo_evening.png";
const PURE_WHITE_IMG = "/images/homepage/promo_white.png";
const MODERN_CHIC_IMG = "/images/homepage/promo_modern.png";

const TILES = [
  {
    key: "pure-white",
    title: "Pure White",
    desc: "Đầm trắng tinh khôi",
    keyword: "Đầm Trắng",
    image: PURE_WHITE_IMG,
  },
  {
    key: "modern-chic",
    title: "Modern Chic",
    desc: "Sang trọng hiện đại",
    keyword: "Vest",
    image: MODERN_CHIC_IMG,
  },
];

export default function PromoBanner() {
  const navigate = useNavigate();

  return (
    <section className="px-6 py-16">
      <motion.div
        initial={{ opacity: 0, y: 35 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-[1300px] mx-auto grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-10 items-stretch"
      >
        {/* LEFT TEXT */}
        <div className="flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-3">
            <FontAwesomeIcon icon={faGem} className="text-[10px] text-[#d4af37]" />
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#b8935a]">
              Bộ Sưu Tập Mới
            </span>
          </div>
          <h2
            className="text-4xl lg:text-5xl font-bold leading-[1.05]"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            <span className="text-shine-black">Timeless</span><br />
            <span className="text-shine-gold-animated">Elegance</span>
          </h2>
          <p className="text-gray-500 mt-4 text-[15px] leading-relaxed max-w-xs font-light">
            Thanh lịch vượt thời gian, cho những khoảnh khắc quý phái và đáng nhớ nhất.
          </p>
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => navigate("/collections")}
            className="mt-8 self-start flex items-center gap-2.5 bg-gradient-to-r from-[#1a1a1a] via-[#2d2d2d] to-[#1a1a1a] text-[#f5e6ca] px-8 py-4 rounded-xl font-bold text-[12px] uppercase tracking-[0.14em] luxury-btn-gold-shine border border-[#c9a869]/40 shadow-lg hover:shadow-[0_10px_25px_rgba(184,147,90,0.3)] transition-all duration-300"
          >
            Khám Phá Ngay
            <FontAwesomeIcon icon={faArrowRight} className="text-[11px] text-[#e8c471]" />
          </motion.button>
        </div>

        {/* RIGHT: lưới 3 ảnh — 1 ảnh lớn + 2 ảnh nhỏ xếp chồng */}
        <div className="grid grid-cols-2 gap-5 h-[440px] lg:h-[470px]">
          <motion.button
            type="button"
            whileHover={{ y: -6, scale: 1.01 }}
            transition={{ duration: 0.4 }}
            onClick={() => navigate(`/collections?q=${encodeURIComponent("Váy Dạ Hội")}`)}
            className="group relative rounded-2xl overflow-hidden text-left border border-[#c9a869]/30 hover:border-[#e8c471] shadow-md hover:shadow-[0_18px_40px_rgba(184,147,90,0.25)] transition-all duration-500 luxury-btn-gold-shine"
          >
            <img
              src={EVENING_IMG}
              alt="Evening Glow"
              className="absolute inset-0 w-full h-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-108"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-7">
              <span className="text-[#e8c471] text-[10px] uppercase tracking-widest font-semibold block mb-1">Couture</span>
              <h3 className="text-white font-bold text-3xl" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                Evening Glow
              </h3>
              <p className="text-white/80 text-[13px] mt-1 font-light">Dạ hội lấp lánh kiêu sa</p>
              <span className="inline-flex items-center gap-2 text-[#f1d77e] text-[11px] font-bold uppercase tracking-wider mt-4 group-hover:gap-3 transition-all">
                Khám phá ngay <FontAwesomeIcon icon={faArrowRight} className="text-[10px]" />
              </span>
            </div>
          </motion.button>

          <div className="grid grid-rows-2 gap-5">
            {TILES.map((tile) => (
              <motion.button
                key={tile.key}
                type="button"
                whileHover={{ y: -4, scale: 1.01 }}
                transition={{ duration: 0.4 }}
                onClick={() => navigate(`/collections?q=${encodeURIComponent(tile.keyword)}`)}
                className="group relative rounded-2xl overflow-hidden text-left border border-[#c9a869]/30 hover:border-[#e8c471] shadow-md hover:shadow-[0_12px_30px_rgba(184,147,90,0.2)] transition-all duration-500 luxury-btn-gold-shine"
              >
                <img
                  src={tile.image}
                  alt={tile.title}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-108"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <h3 className="text-white font-bold text-[18px]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                    {tile.title}
                  </h3>
                  <p className="text-white/85 text-[12px] font-light">{tile.desc}</p>
                  <span className="inline-flex items-center gap-1.5 text-[#f1d77e] text-[10px] font-semibold uppercase tracking-wider mt-2 group-hover:gap-2.5 transition-all">
                    Khám phá <FontAwesomeIcon icon={faArrowRight} className="text-[9px]" />
                  </span>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  );
}

