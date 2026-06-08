import React from "react";

export default function SizeSelector({ variants = [], selectedSize, onSizeChange }) {
    // Nếu sản phẩm không có chia variant thì chỉ hiển thị text bình thường
    if (!variants || variants.length === 0) {
        return <p className="text-sm font-medium text-foreground">{selectedSize || "M"}</p>;
    }

    return (
        <select
            value={selectedSize}
            onChange={(e) => onSizeChange(e.target.value)}
            className="bg-background border border-border text-foreground text-sm font-medium rounded-md px-2 py-1 outline-none focus:ring-1 focus:ring-primary cursor-pointer"
        >
            {variants.map((v, index) => {
                const isOutOfStock = v.stock === 0;
                return (
                    <option key={`${v.size}-${index}`} value={v.size} disabled={isOutOfStock}>
                        {v.size} {v.stock !== undefined && `(Còn ${v.stock})`}
                    </option>
                );
            })}
        </select>
    );
}