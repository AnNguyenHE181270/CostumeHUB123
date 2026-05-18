import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export default function Button({
  icon,
  label,
  loading = false,
  type = "button",
  className = "",
  onClick
}) {
  return (
    <button
      type={type}
      disabled={loading}
      onClick={onClick}
      className={`
        group w-full
        py-3.5 rounded-f-btn
        text-[14px] font-medium
        flex items-center justify-center gap-2.5
        transition-all duration-200
        active:scale-[0.985]
        disabled:opacity-60 disabled:cursor-not-allowed
        ${className}
      `}
    >
      {loading ? "Loading..." : label}

      {icon && !loading && (
        <FontAwesomeIcon icon={icon} className="text-[14px]" />
      )}
      
    </button>
  );
}
