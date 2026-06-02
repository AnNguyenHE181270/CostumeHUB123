import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";

/**
 * Button — Base button component.
 *
 * @prop {string}  variant   — "primary" | "outline" | "danger" | "ghost"  (default: "primary")
 * @prop {string}  size      — "sm" | "md" | "lg"  (default: "md")
 * @prop {string}  label     — Button text
 * @prop {object}  icon      — FontAwesome icon (left)
 * @prop {object}  iconRight — FontAwesome icon (right)
 * @prop {boolean} loading   — Show spinner
 * @prop {boolean} disabled  — Disabled state
 * @prop {boolean} fullWidth — width: 100%
 * @prop {string}  type      — "button" | "submit" | "reset"
 * @prop {string}  className — Extra classes
 * @prop {func}    onClick   — Click handler
 * @prop {node}    children  — Override label
 */
export default function Button({
  variant = "primary",
  size = "md",
  label,
  icon,
  iconRight,
  loading = false,
  disabled = false,
  fullWidth = false,
  type = "button",
  className = "",
  onClick,
  children,
  ...rest
}) {
  /* ── Variant Styles ── */
  const variants = {
    primary: `
      bg-[#1a1a1a] text-white
      hover:bg-[#333] active:bg-[#000]
      disabled:bg-[#ccc] disabled:text-[#888]
    `,
    outline: `
      bg-white text-[#1a1a1a] border-2 border-[#1a1a1a]
      hover:bg-[#1a1a1a] hover:text-white
      active:bg-[#333] active:text-white
      disabled:border-[#ccc] disabled:text-[#ccc] disabled:bg-white disabled:hover:bg-white disabled:hover:text-[#ccc]
    `,
    danger: `
      bg-[#dc2626] text-white
      hover:bg-[#b91c1c] active:bg-[#991b1b]
      disabled:bg-[#fca5a5] disabled:text-white
    `,
    ghost: `
      bg-transparent text-[#1a1a1a]
      hover:bg-[#f5f5f5] active:bg-[#e8e8e8]
      disabled:text-[#ccc] disabled:bg-transparent
    `,
  };

  /* ── Size Styles ── */
  const sizes = {
    sm: "px-4 py-2 text-[12px] gap-1.5",
    md: "px-6 py-3 text-[13px] gap-2",
    lg: "px-8 py-3.5 text-[14px] gap-2.5",
  };

  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      disabled={isDisabled}
      onClick={onClick}
      className={`
        inline-flex items-center justify-center
        font-semibold uppercase tracking-[0.06em]
        rounded transition-all duration-200
        active:scale-[0.97]
        disabled:cursor-not-allowed disabled:active:scale-100
        ${fullWidth ? "w-full" : ""}
        ${variants[variant] || variants.primary}
        ${sizes[size] || sizes.md}
        ${className}
      `}
      {...rest}
    >
      {/* Loading spinner */}
      {loading && (
        <FontAwesomeIcon
          icon={faSpinner}
          className="animate-spin text-current"
          style={{ fontSize: "inherit" }}
        />
      )}

      {/* Left icon */}
      {icon && !loading && (
        <FontAwesomeIcon
          icon={icon}
          className="text-current"
          style={{ fontSize: "inherit" }}
        />
      )}

      {/* Label */}
      <span>{loading ? "Đang xử lý..." : children || label}</span>

      {/* Right icon */}
      {iconRight && !loading && (
        <FontAwesomeIcon
          icon={iconRight}
          className="text-current"
          style={{ fontSize: "inherit" }}
        />
      )}
    </button>
  );
}
