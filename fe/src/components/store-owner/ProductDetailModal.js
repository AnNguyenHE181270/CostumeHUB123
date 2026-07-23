import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faEdit, faTag, faBox, faClock, faShield } from "@fortawesome/free-solid-svg-icons";

const STATUS_MAP = {
  available:    { label: "Sẵn sàng",    cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  rented:       { label: "Đang thuê",   cls: "bg-purple-50 text-purple-700 border-purple-200" },
  maintenance:  { label: "Bảo trì",     cls: "bg-orange-50 text-orange-700 border-orange-200" },
  hidden:       { label: "Đã ẩn",       cls: "bg-red-50 text-red-700 border-red-200" },
  out_of_stock: { label: "Hết hàng",    cls: "bg-gray-100 text-gray-500 border-gray-300" },
};

const fmt = (n) => Number(n || 0).toLocaleString("vi-VN");

const ProductDetailModal = ({ product, onClose, onEdit }) => {
  const [activeImg, setActiveImg] = useState(0);

  if (!product) return null;

  const images = product.images?.length ? product.images : ["https://placehold.co/400x500?text=No+Image"];
  const status = STATUS_MAP[product.status] || { label: product.status, cls: "bg-gray-100 text-gray-500 border-gray-200" };
  const lateFee = Math.round((product.deposit || 0) * 0.1);
  const variants = product.variants || [];
  const totalAvail = variants.reduce((s, v) => s + (v.availableStock || 0), 0);
  const totalStock = variants.reduce((s, v) => s + (v.totalStock || 0), 0);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-[2px] p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col"
           style={{ maxHeight: "min(88vh, 620px)" }}>

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="text-sm font-semibold text-[#1a1a1a] truncate max-w-[320px]">Chi tiết sản phẩm</span>
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${status.cls}`}>
              {status.label}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
            >
              <FontAwesomeIcon icon={faTimes} className="text-sm" />
            </button>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="flex flex-col lg:flex-row flex-1 overflow-hidden gap-6">

          {/* Left – Images */}
          <div className="lg:w-[320px] w-full flex-shrink-0 flex flex-col bg-[#fafafa] border border-gray-100 rounded-2xl p-4 gap-3">
            <div className="h-[420px] rounded-3xl overflow-hidden bg-white border border-gray-100">
              <img
                src={images[activeImg]}
                alt={product.name}
                className="w-full h-full object-cover"
                onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/400x500?text=Lỗi"; }}
              />
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-0.5">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImg(i)}
                    className={`flex-shrink-0 w-16 h-16 rounded-2xl overflow-hidden border-2 transition-all ${
                      activeImg === i ? "border-[#f94a00]" : "border-transparent hover:border-gray-300"
                    }`}
                  >
                    <img
                      src={img}
                      alt=""
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/40x40"; }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right – Info */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">

            {/* Product title + category */}
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-[#1a1a1a]">{product.name}</h3>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="bg-gray-100 text-gray-600 text-xs px-2.5 py-1 rounded-md border border-gray-200 font-medium">
                  <FontAwesomeIcon icon={faTag} className="mr-1 text-[10px]" />
                  {product.categoryId?.name || "Chưa có danh mục"}
                </span>
              </div>
            </div>

            {/* Pricing — 3 boxes */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-orange-50 border border-orange-100 rounded-xl p-2.5 text-center">
                <p className="text-[10px] text-orange-500 font-semibold uppercase tracking-wide mb-0.5">Giá thuê/ngày</p>
                <p className="text-base font-bold text-[#f94a00] leading-none">{fmt(product.pricePerDay)}<span className="text-[10px] font-normal ml-0.5">đ</span></p>
              </div>
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-2.5 text-center">
                <p className="text-[10px] text-blue-500 font-semibold uppercase tracking-wide mb-0.5">Tiền cọc</p>
                <p className="text-base font-bold text-blue-700 leading-none">{fmt(product.deposit)}<span className="text-[10px] font-normal ml-0.5">đ</span></p>
              </div>
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-2.5 text-center">
                <p className="text-[10px] text-amber-500 font-semibold uppercase tracking-wide mb-0.5">Phí trễ hẹn</p>
                <p className="text-base font-bold text-amber-700 leading-none">{fmt(product.lateFeePerDay || lateFee)}<span className="text-[10px] font-normal ml-0.5">đ</span></p>
                <p className="text-[9px] text-amber-400">/ngày</p>
              </div>
            </div>

            {/* Meta info row */}
            <div className="flex gap-3 flex-wrap text-xs text-gray-500">
               {product.minRentalDays > 1 && (
                <span className="flex items-center gap-1">
                  <FontAwesomeIcon icon={faClock} className="text-[10px]" />
                  Thuê tối thiểu: <strong className="text-gray-700">{product.minRentalDays} ngày</strong>
                </span>
              )}
              <span className="flex items-center gap-1">
                <FontAwesomeIcon icon={faClock} className="text-[10px]" />
                Thuê tối đa: <strong className="text-gray-700">{product.maxRentalDays || 7} ngày</strong>
              </span>
              {product.specifications?.material && (
                <span className="flex items-center gap-1">
                  <FontAwesomeIcon icon={faShield} className="text-[10px]" />
                  Chất liệu: <strong className="text-gray-700">{product.specifications.material}</strong>
                </span>
              )}
              {product.specifications?.includedAccessories?.length > 0 && (
                <span className="flex items-center gap-1">
                  <FontAwesomeIcon icon={faBox} className="text-[10px]" />
                  Kèm: <strong className="text-gray-700">{product.specifications.includedAccessories.join(", ")}</strong>
                </span>
              )}
            </div>

            {/* Description */}
            {product.description && (
              <p className="text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-3">
                {product.description}
              </p>
            )}

            {/* Variants */}
            <div className="border-t border-gray-100 pt-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Biến thể theo size</p>
                <span className="text-xs text-gray-400">
                  {totalAvail}/{totalStock} sẵn sàng
                </span>
              </div>

              {variants.length === 0 ? (
                <p className="text-xs text-gray-400 italic">Chưa có biến thể nào</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {variants.map((v, i) => {
                    const avail = v.availableStock || 0;
                    const total = v.totalStock || 0;
                    const isEmpty = avail === 0;
                    return (
                      <div
                        key={i}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium ${
                          isEmpty
                            ? "bg-red-50 border-red-200 text-red-500"
                            : "bg-white border-gray-200 text-gray-700"
                        }`}
                      >
                        <span className="font-bold">{v.size || "?"}</span>
                        <span className={`${isEmpty ? "text-red-400" : "text-gray-400"}`}>
                          {avail}/{total}
                        </span>
                        {isEmpty && (
                          <span className="text-[10px] bg-red-100 text-red-500 px-1 rounded">hết</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-gray-100">
              {product.status !== "hidden" ? (
                <button
                  onClick={onEdit}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-white bg-[#1a1a1a] rounded-xl hover:bg-[#0f0f0f] transition-colors"
                >
                  <FontAwesomeIcon icon={faEdit} />
                  Chỉnh sửa sản phẩm
                </button>
              ) : (
                <button
                  onClick={onEdit}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-[#1a1a1a] bg-[#f5f5f5] rounded-xl border border-[#eaeaea] hover:bg-[#ececec] transition-colors"
                >
                  <FontAwesomeIcon icon={faEdit} />
                  Chỉnh sửa sản phẩm
                </button>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ProductDetailModal;
