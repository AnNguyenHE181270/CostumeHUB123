import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export default function Button({
  icon,
  label,
  loading = false,
  type = "button",
  variant = "primary",
  className = "",
  onClick,
  children
}) {
  const baseClasses = "w-full group py-3.5 px-6 rounded-none text-[12px] tracking-[0.1em] uppercase font-semibold flex items-center justify-center gap-2.5 transition-all duration-200 active:scale-[0.985] disabled:opacity-60 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-[#1a1a1a] text-white hover:bg-[#333] shadow-sm",
    secondary: "bg-[#faf9f7] text-[#1a1a1a] border border-[#eaeaea] hover:bg-[#eaeaea]",
    outline: "bg-transparent border border-[#1a1a1a] text-[#1a1a1a] hover:bg-[#faf9f7]",
    ghost: "bg-transparent text-[#555] hover:text-[#1a1a1a] hover:bg-[#faf9f7]"
  };

  return (
    <button
      type={type}
      disabled={loading}
      onClick={onClick}
      className={`${baseClasses} ${variants[variant] || variants.primary} ${className}`}
    >
      {loading ? "Loading..." : (children || label)}

      {icon && !loading && (
        <FontAwesomeIcon icon={icon} className="text-[14px]" />
      )}
    </button>
  );
}