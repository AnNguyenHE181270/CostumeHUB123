import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const BANNER_IMAGE =
  "https://res.cloudinary.com/du0xdjnrx/image/upload/v1783952550/homepage/banner_wedding.jpg";

export default function EditorialBanner() {
  const navigate = useNavigate();

  return (
    <section className="px-6 py-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.7 }}
        className="group relative max-w-[1300px] mx-auto rounded-2xl overflow-hidden min-h-[420px] flex items-center border border-[#eee] hover:border-[#b8935a]/30 transition-all duration-500 hover:shadow-xl"
      >
        <img
          src={BANNER_IMAGE}
          alt="Tỏa sáng theo cách của bạn"
          className="absolute inset-0 w-full h-full object-cover object-top transition-transform duration-[6000ms] ease-out group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/35 to-transparent" />
        <div className="relative z-10 px-8 sm:px-14 py-16 max-w-lg">
          <h2
            className="text-3xl sm:text-4xl font-bold text-white leading-tight"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            Tỏa Sáng<br />Theo Cách Của Bạn
          </h2>
          <p className="text-white/85 mt-4 text-[14px] leading-relaxed">
            Hơn 1000+ thiết kế cao cấp sẵn sàng đồng hành cùng bạn trong mọi khoảnh khắc đáng nhớ.
          </p>
          <button
            onClick={() => navigate("/products")}
            className="mt-8 bg-white text-[#1a1a1a] px-7 py-3.5 rounded-xl font-semibold text-[12px] uppercase tracking-[0.12em] hover:bg-[#b8935a] hover:text-white active:scale-[0.98] transition-all duration-300 shadow-md hover:shadow-[0_8px_20px_rgba(184,147,90,0.3)]"
          >
            Khám Phá Bộ Sưu Tập
          </button>
        </div>
      </motion.div>
    </section>
  );
}
