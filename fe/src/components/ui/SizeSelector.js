import React from "react";

export default function SizeSelector({ label, size, variants, onChange }) {
    return (
        <div className="flex items-center gap-2 mt-1 mb-1" onClick={(e) => e.stopPropagation()}>
            <span className="text-[13px] text-[#666]">{label}</span>
            <select
                value={size}
                onChange={(e) => onChange(e.target.value)}
                className="text-[13px] font-bold text-[#1a1a1a] border rounded px-2 py-1 outline-none cursor-pointer focus:border-[#1a1a1a] transition-colors bg-white"
            >
                {variants?.map((v, idx) => (
                    <option key={idx} value={v.size} disabled={v.availableStock === 0}>
                        {v.size} {v.availableStock === 0 ? "(Hết hàng)" : ""}
                    </option>
                ))}
            </select>
        </div>
    );
}