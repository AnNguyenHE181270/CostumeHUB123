import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export default function Button({
  icon,
  label,
  loading = false,
  type = "button",
  variant = "primary",
  className = "",
  onClick
}) {
  // Thay rounded-xl thành rounded-full để bo tròn hoàn toàn 2 đầu
  const baseClasses = "group w-full py-3.5 rounded-full text-sm font-medium flex items-center justify-center gap-2.5 transition-all duration-200 active:scale-[0.985] disabled:opacity-60 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-primary-600 text-white hover:bg-primary-700 shadow-sm",
    secondary: "bg-surface text-text-primary border border-border hover:bg-gray-100",
    // Cập nhật lại outline để có viền và chữ màu đậm giống nút "Learn More" trong ảnh
    outline: "bg-transparent border border-text-primary text-text-primary hover:bg-surface",
    ghost: "bg-transparent text-text-secondary hover:text-text-primary hover:bg-surface"
  };

  return (
    <button
      type={type}
      disabled={loading}
      onClick={onClick}
      className={`${baseClasses} ${variants[variant] || variants.primary} ${className}`}
    >
      {loading ? "Loading..." : label}

      {icon && !loading && (
        <FontAwesomeIcon icon={icon} className="text-[14px]" />
      )}
    </button>
  );
}