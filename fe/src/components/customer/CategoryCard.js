import React from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronRight } from "@fortawesome/free-solid-svg-icons";

/* Map category names to emoji icons */
const CATEGORY_ICONS = {
  "Áo Dài & Cổ Phục": "👘",
  "Váy Dạ Hội & Váy Cưới": "👗",
  "Trang Phục Concept / Chụp Ảnh": "📸",
  "Đồ du lịch": "🏖️",
  "Áo dài nữ": "🌸",
  "Váy tiệc": "🎉",
  "Set nữ": "👚",
  "Trang phục nghi lễ": "🎓",
};

const CARD_COLORS = [
  "from-[#fdf6f0] to-[#f9ece0]",
  "from-[#f0f4fd] to-[#e0e8f9]",
  "from-[#f6f0fd] to-[#ece0f9]",
  "from-[#f0fdf6] to-[#e0f9ec]",
  "from-[#fdf0f4] to-[#f9e0e8]",
  "from-[#f0f9fd] to-[#e0ecf9]",
  "from-[#fdfaf0] to-[#f9f2e0]",
  "from-[#f4f0fd] to-[#e8e0f9]",
];

export default function CategoryCard({ category, costumeCount = 0, index = 0 }) {
  const navigate = useNavigate();
  const icon = CATEGORY_ICONS[category.name] || "✨";
  const colorClass = CARD_COLORS[index % CARD_COLORS.length];

  return (
    <div
      onClick={() => navigate(`/category/${category._id}`)}
      className={`group cursor-pointer bg-gradient-to-br ${colorClass} rounded-2xl p-6 
                  border border-[#f0ece8] hover:border-[#b8935a]/30 hover:shadow-[0_16px_36px_rgba(184,147,90,0.08)] hover:-translate-y-1.5 
                  transition-all duration-500 flex flex-col justify-between min-h-[180px]`}
    >
      {/* Icon */}
      <div className="text-3xl mb-4 transition-transform duration-500 group-hover:scale-125 group-hover:rotate-6 select-none">{icon}</div>

      {/* Content */}
      <div className="flex-1">
        <h3 className="text-[15px] font-semibold text-[#1a1a1a] mb-1.5 group-hover:text-[#b8935a] transition-colors">
          {category.name}
        </h3>
        <p className="text-[12px] text-[#999] leading-[1.5] line-clamp-2">
          {category.description || "Khám phá bộ sưu tập"}
        </p>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-black/5">
        <span className="text-[11px] text-[#858585] font-medium">
          {costumeCount} sản phẩm
        </span>
        <span
          className="w-7 h-7 rounded-full bg-white/80 flex items-center justify-center
                     group-hover:bg-[#b8935a] group-hover:text-white group-hover:scale-110 transition-all duration-300 shadow-sm"
        >
          <FontAwesomeIcon icon={faChevronRight} className="text-[10px]" />
        </span>
      </div>
    </div>
  );
}
