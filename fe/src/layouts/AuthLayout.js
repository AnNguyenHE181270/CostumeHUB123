import React from "react";

const DRESSES = [
  { cx: 76, w: 16, hem: 30, h: 90, fill: "#efe3c8" },
  { cx: 110, w: 14, hem: 26, h: 110, fill: "#d8b978" },
  { cx: 144, w: 15, hem: 28, h: 96, fill: "#f6f1e4" },
  { cx: 176, w: 14, hem: 24, h: 104, fill: "#c9a15a" },
];

function dressPath(cx, top, w, hem, h) {
  const waist = w * 0.5;
  const waistY = top + h * 0.45;
  const hemY = top + h;
  return `M${cx - w},${top} C${cx - w - 2},${top + h * 0.2} ${cx - waist - 2},${top + h * 0.3} ${cx - waist},${waistY} C${cx - hem + 4},${top + h * 0.72} ${cx - hem},${hemY - 10} ${cx - hem},${hemY} L${cx + hem},${hemY} C${cx + hem},${hemY - 10} ${cx + hem - 4},${top + h * 0.72} ${cx + waist},${waistY} C${cx + waist + 2},${top + h * 0.3} ${cx + w + 2},${top + h * 0.2} ${cx + w},${top} Z`;
}

function BoutiqueIllustration() {
  return (
    <svg
      viewBox="0 0 260 520"
      className="w-full h-full"
      preserveAspectRatio="xMidYMax meet"
    >
      <path
        d="M20,486 L20,206 A100,100 0 0 1 220,206 L220,486 Z"
        fill="#faf5e8"
        stroke="#e6d8b4"
        strokeWidth="2"
      />

      <line x1="58" y1="152" x2="186" y2="152" stroke="#b6934f" strokeWidth="3" strokeLinecap="round" />

      {DRESSES.map((d) => (
        <g key={d.cx}>
          <path
            d={`M${d.cx - 13},${152} L${d.cx},166 L${d.cx + 13},152`}
            fill="none"
            stroke="#8a7350"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d={dressPath(d.cx, 166, d.w, d.hem, d.h)} fill={d.fill} opacity="0.95" />
        </g>
      ))}

      <ellipse cx="80" cy="428" rx="46" ry="12" fill="#f4efe4" stroke="#e0d3ae" strokeWidth="1.5" />
      <rect x="76" y="428" width="8" height="42" rx="3" fill="#e6dcc4" />
      <ellipse cx="80" cy="472" rx="26" ry="7" fill="#e6dcc4" />
    </svg>
  );
}

export default function AuthLayout({ children }) {
  const stats = [
    { num: "2,400+", label: "Outfit" },
    { num: "48h", label: "Giao hàng" },
    { num: "4.9★", label: "Đánh giá" },
  ];

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex w-[45%] relative overflow-hidden flex-col bg-gradient-to-br from-[#f8f2e5] via-[#f1e6d0] to-[#e9d9b4]">
        <div className="absolute -top-[10%] -left-[10%] w-[420px] h-[420px] rounded-full bg-white/50 blur-[110px]" />
        <div className="absolute -bottom-[8%] -right-[8%] w-[380px] h-[380px] rounded-full bg-warning-400/25 blur-[100px]" />

        <div className="absolute right-0 bottom-0 w-[42%] h-[72%] pointer-events-none">
          <BoutiqueIllustration />
        </div>

        <div className="relative z-10 flex flex-col justify-between p-12 lg:p-16 h-full">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-md bg-gradient-to-br from-warning-400 to-warning-600 flex items-center justify-center text-white font-display-lux font-bold text-sm shadow-sm shadow-warning-500/30">
              LR
            </div>
            <span className="text-text-primary text-[12px] font-medium tracking-[0.35em] uppercase">
              Luxe Rent
            </span>
          </div>

          <div className="space-y-8 max-w-[380px]">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-px bg-warning-600/60" />
                <span className="text-warning-600 text-[10px] uppercase tracking-[0.3em] font-medium">
                  Fashion Rental
                </span>
              </div>
              <h1
                className="text-text-primary font-medium max-w-[300px]"
                style={{
                  fontSize: "52px",
                  lineHeight: 1.08,
                  letterSpacing: "-0.02em",
                }}
              >
                Phong cách
                <br />
                <span className="italic bg-clip-text text-transparent bg-gradient-to-r from-warning-500 to-warning-600">
                  không giới hạn
                </span>
              </h1>
            </div>

            <p className="text-text-secondary text-[14px] leading-[1.6] max-w-[300px]">
              Hàng nghìn thiết kế cao cấp từ Valentino, Acne Studios,
              Zimmermann, The Row — sẵn sàng cho những khoảnh khắc đáng nhớ nhất
              của bạn.
            </p>

            <div className="flex items-stretch bg-white/70 backdrop-blur-sm rounded-2xl border border-white/70 shadow-sm w-fit">
              {stats.map((s, i) => (
                <div
                  key={s.label}
                  className={`px-5 py-3.5 ${i > 0 ? "border-l border-[#e2d4ac]" : ""}`}
                >
                  <div className="text-text-primary font-semibold text-lg leading-tight">
                    {s.num}
                  </div>
                  <div className="text-text-secondary/80 text-[9px] uppercase tracking-[0.18em] mt-1 whitespace-nowrap">
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <span className="text-[#8a7350] text-[10px] tracking-[0.2em] uppercase">
            © 2026 Luxe Rent • Hà Nội
          </span>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center bg-background px-6 py-16">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
