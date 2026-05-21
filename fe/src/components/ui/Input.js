import React from "react";

export default function Input  ({
  label,
  name,
  type = "text",
  value,
  onChange,
  placeholder,
  required = false,
  rightIcon,
  onRightIconClick,
  className = "",
  children, // Hỗ trợ truyền component con (dành cho select, date)
}) {
  const baseInputClasses = `
    w-full bg-ghost-fog border border-sterling-gray rounded-cards 
    px-4 py-3 text-[14px] text-midnight-ink outline-none 
    transition-all duration-200 
    focus:border-midnight-ink focus:bg-canvas-white 
    placeholder:text-midnight-ink/40
    ${rightIcon ? "pr-10" : ""} 
    ${className}
  `;

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-[10px] uppercase tracking-[0.2em] font-medium text-midnight-ink/50">
          {label}
          {required && <span className="text-warning-orange ml-0.5">*</span>}
        </label>
      )}

      <div className="relative">
        {/* Nếu có children (ví dụ thẻ select), thì render children. 
            Nếu không, render thẻ input mặc định */}
        {children || (
          <input
            id={name}
            name={name}
            type={type}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            required={required}
            className={baseInputClasses}
          />
        )}

        {/* Chỉ hiện icon nếu KHÔNG phải là children (tránh lỗi lồng nhau) 
            Hoặc bạn có thể để động này, nhưng thường select/date không cần icon mắt */}
        {rightIcon && (
          <button
            type="button"
            onClick={onRightIconClick}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-midnight-ink/40 hover:text-midnight-ink transition-colors"
          >
            {rightIcon}
          </button>
        )}
      </div>
    </div>
  );
};

