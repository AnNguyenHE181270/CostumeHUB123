import React from "react";

export default function Selector({
    value,
    onChange,
    options,
    variants,
    disabled = false,
    className = "",
}) {
    // Chuẩn hóa về [{value, label, disabled}]
    const normalizedOptions = options
        ? options
        : (variants ?? []).map((v) => ({
            value: v.size,
            label: v.size,
            disabled: v.availableStock === 0,
        }));

    return (
        <div
            className={`flex items-center gap-2 ${className}`}
            onClick={(e) => e.stopPropagation()}
        >
            <div className={`relative ${className.includes("w-full") ? "w-full" : ""}`}>
                <select
                    value={value}
                    disabled={disabled}
                    onChange={(e) => onChange?.(e.target.value)}
                    className="
                        w-full appearance-none
                        bg-white border border-gray-200 rounded-md
                        pl-3 pr-6 py-1
                        text-[14px] text-gray-800
                        cursor-pointer
                        transition-all duration-150
                        focus:outline-none focus:border-gray-700 focus:ring-1 focus:ring-gray-700/20
                        disabled:opacity-50 disabled:cursor-not-allowed
                    "
                >
                    {normalizedOptions.map((opt, idx) => (
                        <option key={opt.value ?? idx} value={opt.value} disabled={opt.disabled}>
                            {opt.label}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
}