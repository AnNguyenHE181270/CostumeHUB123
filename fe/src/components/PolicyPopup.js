import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PolicyPopup = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const prevUserRef = useRef(user);

  useEffect(() => {
    const hasSeenSession = sessionStorage.getItem('policyPopupShownSession');
    
    // 1. Show on very first visit in this session
    if (!hasSeenSession) {
      setIsOpen(true);
      sessionStorage.setItem('policyPopupShownSession', 'true');
    }

    // 2. Show when user logs in (user changes from null to a valid user)
    if (!prevUserRef.current && user) {
      setIsOpen(true);
      sessionStorage.setItem('policyPopupShownSession', 'true');
    }
    
    prevUserRef.current = user;
  }, [user]);

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleLearnMore = () => {
    setIsOpen(false);
    navigate('/about');
  };

  if (!isOpen) return null;

  const policies = [
    {
      id: 1,
      title: "Bình thường hoặc bẩn nhẹ",
      detail: "Vết bẩn có thể giặt sạch dễ dàng bằng nước hoặc xà phòng thông thường (VD: bụi đất nhẹ, vết mồ hôi). Chúng tôi sẽ tự xử lý, bạn hoàn toàn không bị mất cọc.",
      badge: "KHÔNG TRỪ CỌC",
      iconColor: "text-[#5C8D6D]",
      iconBg: "bg-[#EAF2EC]",
      iconBorder: "border-[#D1E2D6]",
      badgeText: "text-[#4F815F]",
      badgeBg: "bg-[#F1F8F4]",
      badgeBorder: "border-[#B3D4C1]",
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"/><circle cx="12" cy="12" r="3"/><path d="M8 8h.01"/><path d="M16 16h.01"/></svg>
    },
    {
      id: 2,
      title: "Bẩn nặng, ố khó tẩy",
      detail: "Vết ố do thức ăn, rượu vang, bùn đất dày đặc... cần phải sử dụng các hóa chất tẩy rửa chuyên dụng và tốn nhiều công sức để làm sạch.",
      badge: "20% CỌC",
      iconColor: "text-[#D6A140]",
      iconBg: "bg-[#FFF7E6]",
      iconBorder: "border-[#F5E2BE]",
      badgeText: "text-[#B88728]",
      badgeBg: "bg-[#FFFAF0]",
      badgeBorder: "border-[#E1CA9E]",
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/><path d="M12 10a2 2 0 1 0 0 4 2 2 0 0 0 0-4z"/><circle cx="16" cy="18" r="1.5"/><circle cx="8" cy="16" r="1.5"/></svg>
    },
    {
      id: 3,
      title: "Hư nhẹ sửa được",
      detail: "Các sự cố ngoài ý muốn như bung chỉ, đứt khuy, rách nhỏ ở đường may... Có thể được phục hồi bằng cách khâu vá hoặc thay thế phụ kiện nhỏ.",
      badge: "30% - 50% CỌC",
      iconColor: "text-[#D97736]",
      iconBg: "bg-[#FFF0E6]",
      iconBorder: "border-[#F5D7C4]",
      badgeText: "text-[#D97736]",
      badgeBg: "bg-[#FFF7F2]",
      badgeBorder: "border-[#F2C2A2]",
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="M12 12v6"/><path d="M8 15h8"/></svg>
    },
    {
      id: 4,
      title: "Hư nặng không phục hồi",
      detail: "Trang phục bị rách thành mảng lớn, cháy xém do bàn ủi, rách ở các vị trí trung tâm, lem phai màu nghiêm trọng dẫn đến không thể cho thuê lại được nữa.",
      badge: "70% - 100% CỌC",
      iconColor: "text-[#D14F4F]",
      iconBg: "bg-[#FFEBEB]",
      iconBorder: "border-[#F5CACA]",
      badgeText: "text-[#D14F4F]",
      badgeBg: "bg-[#FFF2F2]",
      badgeBorder: "border-[#EFA8A8]",
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3l18 18M10 10l-6 6v4h4l6-6"/><path d="M14 14l6 6M19 14l-5-5M21 9V5h-4l-5 5"/></svg>
    },
    {
      id: 5,
      title: "Mất trang phục/Hư toàn bộ",
      detail: "Làm mất trang phục hoặc hư hỏng nặng đến mức mất đi hình thái gốc ban đầu. Bạn sẽ chịu khấu trừ toàn bộ cọc và đền bù phần giá trị thay thế (nếu giá trị đồ cao hơn tiền cọc).",
      badge: "100% CỌC + ĐỀN BÙ",
      iconColor: "text-[#B52525]",
      iconBg: "bg-[#FFEAEA]",
      iconBorder: "border-[#EDC5C5]",
      badgeText: "text-white",
      badgeBg: "bg-[#B52525]",
      badgeBorder: "border-transparent",
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" /></svg>
    }
  ];

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#1a1a1a]/70 p-4 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-[#FAF5ED] rounded-xl shadow-2xl w-full max-w-2xl relative border border-[#EBE1D0] overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Nền trang trí */}
        <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-[#EFE8DA] to-transparent opacity-60 pointer-events-none" />

        {/* Header */}
        <div className="relative text-center pt-5 pb-2 px-6">
          <div className="flex justify-center mb-2 text-[#C29555] animate-pulse">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
            </svg>
          </div>
          <h2 className="text-xl md:text-2xl text-[#3A2D23] font-bold tracking-tight mb-1.5 uppercase">
            Chính Sách Khấu Trừ & Đền Bù
          </h2>
          <div className="w-10 h-0.5 bg-[#D9C09E] mx-auto my-2"></div>
          <p className="text-[#6C6053] text-[12px] md:text-[13px] leading-relaxed max-w-[95%] mx-auto font-medium">
            Chào mừng {user ? <span className="font-bold text-[#4A3C31]">{user.name}</span> : "bạn"} đến với nền tảng của chúng tôi! Để đảm bảo tính minh bạch, vui lòng nắm rõ các quy định dưới đây.
            <br/><span className="italic text-[#9C8F7E] mt-0.5 inline-block"><strong className="text-[#C29555] font-semibold">Mẹo:</strong> Rê chuột (hover) vào từng mục để xem mô tả!</span>
          </p>
        </div>

        {/* Content Body - Accordion List */}
        <div className="flex-1 overflow-y-auto px-5 md:px-8 pb-4 space-y-2 custom-scrollbar relative z-10">
          
          {policies.map((p) => (
            <div 
              key={p.id}
              className="group flex flex-col p-2.5 bg-white rounded-lg border border-[#EFEFEF] shadow-sm hover:shadow-md hover:border-[#D9C09E] transition-all duration-300 cursor-pointer overflow-hidden"
            >
              {/* Visible Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${p.iconBg} ${p.iconColor} ${p.iconBorder} group-hover:scale-110 transition-transform duration-300`}>
                    <div className="scale-75">{p.icon}</div>
                  </div>
                  <h3 className="text-[#2a2a2a] font-bold text-[13px] md:text-[14px] tracking-wide transition-colors group-hover:text-[#4A3C31]">
                    {p.title}
                  </h3>
                </div>
                <div className={`shrink-0 px-2.5 py-1 font-bold text-[10px] md:text-[11px] rounded-full border ${p.badgeBg} ${p.badgeText} ${p.badgeBorder} tracking-wider shadow-sm group-hover:shadow transition-shadow`}>
                  {p.badge}
                </div>
              </div>

              {/* Expandable Detail using CSS Grid */}
              <div className="grid grid-rows-[0fr] group-hover:grid-rows-[1fr] transition-[grid-template-rows] duration-500 ease-in-out">
                <div className="overflow-hidden">
                  <div className="pt-2 pb-0.5 pl-[2.75rem] pr-2">
                    <p className="text-[12px] text-[#666] leading-snug italic border-l-2 border-[#EBE1D0] pl-2.5 py-0.5">
                      {p.detail}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}

        </div>

        {/* Footer actions */}
        <div className="bg-white border-t border-[#EFEFEF] p-3 rounded-b-xl relative z-10">
          <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 max-w-sm ml-auto">
            <button 
              onClick={handleLearnMore}
              className="w-full sm:w-auto px-4 py-1.5 font-semibold text-[12px] md:text-[13px] text-[#B38344] bg-white border border-[#D9C09E] rounded-md hover:bg-[#FAF6F0] transition-colors uppercase tracking-wider"
            >
              Quy định chi tiết
            </button>
            <button 
              onClick={handleClose}
              className="w-full sm:w-auto px-5 py-1.5 font-semibold text-[12px] md:text-[13px] text-white bg-[#1a1a1a] rounded-md hover:bg-black shadow-md hover:shadow-lg transition-all uppercase tracking-wider"
            >
              Tôi đã hiểu
            </button>
          </div>
        </div>

        {/* Close Button top right */}
        <button 
          onClick={handleClose}
          className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-full bg-black/5 hover:bg-black/10 text-[#666] transition-colors z-20"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>

      </div>
    </div>
  );
};

export default PolicyPopup;

