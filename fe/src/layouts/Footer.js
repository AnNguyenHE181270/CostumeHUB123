import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPhone,
  faEnvelope,
  faLocationDot,
} from "@fortawesome/free-solid-svg-icons";
import {
  faFacebookF,
  faInstagram,
  faTwitter,
  faPinterestP,
  faTiktok,
} from "@fortawesome/free-brands-svg-icons";

/* ─── Data ─── */
const CATEGORIES = [
  { label: "Áo Dài", href: "/ao-dai" },
  { label: "Váy Du Lịch", href: "/vay-du-lich" },
  { label: "Váy Tiệc", href: "/vay-tiec" },
  { label: "Pháp Phục", href: "/phap-phuc" },
  { label: "Set Yếm", href: "/set-yem" },
];

const INFO_LINKS = [
  { label: "Về Chúng Tôi", href: "/ve-chung-toi" },
  { label: "Câu Hỏi Thường Gặp", href: "/faq" },
  { label: "Blog & Tin Tức", href: "/blog" },
  { label: "Chính Sách Bảo Mật", href: "/chinh-sach-bao-mat" },
  { label: "Điều Khoản Dịch Vụ", href: "/dieu-khoan" },
];

const SOCIALS = [
  { icon: faFacebookF, href: "#", label: "Facebook" },
  { icon: faInstagram, href: "#", label: "Instagram" },
  { icon: faTwitter, href: "#", label: "Twitter" },
  { icon: faPinterestP, href: "#", label: "Pinterest" },
  { icon: faTiktok, href: "#", label: "TikTok" },
];

export default function Footer() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email.trim()) {
      // TODO: Integrate with API
      setSubscribed(true);
      setTimeout(() => setSubscribed(false), 3000);
      setEmail("");
    }
  };

  return (
    <footer className="bg-[#1a1a1a] text-white">
      {/* ════════ MAIN FOOTER ════════ */}
      <div className="mx-auto max-w-[1200px] px-6 pt-16 pb-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
          {/* Col 1: Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link to="/" className="inline-block">
              <h2
                className="text-white font-semibold tracking-[0.04em]"
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: "24px",
                  lineHeight: 1,
                }}
              >
                CostumeHUB
              </h2>
              <span className="block text-[9px] tracking-[0.15em] uppercase text-[#858585] mt-1">
                Cho Thuê Trang Phục Cao Cấp
              </span>
            </Link>

            <p className="mt-5 text-[13px] leading-[1.7] text-[#999] max-w-[280px]">
              Chuyên cho thuê trang phục cao cấp, chính hãng cho mọi dịp đặc
              biệt của bạn. Chúng tôi cam kết chất lượng và sự hài lòng khách
              hàng.
            </p>

            {/* Social Icons */}
            <div className="flex items-center gap-3 mt-6">
              {SOCIALS.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="w-9 h-9 rounded-full border border-[#333] flex items-center justify-center
                             text-[#999] hover:text-white hover:border-white transition-all duration-200"
                >
                  <FontAwesomeIcon icon={social.icon} className="text-[13px]" />
                </a>
              ))}
            </div>
          </div>

          {/* Col 2: Danh Mục */}
          <div>
            <h3 className="text-[12px] uppercase tracking-[0.15em] font-semibold text-white mb-5">
              Danh Mục
            </h3>
            <ul className="space-y-3">
              {CATEGORIES.map((cat) => (
                <li key={cat.href}>
                  <Link
                    to={cat.href}
                    className="text-[14px] text-[#999] hover:text-white transition-colors duration-200"
                  >
                    {cat.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: Thông Tin */}
          <div>
            <h3 className="text-[12px] uppercase tracking-[0.15em] font-semibold text-white mb-5">
              Thông Tin
            </h3>
            <ul className="space-y-3">
              {INFO_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-[14px] text-[#999] hover:text-white transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4: Đăng Ký Nhận Tin */}
          <div>
            <h3 className="text-[12px] uppercase tracking-[0.15em] font-semibold text-white mb-5">
              Đăng Ký Nhận Tin
            </h3>
            <p className="text-[13px] text-[#999] leading-[1.6] mb-5">
              Nhận thông tin mới nhất về các bộ sưu tập và ưu đãi độc quyền.
            </p>

            <form onSubmit={handleSubscribe} className="space-y-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email của bạn"
                required
                className="w-full bg-[#2a2a2a] border border-[#333] rounded-md px-4 py-3
                           text-[13px] text-white placeholder:text-[#666]
                           outline-none focus:border-[#666] transition-colors"
              />
              <button
                type="submit"
                className="w-full bg-white text-[#1a1a1a] rounded-md px-4 py-3
                           text-[13px] font-semibold uppercase tracking-[0.08em]
                           hover:bg-[#f0f0f0] active:scale-[0.98] transition-all duration-200"
              >
                {subscribed ? "Đã Đăng Ký ✓" : "Đăng Ký"}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* ════════ CONTACT BAR ════════ */}
      <div className="border-t border-[#2a2a2a]">
        <div className="mx-auto max-w-[1200px] px-6 py-5">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-[13px] text-[#999]">
              <FontAwesomeIcon
                icon={faPhone}
                className="text-[12px] text-[#666]"
              />
              <span className="text-[10px] uppercase tracking-[0.1em] text-[#666] mr-1">
                Hỗ trợ điện thoại
              </span>
              <span className="text-white font-medium">(+84) 93 453 0145</span>
            </div>

            <div className="flex items-center gap-2 text-[13px] text-[#999]">
              <FontAwesomeIcon
                icon={faEnvelope}
                className="text-[12px] text-[#666]"
              />
              <span className="text-[10px] uppercase tracking-[0.1em] text-[#666] mr-1">
                Email
              </span>
              <a
                href="mailto:info@costumehub.com"
                className="text-white font-medium hover:underline"
              >
                info@costumehub.com
              </a>
            </div>

            <div className="flex items-center gap-2 text-[13px] text-[#999]">
              <FontAwesomeIcon
                icon={faLocationDot}
                className="text-[12px] text-[#666]"
              />
              <span className="text-[10px] uppercase tracking-[0.1em] text-[#666] mr-1">
                Địa chỉ
              </span>
              <span className="text-white font-medium">
                215A đối diện đại học FPT, Hòa Lạc, Hà Nội
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ════════ COPYRIGHT BAR ════════ */}
      <div className="bg-[#111] border-t border-[#222]">
        <div className="mx-auto max-w-[1200px] px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-[12px] text-[#666]">
            © 2026 CostumeHUB. Tất cả các quyền được bảo lưu.
          </p>
          <div className="flex items-center gap-6">
            {[
              { label: "Chính Sách Bảo Mật", href: "/chinh-sach-bao-mat" },
              { label: "Điều Khoản Sử Dụng", href: "/dieu-khoan" },
              { label: "Sitemap", href: "/sitemap" },
            ].map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="text-[12px] text-[#666] hover:text-white transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
