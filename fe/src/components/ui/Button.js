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
  children,
  ...props
}) {
  const baseClasses = "w-full group py-3.5 px-6 text-[12px] tracking-[0.1em] uppercase font-semibold flex items-center justify-center gap-2.5 transition-all duration-200 active:scale-[0.985] disabled:opacity-60 disabled:cursor-not-allowed";

  const variants = {
    primary: "rounded-none bg-[#1a1a1a] text-white hover:bg-[#333] shadow-sm",
    secondary: "rounded-none bg-[#faf9f7] text-[#1a1a1a] border border-[#eaeaea] hover:bg-[#eaeaea]",
    outline: "rounded-none bg-transparent border border-[#1a1a1a] text-[#1a1a1a] hover:bg-[#faf9f7]",
    ghost: "rounded-none bg-transparent text-[#555] hover:text-[#1a1a1a] hover:bg-[#faf9f7]",
    gold: "rounded-xl bg-gradient-to-r from-warning-500 to-warning-600 text-white hover:brightness-105 shadow-sm shadow-warning-500/30"
  };

  return (
    <button
      type={type}
      disabled={loading}
      onClick={onClick}
      className={`${baseClasses} ${variants[variant] || variants.primary} ${className}`}
      {...props}
    >
      {icon && !loading && (
        <FontAwesomeIcon icon={icon} className="text-[14px]" />
      )}

      {loading ? "Loading..." : (children || label)}
    </button>
  );
}