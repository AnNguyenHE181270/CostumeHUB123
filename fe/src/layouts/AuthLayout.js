import React from "react";

export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen flex">
      {/* ==================== LEFT HERO ==================== */}
      <div className="hidden lg:flex w-[45%] bg-midnight-coal relative overflow-hidden flex-col">
        {/* Gradient orbs */}
        <div className="absolute -top-[15%] -right-[5%] w-[480px] h-[480px] rounded-full bg-sunset-orange/15 blur-[120px]" />
        <div className="absolute -bottom-[5%] -left-[8%] w-[350px] h-[350px] rounded-full bg-rich-amethyst/10 blur-[100px]" />

        {/* Dot grid texture */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "radial-gradient(circle, #ffffff 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />

        <div className="relative z-10 flex flex-col justify-between p-f-100 h-full">
          {/* Logo */}
          <span className="text-cloud-white/60 text-[11px] font-medium tracking-[0.35em] uppercase">
            Vogue Rental
          </span>

          {/* Hero content */}
          <div className="space-y-10">
            <div>
              <div className="flex items-center gap-3 mb-8">
                <div className="w-8 h-px bg-desert-gold/50" />
                <span className="text-desert-gold text-[10px] uppercase tracking-[0.3em] font-medium">
                  Fashion Rental
                </span>
              </div>
              <h1
                className="text-cloud-white font-medium"
                style={{
                  fontSize: "73px",
                  lineHeight: 0.92,
                  letterSpacing: "-0.03em",
                }}
              >
                Phong cách
                <br />
                <span className="bg-clip-text text-transparent bg-sunset-orange">
                  không giới hạn
                </span>
              </h1>
            </div>

            <p className="text-muted-slate text-[14px] leading-[1.6] max-w-[340px]">
              Hàng nghìn thiết kế cao cấp từ Valentino, Acne Studios,
              Zimmermann, The Row — sẵn sàng cho những khoảnh khắc đáng nhớ nhất
              của bạn.
            </p>

            {/* Stats */}
            <div className="flex gap-14 pt-2">
              {[
                { num: "2,400+", label: "Outfit" },
                { num: "48h", label: "Giao hàng" },
                { num: "4.9★", label: "Đánh giá" },
              ].map((s) => (
                <div key={s.label}>
                  <div
                    className="text-cloud-white font-medium"
                    style={{
                      fontSize: "27px",
                      lineHeight: 1.15,
                      letterSpacing: "-0.015em",
                    }}
                  >
                    {s.num}
                  </div>
                  <div className="text-muted-slate/50 text-[10px] uppercase tracking-[0.2em] mt-1.5">
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <span className="text-muted-slate/25 text-[10px] tracking-[0.2em] uppercase">
            © 2026 Vogue Rental • Hà Nội
          </span>
        </div>
      </div>

      {/* ==================== RIGHT CONTENT ==================== */}
      <div className="flex-1 flex items-center justify-center bg-cloud-white px-6 py-16">
        {children}
      </div>
    </div>
  );
}