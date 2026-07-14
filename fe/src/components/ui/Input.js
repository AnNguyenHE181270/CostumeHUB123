import React from "react";

export default function Input({
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
  children,
  ...props
}) {
  const baseInputClasses = `
    w-full bg-surface border border-borderorder rounded-xl 
    px-4 py-3 text-sm text-text-primary outline-none 
    transition-all duration-200 
    focus:border-primary-500 focus:bg-background focus:ring-1 focus:ring-primary-500
    placeholder:text-text-muted
    ${rightIcon ? "pr-10" : ""} 
    ${className}
  `;

  return (
    <div className="space-y-1.5">
        {label && (
        <label htmlFor={name} className="block text-sm font-medium text-text-secondary">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
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
            {...props}
          />
        )}

        {rightIcon && (
          <button
            type="button"
            onClick={onRightIconClick}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-primary-600 transition-colors"
          >
            {rightIcon}
          </button>
        )}
      </div>
    </div>
  );
}