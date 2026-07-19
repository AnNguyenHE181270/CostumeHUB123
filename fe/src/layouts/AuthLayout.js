import React from "react";
import boutiqueImg from "../assets/login-boutique.png";

const SERIF = { fontFamily: "'Cormorant Garamond', serif" };

export default function AuthLayout({ children }) {
  const stats = [
    { num: "2,400+", label: "Outfit" },
    { num: "48h", label: "Giao hàng" },
    { num: "4.9★", label: "Đánh giá" },
  ];

  return (
    <div className="min-h-screen flex">
      {/* ── Left panel: boutique photo + overlay content ── */}
      <div className="hidden lg:flex w-[55%] relative overflow-hidden flex-col">
        <img
          src={boutiqueImg}
          alt="Luxe Rent boutique"
          className="absolute inset-0 w-full h-full object-cover object-right"
        />
        {/* Gradient để chữ bên trái luôn đọc được trên nền ảnh */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#f5efe3]/95 via-[#f5efe3]/55 to-transparent" />

        <div className="relative z-10 flex flex-col justify-between p-12 lg:p-14 h-full">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <span
              className="text-[#a8834f] text-3xl leading-none font-medium tracking-tight"
              style={SERIF}
            >
              LR
            </span>
            <span className="text-[#3d3529] text-[12px] font-semibold tracking-[0.4em] uppercase">
              Luxe Rent
            </span>
          </div>

          {/* Hero content */}
          <div className="space-y-7 max-w-[420px]">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-9 h-px bg-[#a8834f]/70" />
                <span className="text-[#a8834f] text-[11px] uppercase tracking-[0.32em] font-semibold">
                  Fashion Rental
                </span>
              </div>
              <h1
                className="text-[#2e2a22]"
                style={{ ...SERIF, fontSize: "64px", lineHeight: 1.05, letterSpacing: "-0.01em" }}
              >
                Phong cách
                <br />
                <span className="italic text-[#a8834f]">không giới hạn</span>
              </h1>
            </div>

            <p className="text-[#5c5340] text-[15px] leading-[1.7] max-w-[380px]">
              Hàng nghìn thiết kế cao cấp từ Valentino, Acne Studios, Zimmermann,
              The Row — sẵn sàng cho những khoảnh khắc đáng nhớ nhất của bạn.
            </p>

            {/* Stats card */}
            <div className="flex items-stretch bg-white/85 backdrop-blur-sm rounded-2xl shadow-[0_10px_30px_rgba(90,70,40,0.10)] w-fit">
              {stats.map((s, i) => (
                <div
                  key={s.label}
                  className={`px-7 py-4 text-center ${i > 0 ? "border-l border-[#eadfc8]" : ""}`}
                >
                  <div className="text-[#2e2a22] font-bold text-xl leading-tight">
                    {s.num}
                  </div>
                  <div className="text-[#8a7d63] text-[10px] uppercase tracking-[0.2em] mt-1.5 whitespace-nowrap">
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <span className="text-[#8a7d63] text-[10px] tracking-[0.25em] uppercase">
            © 2026 Luxe Rent • Hà Nội
          </span>
        </div>
      </div>

      {/* ── Right panel: form on cream background ── */}
      <div className="flex-1 flex items-center justify-center bg-[#faf6ee] px-6 py-16">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
