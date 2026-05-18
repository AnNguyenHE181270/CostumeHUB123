import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSearch,
  faShoppingBag,
  faArrowRight,
  faTruckFast,
  faShieldHalved,
  faUser,
  faShirt,          // Đã thay faSparkles bằng faShirt
  faGem,            // Thêm icon đá quý cho phần Bộ sưu tập
  faScissors        // Thêm icon kéo cho phần Dịch vụ
} from "@fortawesome/free-solid-svg-icons";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-canvas-white font-sans text-midnight-ink">
      {/* ==================== HEADER ==================== */}
      <header className="sticky top-0 z-50 bg-canvas-white/90 backdrop-blur-lg border-b border-sterling-gray/50">
        <div className="mx-auto max-w-[1200px] flex items-center justify-between h-16 px-6">
          {/* Logo */}
          <a href="/" className="text-abyssal-black font-medium tracking-[-0.02em]" style={{ fontSize: '20px' }}>
            VOGUE RENTAL
          </a>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-2">
            {["Bộ sưu tập", "Dịch vụ", "Về chúng tôi", "Lookbook"].map((item) => (
              <a
                key={item}
                href="#"
                className="px-4 py-2 text-[16px] font-normal text-midnight-ink hover:bg-ghost-fog rounded-navigation transition-colors"
                style={{ letterSpacing: '-0.064px' }}
              >
                {item}
              </a>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <button className="w-10 h-10 flex items-center justify-center hover:bg-ghost-fog rounded-full transition-colors">
              <FontAwesomeIcon icon={faSearch} className="text-[16px]" />
            </button>
            <button className="relative w-10 h-10 flex items-center justify-center hover:bg-ghost-fog rounded-full transition-colors">
              <FontAwesomeIcon icon={faShoppingBag} className="text-[16px]" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-warning-orange rounded-full"></span>
            </button>
            <button className="hidden md:flex items-center gap-2 bg-abyssal-black text-canvas-white px-4 py-2 rounded-[36px] text-[14px] font-medium hover:bg-midnight-ink transition-colors">
              <FontAwesomeIcon icon={faUser} className="text-[12px]" />
              Đăng nhập
            </button>
          </div>
        </div>
      </header>

      <main>
        {/* ==================== HERO SECTION ==================== */}
        <section className="bg-canvas-white pt-24 pb-32 px-6">
          <div className="mx-auto max-w-[1200px] text-center">
            <h1
              className="text-abyssal-black font-normal mx-auto"
              style={{
                fontSize: 'clamp(40px, 8vw, 83px)',
                lineHeight: 0.95,
                letterSpacing: '-0.03em',
                maxWidth: '900px'
              }}
            >
              Phong cách thuê,<br />Không giới hạn
            </h1>
            
            <p
              className="mt-8 text-midnight-ink/70 mx-auto"
              style={{
                fontSize: '16px',
                lineHeight: 1.6,
                letterSpacing: '-0.064px',
                maxWidth: '540px'
              }}
            >
              Khám phá hàng nghìn thiết kế cao cấp từ Valentino, Acne Studios, Zimmermann. Tự tin tỏa sáng trong mọi khoảnh khắc mà không cần sở hữu.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button className="flex items-center gap-2 bg-action-blue text-canvas-white px-6 py-3 rounded-buttons text-[16px] font-medium hover:bg-blue-700 transition-colors">
                Khám phá bộ sưu tập
                <FontAwesomeIcon icon={faArrowRight} className="text-[12px]" />
              </button>
              <button className="flex items-center gap-2 bg-canvas-white text-abyssal-black border border-abyssal-black px-6 py-3 rounded-buttons text-[16px] font-medium hover:bg-ghost-fog transition-colors">
                Cách thức hoạt động
              </button>
            </div>

            {/* Hero Visual Placeholder */}
            <div className="mt-20 border border-sterling-gray rounded-largeFeatures overflow-hidden bg-ghost-fog h-[400px] lg:h-[500px] flex items-center justify-center">
              <div className="text-center">
                <FontAwesomeIcon icon={faShirt} className="text-sterling-gray text-5xl mb-4" />
                <p className="text-midnight-ink/40 text-[14px] tracking-[-0.056px]">Hero Image / Video Placeholder</p>
              </div>
            </div>
          </div>
        </section>

        {/* ==================== FEATURED COLLECTIONS ==================== */}
        <section className="bg-ghost-fog py-24 px-6">
          <div className="mx-auto max-w-[1200px]">
            <div className="flex items-end justify-between mb-12">
              <div>
                <p className="text-warning-orange text-[14px] font-medium tracking-[-0.056px] mb-2">Nổi bật</p>
                <h2
                  className="text-abyssal-black font-normal"
                  style={{ fontSize: '40px', lineHeight: 1.1, letterSpacing: '-0.44px' }}
                >
                  Bộ sưu tập mới nhất
                </h2>
              </div>
              <a href="#" className="hidden md:flex items-center gap-2 text-[16px] font-medium hover:text-action-blue transition-colors">
                Xem tất cả <FontAwesomeIcon icon={faArrowRight} className="text-[12px]" />
              </a>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { title: "Dạ hội sang trọng", desc: "Valentino, The Row", color: "bg-[#e8e4df]" },
                { title: "Du lịch nghỉ dưỡng", desc: "Zimmermann, Acne Studios", color: "bg-[#dfe8e4]" },
                { title: "Streetwear đột phá", desc: "Balenciaga, Off-White", color: "bg-[#e0dfe8]" },
              ].map((col, i) => (
                <div key={i} className="group cursor-pointer">
                  <div className={`${col.color} rounded-cards h-[420px] flex items-end p-8 transition-transform duration-300 group-hover:scale-[1.02]`}>
                    <div>
                      <h3
                        className="text-abyssal-black font-normal"
                        style={{ fontSize: '32px', lineHeight: 1.1, letterSpacing: '-0.32px' }}
                      >
                        {col.title}
                      </h3>
                      <p className="text-midnight-ink/60 mt-2" style={{ fontSize: '16px', letterSpacing: '-0.064px' }}>
                        {col.desc}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ==================== HOW IT WORKS ==================== */}
        <section className="bg-canvas-white py-24 px-6">
          <div className="mx-auto max-w-[1200px]">
            <div className="text-center mb-16">
              <h2
                className="text-abyssal-black font-normal"
                style={{ fontSize: '48px', lineHeight: 1.1, letterSpacing: '-0.96px' }}
              >
                Đơn giản, tinh tế
              </h2>
              <p
                className="mt-4 text-midnight-ink/60 mx-auto"
                style={{ fontSize: '16px', lineHeight: 1.4, letterSpacing: '-0.064px', maxWidth: '500px' }}
              >
                Chỉ với 3 bước, bạn đã có thể xuất hiện với phong cách hoàn toàn mới.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { icon: faSearch, title: "Chọn thiết kế", desc: "Duyệt qua hàng nghìn outfit cao cấp từ các nhà mốt hàng đầu thế giới." },
                { icon: faTruckFast, title: "Giao tận nơi", desc: "Trang phục được đóng gói cẩn thận và giao hỏa tốc trong vòng 48h." },
                { icon: faShieldHalved, title: "Trả dễ dàng", desc: "Mặc xong chỉ cần gói lại và đặt lịch lấy hàng. Phí giặt sấy đã bao gồm." },
              ].map((step, i) => (
                <div key={i} className="bg-ghost-fog rounded-cards pt-16 pb-12 px-11">
                  <div className="w-12 h-12 bg-canvas-white rounded-2xl flex items-center justify-center mb-6">
                    <FontAwesomeIcon icon={step.icon} className="text-action-blue text-[18px]" />
                  </div>
                  <h3
                    className="text-abyssal-black font-normal mb-3"
                    style={{ fontSize: '32px', lineHeight: 1.1, letterSpacing: '-0.32px' }}
                  >
                    {step.title}
                  </h3>
                  <p
                    className="text-midnight-ink/60"
                    style={{ fontSize: '16px', lineHeight: 1.4, letterSpacing: '-0.064px' }}
                  >
                    {step.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ==================== CTA BANNER ==================== */}
        <section className="bg-ghost-fog py-24 px-6">
          <div className="mx-auto max-w-[900px] text-center">
            <h2
              className="text-abyssal-black font-normal"
              style={{ fontSize: '48px', lineHeight: 1.1, letterSpacing: '-0.96px' }}
            >
              Sẵn sàng nâng tầm phong cách?
            </h2>
            <p
              className="mt-4 text-midnight-ink/60 mx-auto"
              style={{ fontSize: '16px', lineHeight: 1.4, letterSpacing: '-0.064px', maxWidth: '460px' }}
            >
              Đăng ký ngay và nhận ưu đãi 20% cho lần thuê đầu tiên.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button className="flex items-center gap-2 bg-warning-orange text-canvas-white px-6 py-3 rounded-buttons text-[16px] font-medium hover:bg-orange-600 transition-colors">
                Bắt đầu ngay
                <FontAwesomeIcon icon={faArrowRight} className="text-[12px]" />
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* ==================== FOOTER ==================== */}
      <footer className="bg-ghost-fog border-t border-sterling-gray pt-16 pb-8 px-6">
        <div className="mx-auto max-w-[1200px]">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            {/* Brand */}
            <div className="md:col-span-1">
              <a href="/" className="text-abyssal-black font-medium tracking-[-0.02em]" style={{ fontSize: '20px' }}>
                VOGUE RENTAL
              </a>
              <p className="mt-4 text-midnight-ink/50" style={{ fontSize: '14px', lineHeight: 1.49, letterSpacing: '-0.056px' }}>
                Nền tảng cho thuê trang phục cao cấp hàng đầu Việt Nam.
              </p>
            </div>

            {/* Links */}
            <div>
              <h4 className="text-[14px] font-medium uppercase tracking-[-0.056px] text-midnight-ink/40 mb-4">Dịch vụ</h4>
              <ul className="space-y-3">
                {["Thuê trang phục", "Tư vấn phong cách", "Đặt cho sự kiện", "Đối tác thiết kế"].map((link) => (
                  <li key={link}>
                    <a href="#" className="text-[16px] text-midnight-ink/70 hover:text-abyssal-black transition-colors" style={{ letterSpacing: '-0.064px' }}>
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-[14px] font-medium uppercase tracking-[-0.056px] text-midnight-ink/40 mb-4">Công ty</h4>
              <ul className="space-y-3">
                {["Về chúng tôi", "Cơ hội việc làm", "Chính sách bảo mật", "Điều khoản"].map((link) => (
                  <li key={link}>
                    <a href="#" className="text-[16px] text-midnight-ink/70 hover:text-abyssal-black transition-colors" style={{ letterSpacing: '-0.064px' }}>
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-[14px] font-medium uppercase tracking-[-0.056px] text-midnight-ink/40 mb-4">Liên hệ</h4>
              <ul className="space-y-3">
                {["help@voguerental.vn", "0912 345 678", "Hà Nội, Việt Nam"].map((link) => (
                  <li key={link}>
                    <a href="#" className="text-[16px] text-midnight-ink/70 hover:text-abyssal-black transition-colors" style={{ letterSpacing: '-0.064px' }}>
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-sterling-gray pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-[14px] text-midnight-ink/40" style={{ letterSpacing: '-0.056px' }}>
              © 2026 Vogue Rental. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              {["Instagram", "TikTok", "Pinterest"].map((social) => (
                <a key={social} href="#" className="text-[14px] text-midnight-ink/50 hover:text-abyssal-black transition-colors" style={{ letterSpacing: '-0.056px' }}>
                  {social}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}