import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronRight } from "@fortawesome/free-solid-svg-icons";

const CATEGORIES = [
  {
    name: "Dạ Hội",
    desc: "Lộng lẫy & kiêu sa",
    keyword: "Váy Dạ Hội",
    image: "/images/homepage/cat_evening.png",
  },
  {
    name: "Áo Dài",
    desc: "Tinh tế & duyên dáng",
    keyword: "Áo Dài",
    image: "/images/homepage/cat_aodai.png",
  },
  {
    name: "Váy Dạ Tiệc",
    desc: "Thanh lịch & cuốn hút",
    keyword: "Váy Dạ Tiệc",
    image: "/images/homepage/cat_cocktail.png",
  },
  {
    name: "Đầm Trắng",
    desc: "Thanh khiết & sang trọng",
    keyword: "Đầm Trắng",
    image: "/images/homepage/cat_wedding.png",
  },
];

export default function CategoryShowcase() {
  const navigate = useNavigate();

  return (
    <section className="pt-6 pb-12 px-6">
      <div className="max-w-[1300px] mx-auto">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {CATEGORIES.map((cat, i) => (
            <motion.button
              key={cat.name}
              type="button"
              onClick={() => navigate(`/collections?q=${encodeURIComponent(cat.keyword)}`)}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              whileHover={{ y: -8, scale: 1.02 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
              className="group relative rounded-2xl overflow-hidden aspect-[4/3] text-left border border-[#c9a869]/30 hover:border-[#e8c471] shadow-md hover:shadow-[0_16px_35px_rgba(184,147,90,0.22)] transition-all duration-500 luxury-btn-gold-shine"
            >
              <img
                src={cat.image}
                alt={cat.name}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
              />
              {/* Overlay gradients for luxury depth */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/65 via-black/15 to-black/40 group-hover:from-black/75 group-hover:to-black/50 transition-colors duration-500" />

              <div className="absolute top-0 left-0 right-0 p-5 z-10">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-[10px] text-[#e8c471]">✦</span>
                  <h3 className="text-[#f1d77e] font-bold text-[12px] uppercase tracking-[0.14em] drop-shadow-sm">
                    {cat.name}
                  </h3>
                </div>
                <p className="text-white/95 text-[12px] font-light tracking-wide">{cat.desc}</p>
              </div>

              <div className="absolute bottom-4 left-4 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-[#1a1a1a] text-[13px] shadow-lg group-hover:bg-gradient-to-br group-hover:from-[#d4af37] group-hover:to-[#8a6a2f] group-hover:text-white group-hover:scale-110 transition-all duration-400">
                <FontAwesomeIcon icon={faChevronRight} className="group-hover:translate-x-0.5 transition-transform" />
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </section>
  );
}

