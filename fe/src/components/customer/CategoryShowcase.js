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
    <section className="pt-4 pb-10 px-6">
      <div className="max-w-[1300px] mx-auto">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {CATEGORIES.map((cat, i) => (
            <motion.button
              key={cat.name}
              type="button"
              onClick={() => navigate(`/collections?q=${encodeURIComponent(cat.keyword)}`)}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.06 }}
              className="group relative rounded-2xl overflow-hidden aspect-[4/3] text-left border border-transparent hover:border-[#b8935a]/40 shadow-sm hover:shadow-lg transition-all duration-300"
            >
              <img
                src={cat.image}
                alt={cat.name}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/5 to-transparent" />
              <div className="absolute top-0 left-0 right-0 p-4">
                <h3 className="text-[#e8c98a] font-bold text-[11px] uppercase tracking-[0.12em]">
                  {cat.name}
                </h3>
                <p className="text-white/90 text-[11px] mt-0.5 font-light">{cat.desc}</p>
              </div>
              <div className="absolute bottom-3 left-3 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center text-[#1a1a1a] text-[12px] shadow-sm group-hover:bg-[#1a1a1a] group-hover:text-white transition-colors duration-300">
                <FontAwesomeIcon icon={faChevronRight} />
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </section>
  );
}
