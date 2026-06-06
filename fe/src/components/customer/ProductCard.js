import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCartPlus, faCheck } from "@fortawesome/free-solid-svg-icons";
import { useCart } from "../../context/CartContext";
import { AddToCartModal } from "../../pages/customer/AddToCartModal";

const STATUS_MAP = {
  available: { label: "Còn Hàng", color: "bg-emerald-500" },
  rented: { label: "Đang Thuê", color: "bg-red-500" },
  maintenance: { label: "Bảo Trì", color: "bg-amber-500" },
  dry_cleaning: { label: "Đang Giặt", color: "bg-amber-500" },
};

const PLACEHOLDER_IMG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='500' viewBox='0 0 400 500'%3E%3Crect fill='%23f0ece8' width='400' height='500'/%3E%3Ctext fill='%23c4bdb5' font-family='sans-serif' font-size='14' x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle'%3EHình Ảnh Sản Phẩm%3C/text%3E%3C/svg%3E";

function formatPrice(price) {
  return new Intl.NumberFormat("vi-VN").format(price) + "đ";
}

function StarRating({ rating = 0, count = 0 }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`w-3.5 h-3.5 ${star <= Math.round(rating) ? "text-amber-400" : "text-gray-200"
              }`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
      <span className="text-[11px] text-[#999]">({count})</span>
    </div>
  );
}

export default function ProductCard({ costume, showToast }) {
  const navigate = useNavigate();
  const { addToCart, removeFromCart, cartItems } = useCart();
  const [imgError, setImgError] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const isInCart = cartItems.some(item => item.costume?._id === costume._id);

  const imgSrc =
    !imgError && costume.images && costume.images.length > 0
      ? costume.images[0]
      : PLACEHOLDER_IMG;

  const statusInfo = STATUS_MAP[costume.status] || STATUS_MAP.available;
  const categoryName =
    typeof costume.categoryId === "object"
      ? costume.categoryId?.name
      : "";

  return (
    <div className="relative h-full">
      {/* Card Content (Có hiệu ứng transform và overflow-hidden) */}
      <div className="group h-full flex flex-col bg-white rounded-xl overflow-hidden border border-[#f0ece8] hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
        {/* Image */}
        <div
          className="relative aspect-[3/4] overflow-hidden bg-[#f5f3f0] cursor-pointer"
          onClick={() => navigate(`/product/${costume._id}`)}
        >
          <img
            src={imgSrc}
            alt={costume.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={() => setImgError(true)}
          />

          {/* Status badge */}
          <div className="absolute top-3 left-3">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold text-white ${statusInfo.color} shadow-sm`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-white/60" />
              {statusInfo.label}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Category */}
          {categoryName && (
            <p className="text-[10px] uppercase tracking-[0.12em] text-[#999] font-medium mb-1">
              {categoryName}
            </p>
          )}

          {/* Name */}
          <h3
            onClick={() => navigate(`/product/${costume._id}`)}
            className="text-[14px] font-semibold text-[#1a1a1a] leading-snug mb-2 line-clamp-2
                     group-hover:text-[#444] transition-colors cursor-pointer"
          >
            {costume.name}
          </h3>

          {/* Rating */}
          <StarRating
            rating={costume.ratingAverage || 0}
            count={costume.reviewCount || 0}
          />

          {/* Price */}
          <p className="mt-2.5 text-[18px] font-bold text-[#1a1a1a] tracking-tight">
            {formatPrice(costume.rentalRates?.pricePerDay || 0)}
            <span className="text-[11px] font-normal text-[#999] ml-1">/ngày</span>
          </p>

          {/* Size & Color */}
          {(costume.size || costume.color) && (
            <div className="mt-2 flex items-center gap-2 text-[11px] text-[#999]">
              {costume.size && (
                <span className="px-2 py-0.5 bg-[#f5f5f5] rounded text-[#666]">
                  Size {costume.size}
                </span>
              )}
              {costume.color && (
                <span className="px-2 py-0.5 bg-[#f5f5f5] rounded text-[#666]">
                  {costume.color}
                </span>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-4 flex gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (!isInCart && costume.status === "available") {
                  setIsModalOpen(true);
                }
                else if (isInCart) {
                  removeFromCart(costume._id);
                  if (showToast) showToast("Đã bỏ khỏi giỏ hàng");
                }
              }}
              className={`w-full flex items-center justify-center gap-2 text-white
                       text-[11px] uppercase tracking-[0.08em] font-semibold py-2.5 rounded
                       active:scale-[0.98] transition-all duration-200
                       disabled:opacity-50 disabled:cursor-not-allowed
                       ${isInCart ? "bg-emerald-600 hover:bg-emerald-700" : "bg-[#1a1a1a] hover:bg-[#333]"}`}
              disabled={costume.status !== "available" && !isInCart}
            >
              <FontAwesomeIcon icon={isInCart ? faCheck : faCartPlus} className="text-[12px]" />
              {isInCart ? "Đã Thêm" : "Thêm Giỏ Hàng"}
            </button>
          </div>
        </div>
      </div>

      {/* Modal (Nằm bên ngoài Card Content nên không bị ảnh hưởng bởi transform) */}
      <div onClick={(e) => e.stopPropagation()} className="relative z-[9999]">
        <AddToCartModal
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          costume={costume}
          showToast={showToast}
        />
      </div>
    </div>
  );
}
