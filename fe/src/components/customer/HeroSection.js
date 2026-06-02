import React from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight } from "@fortawesome/free-solid-svg-icons";

export default function HeroSection() {
  const navigate = useNavigate();

  const scrollToCategories = () => {
    const el = document.getElementById("category-section");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="bg-[#faf9f7] relative overflow-hidden">
      <div className="mx-auto max-w-[1200px] px-6 py-16 md:py-24">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-8">
          {/* Left Content */}
          <div className="flex-1 text-center lg:text-left">
            <p className="text-[11px] uppercase tracking-[0.2em] text-[#858585] mb-4 font-medium">
              Cho Thuê Trang Phục Cao Cấp
            </p>
            <h1
              className="text-[#1a1a1a] font-bold leading-[1.1] text-4xl md:text-5xl lg:text-[56px]"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              Trang Phục
              <br />
              Yêu Thích
            </h1>
            <p className="mt-6 text-[15px] text-[#707070] leading-[1.7] max-w-[440px] mx-auto lg:mx-0">
              Khám phá bộ sưu tập trang phục cao cấp, chính hãng cho những dịp
              đặc biệt nhất của bạn.
            </p>

            {/* CTA Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row items-center gap-3 lg:justify-start justify-center">
              <button
                onClick={scrollToCategories}
                className="bg-[#1a1a1a] text-white text-[12px] uppercase tracking-[0.1em] font-semibold
                           px-8 py-3.5 rounded hover:bg-[#333] active:scale-[0.98] transition-all duration-200"
              >
                Khám Phá Ngay
              </button>
              <button
                onClick={scrollToCategories}
                className="border border-[#1a1a1a] text-[#1a1a1a] text-[12px] uppercase tracking-[0.1em] font-semibold
                           px-8 py-3.5 rounded hover:bg-[#1a1a1a] hover:text-white active:scale-[0.98] transition-all duration-200"
              >
                Xem Danh Mục
              </button>
            </div>

            {/* Stats */}
            <div className="mt-12 flex items-center gap-10 lg:justify-start justify-center">
              {[
                { value: "500+", label: "Sản Phẩm" },
                { value: "2000+", label: "Khách Hàng" },
                { value: "24/7", label: "Hỗ Trợ" },
              ].map((stat, i) => (
                <div key={i} className="text-center lg:text-left">
                  <p className="text-[#1a1a1a] text-2xl md:text-3xl font-bold tracking-tight">
                    {stat.value}
                  </p>
                  <p className="text-[11px] uppercase tracking-[0.1em] text-[#858585] mt-1 font-medium">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Right — Illustration */}
          <div className="flex-1 flex items-center justify-center">
            <div className="relative w-full max-w-[420px] aspect-[3/4] bg-gradient-to-br from-[#e8e4df] to-[#d4cfc9] rounded-[2rem] overflow-hidden flex items-center justify-center shadow-lg">
              <div className="text-center p-8">
                <svg
                  className="w-24 h-24 mx-auto text-[#b0a99e] mb-4"
                  viewBox="0 0 64 64"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="M32 8 L24 28 L16 28 L12 56 L52 56 L48 28 L40 28 Z" />
                  <path d="M26 28 L26 20 Q26 12 32 12 Q38 12 38 20 L38 28" />
                  <circle cx="32" cy="16" r="2" fill="currentColor" />
                </svg>
                <p className="text-[#9a9390] text-sm font-medium tracking-wide">
                  Hình Ảnh Sản Phẩm
                </p>
              </div>
              {/* Decorative elements */}
              <div className="absolute top-6 right-6 w-16 h-16 border border-[#c4bdb5] rounded-full opacity-40" />
              <div className="absolute bottom-8 left-8 w-10 h-10 border border-[#c4bdb5] rounded-full opacity-30" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
