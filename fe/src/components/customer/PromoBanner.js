import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight } from "@fortawesome/free-solid-svg-icons";

const CLOUD = "https://res.cloudinary.com/du0xdjnrx/image/upload";

const EVENING_IMG = `${CLOUD}/q_auto,f_auto/v1783952551/homepage/promo.jpg`;
const PURE_WHITE_IMG = `${CLOUD}/c_fill,g_auto,w_700,h_460,q_auto,f_auto/v1783952550/homepage/banner_wedding.jpg`;
const MODERN_CHIC_IMG = `${CLOUD}/c_fill,g_auto,w_700,h_460,q_auto,f_auto/v1783952547/homepage/cat_vest.jpg`;

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
    <section className="px-6 py-14">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.7 }}
        className="max-w-[1300px] mx-auto grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-8 items-stretch"
      >
        {/* LEFT TEXT */}
        <div className="flex flex-col justify-center">
          <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#b8935a] mb-3">
            Bộ Sưu Tập Mới
          </span>
          <h2
            className="text-4xl lg:text-5xl font-bold text-[#1a1a1a] leading-[1.05]"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            Timeless<br />Elegance
          </h2>
          <p className="text-gray-500 mt-4 text-[14px] leading-relaxed max-w-xs">
            Thanh lịch vượt thời gian, cho những khoảnh khắc đáng nhớ.
          </p>
          <button
            onClick={() => navigate("/collections")}
            className="mt-8 self-start flex items-center gap-2 bg-[#1a1a1a] text-white px-7 py-3.5 rounded-xl font-semibold text-[12px] uppercase tracking-[0.12em] hover:bg-[#b8935a] active:scale-[0.98] transition-all duration-300 shadow-md hover:shadow-[0_8px_20px_rgba(184,147,90,0.25)]"
          >
            Khám Phá Ngay
            <FontAwesomeIcon icon={faArrowRight} className="text-[11px]" />
          </button>
        </div>

        {/* RIGHT: lưới 3 ảnh — 1 ảnh lớn + 2 ảnh nhỏ xếp chồng */}
        <div className="grid grid-cols-2 gap-4 h-[440px] lg:h-[460px]">
          <button
            type="button"
            onClick={() => navigate(`/collections?q=${encodeURIComponent("Váy Dạ Hội")}`)}
            className="group relative rounded-2xl overflow-hidden text-left"
          >
            <img
              src={EVENING_IMG}
              alt="Evening Glow"
              className="absolute inset-0 w-full h-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <h3 className="text-white font-bold text-2xl" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                Evening Glow
              </h3>
              <p className="text-white/80 text-[12px] mt-1">Dạ hội lấp lánh</p>
              <span className="inline-flex items-center gap-1.5 text-white text-[11px] font-semibold uppercase tracking-wider mt-3 group-hover:gap-2.5 transition-all">
                Khám phá <FontAwesomeIcon icon={faArrowRight} className="text-[10px]" />
              </span>
            </div>
          </button>

          <div className="grid grid-rows-2 gap-4">
            {TILES.map((tile) => (
              <button
                key={tile.key}
                type="button"
                onClick={() => navigate(`/collections?q=${encodeURIComponent(tile.keyword)}`)}
                className="group relative rounded-2xl overflow-hidden text-left"
              >
                <img
                  src={tile.image}
                  alt={tile.title}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/5 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h3 className="text-white font-bold text-[16px]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                    {tile.title}
                  </h3>
                  <p className="text-white/80 text-[11px]">{tile.desc}</p>
                  <span className="inline-flex items-center gap-1.5 text-white text-[10px] font-semibold uppercase tracking-wider mt-1.5">
                    Khám phá <FontAwesomeIcon icon={faArrowRight} className="text-[9px]" />
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  );
}
