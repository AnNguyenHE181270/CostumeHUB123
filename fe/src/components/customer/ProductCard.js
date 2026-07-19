import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStar, faFire } from "@fortawesome/free-solid-svg-icons";

import { formatPrice } from "../../utils/formatters";
const STATUS_MAP = {
  rented: { label: "Đang Thuê", color: "bg-red-500" },
  maintenance: { label: "Bảo Trì", color: "bg-amber-500" },
};

const NEW_WITHIN_DAYS = 14;
const isRecentlyAdded = (createdAt) => {
  if (!createdAt) return false;
  const ageMs = Date.now() - new Date(createdAt).getTime();
  return ageMs >= 0 && ageMs <= NEW_WITHIN_DAYS * 24 * 60 * 60 * 1000;
};

const PLACEHOLDER_IMG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='500' viewBox='0 0 400 500'%3E%3Crect fill='%23f0ece8' width='400' height='500'/%3E%3Ctext fill='%23c4bdb5' font-family='sans-serif' font-size='14' x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle'%3EHình Ảnh Sản Phẩm%3C/text%3E%3C/svg%3E";

export default function ProductCard({ costume, showToast, hideRentButton = false, isBestSeller = false }) {
  const navigate = useNavigate();
  const [imgError, setImgError] = useState(false);

  const imgSrc =
    !imgError && costume.images && costume.images.length > 0
      ? costume.images[0]
      : PLACEHOLDER_IMG;

  const statusInfo = STATUS_MAP[costume.status];
  const isNew = isRecentlyAdded(costume.createdAt);
  const categoryName =
    typeof costume.categoryId === "object"
      ? costume.categoryId?.name
      : "";
  const rentalCount = costume.rentalCount || costume.rentCount || costume.rentedCount || costume.totalRentals || 0;

  return (
      <div className="group bg-white rounded-2xl overflow-hidden border border-[#eae2d5] hover:border-[#c9a869] hover:shadow-[0_16px_36px_rgba(184,147,90,0.2)] hover:-translate-y-1.5 transition-all duration-500 h-full flex flex-col luxury-btn-shine">
        {/* Image */}
        <div
          className="relative aspect-[3/4] overflow-hidden bg-[#f5f3f0] cursor-pointer"
          onClick={() => navigate(`/product/${costume._id}`)}
        >
          <img
            src={imgSrc}
            alt={costume.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
            onError={() => setImgError(true)}
          />

          {/* Badge góc trên-trái */}
          <div className="absolute top-3 left-3">
            {statusInfo ? (
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold text-white ${statusInfo.color} shadow-sm`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-white/60" />
                {statusInfo.label}
              </span>
            ) : isBestSeller && rentalCount > 10 ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold text-white bg-gradient-to-r from-[#d9b578] to-[#b8935a] shadow-md ring-1 ring-white/70">
                <FontAwesomeIcon icon={faFire} className="text-[10px]" />
                BEST SELLER
              </span>
            ) : isNew ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold text-white bg-[#1a1a1a] shadow-md">
                <FontAwesomeIcon icon={faStar} className="text-[9px]" />
                NEW
              </span>
            ) : null}
          </div>
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col flex-1">
          {/* Category */}
          {categoryName && (
            <p className="text-[10px] uppercase tracking-[0.14em] text-[#b8935a] font-semibold mb-1">
              {categoryName}
            </p>
          )}

          {/* Name */}
          <h3
            onClick={() => navigate(`/product/${costume._id}`)}
            className="text-[15px] font-semibold text-[#1a1a1a] mb-2 cursor-pointer hover:text-[#b8935a] transition-colors line-clamp-2"
          >
            {costume.name || "Tên sản phẩm"}
          </h3>

          <div className="flex items-center gap-1.5 text-[11px] text-[#7a6e59] font-medium my-0.5">
            <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-[#faf1dd] text-[#b8935a] text-[9px] border border-[#e8dfcd]">
              <FontAwesomeIcon icon={faFire} className="text-[8px]" />
            </span>
            <span>Đã cho thuê <b className="text-[#1a1a1a] font-bold">{rentalCount}</b> lượt</span>
          </div>

          {/* Price & Action */}
          <div className="mt-auto pt-4 flex flex-col gap-3">
            <span className="text-[16px] font-bold text-[#1a1a1a]">
              {formatPrice(costume.pricePerDay || costume.price || 0)}<span className="text-[12px] font-normal text-gray-500">/ngày</span>
            </span>
            {!hideRentButton && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/product/${costume._id}`);
                }}
                className="w-full py-2.5 bg-gradient-to-r from-[#1a1a1a] to-[#2d2d2d] text-[#f5e6ca] text-[11px] uppercase tracking-wider font-bold rounded-lg hover:from-[#c9a869] hover:to-[#b8935a] hover:text-white active:scale-[0.97] transition-all duration-300 text-center shadow-md hover:shadow-[0_6px_18px_rgba(184,147,90,0.35)] luxury-btn-gold-shine border border-[#c9a869]/30"
              >
                Thuê ngay
              </button>
            )}
          </div>


        </div>
      </div>
  );
}

