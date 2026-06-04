import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRightFromBracket, faCamera, faUser, faEnvelope, faPhone, faCalendarDay, faVenusMars } from "@fortawesome/free-solid-svg-icons";
import { Link } from "react-router-dom";

export default function ProfilePage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-12 md:py-20 font-body">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold text-[#1a1a1a] tracking-tight mb-4" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            Hồ Sơ Của Tôi
          </h1>
          <p className="text-[14px] text-[#858585]">
            Quản lý thông tin cá nhân và tài khoản của bạn.
          </p>
        </div>
        <div className="shrink-0">
          {/* Nút Đăng xuất ở ngay đây để user dễ thấy */}
          <button className="bg-red-50 text-red-600 text-[12px] uppercase tracking-[0.1em] font-semibold px-6 py-3 hover:bg-red-100 transition-colors flex items-center gap-2 border border-red-200">
            <FontAwesomeIcon icon={faArrowRightFromBracket} /> Đăng xuất
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Column: Avatar & Quick Links */}
        <div className="lg:col-span-4 space-y-8">
          {/* Avatar Card */}
          <div className="bg-white border border-[#eaeaea] p-8 text-center flex flex-col items-center">
            <div className="relative group mb-6">
              <div className="w-32 h-32 rounded-full border-2 border-[#eaeaea] bg-[#faf9f7] text-[#1a1a1a] flex items-center justify-center font-bold text-4xl overflow-hidden relative shadow-sm">
                <img src="https://i.pravatar.cc/300" alt="User Avatar" className="w-full h-full object-cover" />
                
                {/* Upload Overlay */}
                <label className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-pointer">
                  <FontAwesomeIcon icon={faCamera} className="text-[#1a1a1a] text-xl mb-1" />
                  <span className="text-[#1a1a1a] text-[10px] font-semibold uppercase tracking-wider">Đổi ảnh</span>
                  <input type="file" accept="image/*" className="hidden" />
                </label>
              </div>
            </div>
            
            <h2 className="text-2xl font-bold text-[#1a1a1a] mb-1" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Nguyễn Văn A</h2>
            <p className="text-[12px] text-[#999] tracking-[0.1em] uppercase">Thành viên Vogue</p>
          </div>

          {/* Sidebar Menu */}
          <div className="bg-white border border-[#eaeaea]">
            <ul className="flex flex-col">
              <li>
                <Link to="/profile" className="block px-6 py-4 text-[13px] font-semibold tracking-[0.05em] uppercase text-[#1a1a1a] bg-[#faf9f7] border-l-4 border-[#1a1a1a]">
                  Thông tin cá nhân
                </Link>
              </li>
              <li className="border-t border-[#eaeaea]">
                <Link to="/rental-history" className="block px-6 py-4 text-[13px] font-semibold tracking-[0.05em] uppercase text-[#858585] hover:text-[#1a1a1a] hover:bg-[#faf9f7] transition-colors border-l-4 border-transparent">
                  Lịch sử thuê đồ
                </Link>
              </li>
              <li className="border-t border-[#eaeaea]">
                <Link to="/wishlist" className="block px-6 py-4 text-[13px] font-semibold tracking-[0.05em] uppercase text-[#858585] hover:text-[#1a1a1a] hover:bg-[#faf9f7] transition-colors border-l-4 border-transparent">
                  Danh sách yêu thích
                </Link>
              </li>
              <li className="border-t border-[#eaeaea]">
                <button className="w-full text-left px-6 py-4 text-[13px] font-semibold tracking-[0.05em] uppercase text-red-600 hover:bg-red-50 transition-colors border-l-4 border-transparent">
                  Đăng xuất
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Right Column: Edit Profile Form */}
        <div className="lg:col-span-8">
          <div className="bg-white border border-[#eaeaea] p-8 md:p-10 h-full">
            <h3 className="text-2xl font-bold text-[#1a1a1a] mb-8 pb-4 border-b border-[#eaeaea]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
              Cập Nhật Thông Tin
            </h3>
            
            <form className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-8">
              <div className="md:col-span-2">
                <label className="flex items-center gap-2 text-[10px] font-semibold text-[#555] uppercase tracking-[0.1em] mb-2">
                  <FontAwesomeIcon icon={faUser} /> Họ và Tên
                </label>
                <input
                  type="text"
                  name="fullName"
                  defaultValue="Nguyễn Văn A"
                  className="w-full px-4 py-3 border border-[#eaeaea] bg-[#faf9f7] text-[#1a1a1a] focus:bg-white focus:border-[#1a1a1a] outline-none transition-all text-[14px]"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-[10px] font-semibold text-[#555] uppercase tracking-[0.1em] mb-2">
                  <FontAwesomeIcon icon={faEnvelope} /> Địa chỉ Email
                </label>
                <input
                  type="email"
                  name="email"
                  defaultValue="nguyenvana@example.com"
                  readOnly
                  className="w-full px-4 py-3 border border-[#eaeaea] bg-[#f0f0f0] text-[#888] cursor-not-allowed outline-none transition-all text-[14px]"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-[10px] font-semibold text-[#555] uppercase tracking-[0.1em] mb-2">
                  <FontAwesomeIcon icon={faPhone} /> Số Điện Thoại
                </label>
                <input
                  type="tel"
                  name="phone"
                  defaultValue="0987654321"
                  className="w-full px-4 py-3 border border-[#eaeaea] bg-[#faf9f7] text-[#1a1a1a] focus:bg-white focus:border-[#1a1a1a] outline-none transition-all text-[14px]"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-[10px] font-semibold text-[#555] uppercase tracking-[0.1em] mb-2">
                  <FontAwesomeIcon icon={faVenusMars} /> Giới Tính
                </label>
                <div className="relative">
                  <select
                    name="gender"
                    defaultValue="male"
                    className="w-full px-4 py-3 border border-[#eaeaea] bg-[#faf9f7] text-[#1a1a1a] focus:bg-white focus:border-[#1a1a1a] outline-none transition-all appearance-none text-[14px]"
                  >
                    <option value="male">Nam</option>
                    <option value="female">Nữ</option>
                    <option value="other">Khác</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-[#999]">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-[10px] font-semibold text-[#555] uppercase tracking-[0.1em] mb-2">
                  <FontAwesomeIcon icon={faCalendarDay} /> Ngày Sinh
                </label>
                <input
                  type="date"
                  name="dateOfBirth"
                  defaultValue="2000-01-01"
                  className="w-full px-4 py-3 border border-[#eaeaea] bg-[#faf9f7] text-[#1a1a1a] focus:bg-white focus:border-[#1a1a1a] outline-none transition-all text-[14px]"
                />
              </div>

              <div className="md:col-span-2 pt-6 mt-2 border-t border-[#eaeaea]">
                <button
                  type="button"
                  className="bg-[#1a1a1a] text-white text-[12px] uppercase tracking-[0.1em] font-semibold px-8 py-3.5 hover:bg-[#333] transition-colors w-full sm:w-auto"
                >
                  Lưu Thay Đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
