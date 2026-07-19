import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronLeft,
  faChevronRight,
  faCartPlus,
  faShieldHalved,
  faTruckFast,
  faRotateLeft,
  faGem,
  faCrown,
  faHouse
} from "@fortawesome/free-solid-svg-icons";
import { useCart } from "../context/CartContext";
import Toast from "../components/ui/Toast";
import DatePickerGroup from "../components/ui/DatePickerGroup";
import ProductCard from "../components/customer/ProductCard";
import costumeService from "../services/costume.service";
import rentalService from "../services/rental.service";
import { getRentalPriceFactor } from "../utils/formatters";

const SERIF = { fontFamily: "'Cormorant Garamond', serif" };

const STATUS_MAP = {
  available: { label: "Sẵn Sàng Cho Thuê", color: "bg-emerald-600", dot: "bg-emerald-400" },
  rented: { label: "Đang Được Thuê", color: "bg-red-500", dot: "bg-red-400" },
  maintenance: { label: "Đang Bảo Trì", color: "bg-amber-500", dot: "bg-amber-400" },
};

function formatPrice(price) {
  return new Intl.NumberFormat("vi-VN").format(price) + "đ";
}

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [costume, setCostume] = useState(null);
  const [relatedCostumes, setRelatedCostumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState(null);

  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const tmr = new Date();
    tmr.setDate(tmr.getDate() + 1);
    return tmr.toISOString().split("T")[0];
  });
  const [quantity, setQuantity] = useState(1);
  const [rentalDays, setRentalDays] = useState(1);
  const [isBuying, setIsBuying] = useState(false);

  const [toast, setToast] = useState({ isVisible: false, message: "", type: "success" });
  const showToast = (message, type = "success") => {
    setToast({ isVisible: true, message, type });
  };

  useEffect(() => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (end >= start) {
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        setRentalDays(diffDays === 0 ? 1 : diffDays);
      }
    }
  }, [startDate, endDate]);

  useEffect(() => {
    if (selectedVariant && selectedVariant.availableStock > 0) {
      setQuantity(1);
    }
  }, [selectedVariant]);

  const handleIncreaseQty = () => {
    if (selectedVariant && quantity < selectedVariant.availableStock) {
      setQuantity(q => q + 1);
    }
  };

  const handleDecreaseQty = () => {
    if (quantity > 1) {
      setQuantity(q => q - 1);
    }
  };

  // Kiểm tra tồn kho theo ngày
  const verifyAvailability = async () => {
    try {
      const data = await rentalService.checkAvailability({
        costumeId: costume._id,
        size: selectedVariant?.size,
        startDate,
        endDate,
        quantity,
      });
      if (!data.isAvailable) {
        showToast(`Chỉ còn trống ${data.availableQty} bộ trong khoảng ngày này.`, "error");
        return false;
      }
      return true;
    } catch (err) {
      showToast(err.message || "Không thể kiểm tra tồn kho, vui lòng thử lại.", "error");
      return false;
    }
  };

  // Fetch Trang Phục
  useEffect(() => {
    const fetchCostume = async () => {
      try {
        setLoading(true);
        const data = await costumeService.getById(id);
        const costumeData = data.costume;
        setCostume(costumeData);

        if (costumeData && costumeData.variants && costumeData.variants.length > 0) {
          const firstAvailable = costumeData.variants.find(v => (v.availableStock || 0) > 0);
          setSelectedVariant(firstAvailable || costumeData.variants[0]);
        }

        // Fetch related products from same category
        if (costumeData && costumeData.categoryId) {
          const catId = typeof costumeData.categoryId === "object" ? costumeData.categoryId._id : costumeData.categoryId;
          try {
            const relData = await costumeService.getAll({ categoryId: catId, limit: 6 });
            const list = (relData.costumes || []).filter(c => c._id !== costumeData._id);
            setRelatedCostumes(list);
          } catch (relErr) {
            console.error("Failed to fetch related costumes:", relErr);
          }
        }
      } catch (err) {
        console.error("Failed to fetch costume:", err);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchCostume();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf6f0] flex flex-col items-center justify-center py-32 text-[#b8935a]">
        <div className="w-10 h-10 border-2 border-[#b8935a] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-[12px] uppercase tracking-[0.2em] font-bold">Đang tải thông tin sản phẩm...</p>
      </div>
    );
  }

  if (!costume) {
    return (
      <div className="min-h-screen bg-[#faf6f0] flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-2xl font-bold text-[#1a1a1a] mb-2" style={SERIF}>Không tìm thấy sản phẩm</h2>
        <p className="text-[#666] mb-6 text-sm">Sản phẩm này không tồn tại hoặc đã bị gỡ khỏi bộ sưu tập.</p>
        <button onClick={() => navigate(-1)} className="px-6 py-2.5 bg-[#1a1a1a] text-[#f5e6ca] rounded-full text-xs uppercase tracking-wider font-bold">
          Quay Lại
        </button>
      </div>
    );
  }

  const categoryName = typeof costume.categoryId === "object" ? costume.categoryId?.name : "Bộ sưu tập";
  const categoryIdVal = typeof costume.categoryId === "object" ? costume.categoryId?._id : costume.categoryId;
  const statusInfo = STATUS_MAP[costume.status] || STATUS_MAP.available;
  const images = costume.images?.length > 0 ? costume.images : [
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='1000' viewBox='0 0 800 1000'%3E%3Crect fill='%23f5f3f0' width='800' height='1000'/%3E%3Ctext fill='%23c4bdb5' font-family='sans-serif' font-size='24' x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle'%3EHình Ảnh Sản Phẩm%3C/text%3E%3C/svg%3E"
  ];

  return (
    <div className="bg-[#faf6f0] min-h-screen pb-24">

      {/* ── BREADCRUMB NAV ── */}
      <div className="bg-[#f5efe3]/60 border-b border-[#e8dfcd]">
        <div className="mx-auto max-w-[1300px] px-6 py-3.5 flex items-center justify-between gap-4 text-[11px] text-[#8a7d63] uppercase tracking-wider">
          <div className="flex items-center gap-2">
            <Link to="/" className="hover:text-[#1a1a1a] transition-colors flex items-center gap-1.5">
              <FontAwesomeIcon icon={faHouse} className="text-[10px]" />
            </Link>
            <FontAwesomeIcon icon={faChevronRight} className="text-[8px] text-[#c8ab7a]" />
            <Link to="/collections" className="hover:text-[#1a1a1a] transition-colors">Bộ sưu tập</Link>
            {categoryName && (
              <>
                <FontAwesomeIcon icon={faChevronRight} className="text-[8px] text-[#c8ab7a]" />
                <Link to={`/category/${categoryIdVal}`} className="hover:text-[#1a1a1a] transition-colors">{categoryName}</Link>
              </>
            )}
            <FontAwesomeIcon icon={faChevronRight} className="text-[8px] text-[#c8ab7a]" />
            <span className="text-[#1a1a1a] font-bold truncate max-w-[200px] sm:max-w-none">{costume.name}</span>
          </div>

          <button
            onClick={() => navigate(-1)}
            className="hover:text-[#1a1a1a] transition-colors flex items-center gap-1.5 font-bold shrink-0"
          >
            <FontAwesomeIcon icon={faChevronLeft} className="text-[10px]" />
            Quay lại
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-[1300px] px-6 py-8 lg:py-12">
        <div className="flex flex-col lg:flex-row gap-10 lg:gap-14">

          {/* ── LEFT: IMAGE GALLERY ── */}
          <div className="w-full lg:w-1/2 flex flex-col gap-4">
            <div className="relative aspect-[3/4] bg-white rounded-3xl border border-[#e6dcab]/80 overflow-hidden shadow-xl group">
              <img
                src={images[activeImage]}
                alt={costume.name}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              {/* Status Badge Overlaid on Image */}
              <div className="absolute top-4 left-4">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[11px] font-bold text-white shadow-lg backdrop-blur-md bg-black/60 border border-white/20">
                  <span className={`w-2 h-2 rounded-full ${statusInfo.dot} animate-pulse`} />
                  {statusInfo.label}
                </div>
              </div>
            </div>

            {images.length > 1 && (
              <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImage(idx)}
                    className={`relative w-20 aspect-[3/4] flex-shrink-0 rounded-2xl overflow-hidden border-2 transition-all duration-200 shadow-sm ${
                      activeImage === idx ? "border-[#c9a869] ring-2 ring-[#c9a869]/30 opacity-100" : "border-transparent opacity-60 hover:opacity-100"
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── RIGHT: PRODUCT INFO ── */}
          <div className="w-full lg:w-1/2 flex flex-col gap-6">

            {/* ── KHUNG THÔNG TIN CHÍNH (UNIFIED SINGLE CONTAINER) ── */}
            <div className="bg-white rounded-3xl border border-[#e6dcab]/80 p-6 lg:p-8 shadow-lg space-y-6">

              {/* Header & Title */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <FontAwesomeIcon icon={faGem} className="text-[11px] text-[#d4af37]" />
                  <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#b8935a]">
                    {categoryName}
                  </span>
                </div>
                <h1 className="text-[30px] lg:text-[36px] font-bold text-[#1a1a1a] leading-tight" style={SERIF}>
                  {costume.name}
                </h1>
              </div>

              {/* Pricing & Deposit */}
              <div className="pt-4 border-t border-[#f0e9d5]">
                <div className="flex items-end justify-between mb-3">
                  <div>
                    <span className="text-[11px] text-[#b8935a] uppercase tracking-wider block mb-1 font-semibold">
                      Giá thuê niêm yết
                    </span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-[30px] lg:text-[34px] font-bold text-[#1a1a1a] leading-none tracking-tight">
                        {formatPrice(costume.pricePerDay || costume.price || 0)}
                      </span>
                      <span className="text-[13px] text-[#8a7d63] font-medium">/ 24 giờ thuê</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-gray-400 uppercase tracking-wider block mb-1 font-medium">
                      Tối thiểu
                    </span>
                    <span className="text-[13px] font-bold text-[#1a1a1a]">{costume.minRentalDays || 1} Ngày</span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 text-[12px] text-[#665a45] bg-[#faf6f0] px-4 py-2.5 rounded-2xl border border-[#eae2d5]">
                  <FontAwesomeIcon icon={faShieldHalved} className="text-[#d4af37] text-[14px]" />
                  <span>Tiền cọc bảo đảm: <strong className="text-[#1a1a1a] font-bold">{formatPrice(costume.deposit || 0)}</strong> (Hoàn lại 100% khi trả đồ)</span>
                </div>
              </div>

              {/* Size & Color */}
              <div className="pt-5 border-t border-[#f0e9d5]">
                <div className="flex flex-col sm:flex-row gap-6">
                  {/* Size */}
                  <div className="flex-1">
                    <h4 className="text-[11px] uppercase tracking-[0.15em] font-bold text-[#1a1a1a] mb-2.5 flex items-center justify-between">
                      <span>Chọn Kích Thước</span>
                      {selectedVariant && (
                        <span className={`text-[11px] lowercase ${selectedVariant.availableStock > 0 ? "text-emerald-600 font-semibold" : "text-red-500 font-semibold"}`}>
                          ({selectedVariant.availableStock > 0 ? `còn ${selectedVariant.availableStock} bộ` : "hết hàng"})
                        </span>
                      )}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {costume.variants && costume.variants.length > 0 ? (
                        costume.variants.map((v) => {
                          const isOutOfStock = (v.availableStock || 0) === 0;
                          const isSelected = selectedVariant && selectedVariant._id === v._id;
                          return (
                            <button
                              key={v._id || v.size}
                              disabled={isOutOfStock}
                              onClick={() => setSelectedVariant(v)}
                              className={`min-w-[42px] px-3 py-1.5 text-[12px] font-bold uppercase rounded-xl transition-all ${
                                isSelected
                                  ? "bg-gradient-to-r from-[#1a1a1a] to-[#2d2d2d] text-[#f5e6ca] border border-[#c9a869] shadow-md"
                                  : isOutOfStock
                                  ? "border border-gray-200 bg-gray-50 text-gray-300 cursor-not-allowed line-through"
                                  : "border border-[#e2d5bd] bg-[#faf9f7] text-[#1a1a1a] hover:border-[#b8935a]"
                              }`}
                            >
                              {v.size}
                            </button>
                          );
                        })
                      ) : (
                        <button className="min-w-[42px] px-3.5 py-1.5 text-[12px] font-bold uppercase rounded-xl border border-[#c9a869] bg-[#1a1a1a] text-[#f5e6ca] shadow-md">
                          {costume.size || "Free Size"}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Color */}
                  <div className="w-full sm:w-auto shrink-0">
                    <h4 className="text-[11px] uppercase tracking-[0.15em] font-bold text-[#1a1a1a] mb-2.5">
                      Tông Màu
                    </h4>
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#faf9f7] border border-[#e2d5bd] text-[#1a1a1a] text-[12px] font-bold rounded-xl">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#b8935a]" />
                      {costume.color || "Tiêu Chuẩn"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Rental Dates & Quantity */}
              <div className="pt-5 border-t border-[#f0e9d5]">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-[12px] uppercase tracking-[0.15em] font-bold text-[#1a1a1a]">
                    Thời Gian Thuê
                  </h4>
                  <span className="text-[11px] text-[#b8935a] font-medium">
                    (Tối thiểu: {costume.minRentalDays || 1} ngày)
                  </span>
                </div>

                <DatePickerGroup
                  startDate={startDate}
                  setStartDate={setStartDate}
                  endDate={endDate}
                  setEndDate={setEndDate}
                  minRentalDays={costume.minRentalDays}
                />

                <div className="flex items-center justify-between bg-[#faf9f7] p-3 mt-4 rounded-2xl border border-[#e2d5bd]">
                  <span className="text-[12px] uppercase tracking-wider text-[#666] font-bold">Số lượng thuê:</span>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={handleDecreaseQty}
                      disabled={quantity <= 1}
                      className="w-7 h-7 flex items-center justify-center rounded-full bg-white border border-[#d8cbb5] hover:bg-[#faf1dd] text-[#1a1a1a] font-bold text-xs disabled:opacity-40 transition-colors shadow-sm"
                    >
                      -
                    </button>
                    <span className="text-[14px] font-bold text-[#1a1a1a] min-w-[20px] text-center">{quantity}</span>
                    <button
                      onClick={handleIncreaseQty}
                      disabled={!selectedVariant || quantity >= selectedVariant.availableStock}
                      className="w-7 h-7 flex items-center justify-center rounded-full bg-white border border-[#d8cbb5] hover:bg-[#faf1dd] text-[#1a1a1a] font-bold text-xs disabled:opacity-40 transition-colors shadow-sm"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Service Guarantees */}
              <div className="pt-5 border-t border-[#f0e9d5] grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2.5 text-[11px] text-[#665a45] bg-[#faf9f7] p-3 rounded-2xl border border-[#e2d5bd]">
                  <FontAwesomeIcon icon={faTruckFast} className="text-[#b8935a] text-[15px] shrink-0" />
                  <span>Giao hàng hỏa tốc tận nơi</span>
                </div>
                <div className="flex items-center gap-2.5 text-[11px] text-[#665a45] bg-[#faf9f7] p-3 rounded-2xl border border-[#e2d5bd]">
                  <FontAwesomeIcon icon={faRotateLeft} className="text-[#b8935a] text-[15px] shrink-0" />
                  <span>100% Giặt khô & Khử trùng</span>
                </div>
              </div>

              {/* Description */}
              <div className="pt-5 border-t border-[#f0e9d5]">
                <h4 className="text-[12px] uppercase tracking-[0.15em] font-bold text-[#1a1a1a] mb-2">
                  Mô Tả Trang Phục
                </h4>
                <div className="text-[13px] leading-relaxed text-[#665a45] whitespace-pre-wrap font-light">
                  {costume.description || "Chưa có mô tả chi tiết cho sản phẩm này."}
                </div>
              </div>

            </div>

            {/* ── TÓM TẮT CHI PHÍ TẠM TÍNH (KHUNG RIÊNG TÁCH BIỆT) ── */}
            <div className="bg-gradient-to-br from-[#faf6f0] to-[#f4ede0] rounded-3xl p-6 border border-[#e6dcab] shadow-md">
              <h4 className="text-[12px] uppercase tracking-wider font-bold text-[#1a1a1a] mb-3 pb-2 border-b border-[#e2d5bd]">
                Tóm Tắt Chi Phí Tạm Tính
              </h4>
              <div className="space-y-2.5 text-[13px] mb-5">
                <div className="flex justify-between text-[#665a45]">
                  <span>Tiền thuê ({formatPrice(costume.pricePerDay || costume.price || 0)} x {quantity} bộ x {rentalDays} ngày{rentalDays > 3 ? ` x ${Math.round(getRentalPriceFactor(rentalDays) * 100)}%` : ""})</span>
                  <span className="font-bold text-[#1a1a1a]">{formatPrice((costume.pricePerDay || costume.price || 0) * quantity * getRentalPriceFactor(rentalDays))}</span>
                </div>
                <div className="flex justify-between text-[#665a45]">
                  <span>Tiền cọc hoàn trả ({formatPrice(costume.deposit || 0)} x {quantity} bộ)</span>
                  <span className="font-bold text-[#1a1a1a]">{formatPrice((costume.deposit || 0) * quantity)}</span>
                </div>
                <div className="pt-3 border-t border-dashed border-[#c9a869]/50 flex justify-between items-center">
                  <span className="font-bold text-[#1a1a1a] uppercase text-[12px] tracking-wider">Tổng Tạm Tính</span>
                  <span className="font-bold text-[#b8935a] text-[22px]">
                    {formatPrice(((costume.pricePerDay || costume.price || 0) * quantity * getRentalPriceFactor(rentalDays)) + ((costume.deposit || 0) * quantity))}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={async () => {
                    if (costume.status === "available") {
                      if (rentalDays < (costume.minRentalDays || 1)) {
                        showToast(`Phải thuê tối thiểu ${costume.minRentalDays || 1} ngày.`, "error");
                        return;
                      }
                      setIsBuying(true);
                      const available = await verifyAvailability();
                      if (!available) {
                        setIsBuying(false);
                        return;
                      }
                      const res = await addToCart(costume, selectedVariant, quantity, startDate, endDate, rentalDays);
                      setIsBuying(false);
                      if (res && !res.success) {
                        showToast(res.message || "Có lỗi xảy ra", "error");
                        return;
                      }
                      navigate("/checkout", {
                        state: {
                          buyNow: {
                            costumeId: costume._id,
                            size: selectedVariant.size,
                            startDate,
                            endDate
                          }
                        }
                      });
                    }
                  }}
                  className={`flex-1 py-3.5 rounded-2xl text-[12px] uppercase tracking-[0.12em] font-bold transition-all duration-300 shadow-md ${
                    costume.status === "available"
                      ? "bg-gradient-to-r from-[#1a1a1a] via-[#2d2d2d] to-[#121212] text-[#f5e6ca] hover:brightness-125 luxury-btn-gold-shine border border-[#c9a869]/40"
                      : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  }`}
                  disabled={costume.status !== "available" || !selectedVariant || isBuying}
                >
                  {isBuying ? "Đang xử lý..." : "Thuê Ngay Trực Tiếp"}
                </button>

                <button
                  onClick={async () => {
                    if (costume.status === "available") {
                      if (rentalDays < (costume.minRentalDays || 1)) {
                        showToast(`Phải thuê tối thiểu ${costume.minRentalDays || 1} ngày.`, "error");
                        return;
                      }
                      const available = await verifyAvailability();
                      if (!available) return;
                      const res = await addToCart(costume, selectedVariant, quantity, startDate, endDate, rentalDays);
                      if (res && !res.success) {
                        showToast(res.message || "Có lỗi xảy ra", "error");
                      } else {
                        showToast("Đã thêm trang phục vào giỏ hàng");
                      }
                    }
                  }}
                  className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl text-[12px] uppercase tracking-[0.12em] font-bold transition-all duration-300 border-2 ${
                    costume.status === "available"
                      ? "border-[#b8935a] bg-white text-[#8a6a3c] hover:bg-[#faf1dd] shadow-sm"
                      : "border-gray-200 bg-white text-gray-300 cursor-not-allowed"
                  }`}
                  disabled={costume.status !== "available"}
                >
                  <FontAwesomeIcon icon={faCartPlus} className="text-[14px]" />
                  Thêm Giỏ Hàng
                </button>
              </div>
            </div>

          </div>

        </div>

        {/* ── SẢN PHẨM CÙNG DANH MỤC ĐỀ XUẤT ── */}
        {relatedCostumes.length > 0 && (
          <div className="mt-20 pt-12 border-t border-[#e8dfcd]">
            <div className="flex items-center justify-between mb-8">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <FontAwesomeIcon icon={faCrown} className="text-[#d4af37] text-[12px]" />
                  <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#b8935a]">
                    Gợi Ý Cho Bạn
                  </span>
                </div>
                <h3 className="text-[26px] lg:text-[34px] font-bold text-[#1a1a1a]" style={SERIF}>
                  Sản Phẩm Cùng Danh Mục
                </h3>
              </div>
              <button
                onClick={() => navigate(`/category/${categoryIdVal}`)}
                className="text-[12px] font-bold text-[#b8935a] hover:text-[#1a1a1a] uppercase tracking-wider transition-colors"
              >
                Xem tất cả bộ sưu tập →
              </button>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
            >
              {relatedCostumes.slice(0, 4).map((item) => (
                <div key={item._id} className="h-full">
                  <ProductCard costume={item} hideRentButton={true} />
                </div>
              ))}
            </motion.div>
          </div>
        )}

      </div>

      <Toast
        isVisible={toast.isVisible}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast(prev => ({ ...prev, isVisible: false }))}
      />
    </div>
  );
}
