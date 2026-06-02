import React, { useState, useId } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEye,
  faEyeSlash,
  faCircleExclamation,
  faCircleCheck,
} from "@fortawesome/free-solid-svg-icons";

/**
 * InputField — Input with built-in validation.
 *
 * @prop {string}   label        — Label text
 * @prop {string}   name         — Input name/id
 * @prop {string}   type         — "text" | "email" | "password" | "tel" | "number" | "textarea"
 * @prop {string}   value        — Controlled value
 * @prop {func}     onChange     — Change handler
 * @prop {string}   placeholder  — Placeholder text
 * @prop {boolean}  required     — Required field
 * @prop {boolean}  disabled     — Disabled state
 * @prop {string}   error        — External error message (overrides internal validation)
 * @prop {string}   helperText   — Helper text below input
 * @prop {object}   icon         — Left icon (FontAwesome)
 * @prop {number}   minLength    — Minimum length
 * @prop {number}   maxLength    — Maximum length
 * @prop {RegExp}   pattern      — Regex pattern
 * @prop {func}     validate     — Custom validation: (value) => errorMsg | null
 * @prop {number}   rows         — Rows for textarea
 * @prop {string}   className    — Extra classes for wrapper
 */
export default function InputField({
  label,
  name,
  type = "text",
  value = "",
  onChange,
  placeholder,
  required = false,
  disabled = false,
  error: externalError,
  helperText,
  icon,
  minLength,
  maxLength,
  pattern,
  validate,
  rows = 4,
  className = "",
  ...rest
}) {
  const id = useId();
  const inputId = name || id;
  const [touched, setTouched] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  /* ── Internal Validation ── */
  const getError = () => {
    if (externalError) return externalError;
    if (!touched) return null;

    const val = value?.toString() || "";

    if (required && !val.trim()) {
      return `${label || "Trường này"} không được để trống`;
    }

    if (minLength && val.length < minLength) {
      return `Tối thiểu ${minLength} ký tự`;
    }

    if (maxLength && val.length > maxLength) {
      return `Tối đa ${maxLength} ký tự`;
    }

    if (type === "email" && val.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(val)) {
        return "Email không hợp lệ";
      }
    }

    if (pattern && val.trim() && !pattern.test(val)) {
      return "Định dạng không hợp lệ";
    }

    if (validate) {
      const customError = validate(val);
      if (customError) return customError;
    }

    return null;
  };

  const errorMsg = getError();
  const hasError = !!errorMsg;
  const isValid = touched && !hasError && value?.toString().trim();
  const isPassword = type === "password";
  const inputType = isPassword ? (showPassword ? "text" : "password") : type;

  /* ── Style Classes ── */
  const borderColor = hasError
    ? "border-[#dc2626] focus:border-[#dc2626]"
    : isValid
    ? "border-[#16a34a] focus:border-[#16a34a]"
    : "border-[#d9d9d9] focus:border-[#1a1a1a]";

  const baseInputClasses = `
    w-full bg-white border rounded-md
    px-4 py-3 text-[14px] text-[#1a1a1a] outline-none
    transition-all duration-200
    placeholder:text-[#999]
    disabled:bg-[#f5f5f5] disabled:text-[#999] disabled:cursor-not-allowed
    ${icon ? "pl-11" : ""}
    ${isPassword ? "pr-11" : ""}
    ${borderColor}
  `;

  const handleBlur = () => setTouched(true);

  /* ── Render ── */
  const sharedProps = {
    id: inputId,
    name,
    value,
    onChange,
    onBlur: handleBlur,
    placeholder,
    disabled,
    className: baseInputClasses,
    "aria-invalid": hasError,
    "aria-describedby": hasError ? `${inputId}-error` : undefined,
    ...rest,
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      {/* Label */}
      {label && (
        <label
          htmlFor={inputId}
          className="block text-[13px] font-medium text-[#474747]"
        >
          {label}
          {required && (
            <span className="text-[#dc2626] ml-0.5">*</span>
          )}
        </label>
      )}

      {/* Input wrapper */}
      <div className="relative">
        {/* Left icon */}
        {icon && (
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#999] pointer-events-none">
            <FontAwesomeIcon icon={icon} className="text-[14px]" />
          </span>
        )}

        {/* Input or Textarea */}
        {type === "textarea" ? (
          <textarea rows={rows} {...sharedProps} />
        ) : (
          <input type={inputType} {...sharedProps} />
        )}

        {/* Password toggle */}
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#999] hover:text-[#474747] transition-colors p-1"
            aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
            tabIndex={-1}
          >
            <FontAwesomeIcon
              icon={showPassword ? faEyeSlash : faEye}
              className="text-[14px]"
            />
          </button>
        )}

        {/* Validation status icon (non-password) */}
        {!isPassword && touched && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            {hasError ? (
              <FontAwesomeIcon
                icon={faCircleExclamation}
                className="text-[14px] text-[#dc2626]"
              />
            ) : isValid ? (
              <FontAwesomeIcon
                icon={faCircleCheck}
                className="text-[14px] text-[#16a34a]"
              />
            ) : null}
          </span>
        )}
      </div>

      {/* Error message */}
      {hasError && (
        <p
          id={`${inputId}-error`}
          className="text-[12px] text-[#dc2626] flex items-center gap-1 animate-slide-down"
          role="alert"
        >
          <FontAwesomeIcon icon={faCircleExclamation} className="text-[10px]" />
          {errorMsg}
        </p>
      )}

      {/* Helper text */}
      {helperText && !hasError && (
        <p className="text-[12px] text-[#999]">{helperText}</p>
      )}

      {/* Character count */}
      {maxLength && (
        <p className="text-[11px] text-[#bbb] text-right">
          {(value?.toString() || "").length}/{maxLength}
        </p>
      )}
    </div>
  );
}
