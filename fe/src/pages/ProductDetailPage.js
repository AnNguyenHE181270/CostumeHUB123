import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronLeft,
  faCartPlus,
  faShieldHalved,
  faTruckFast,
  faRotateLeft,
  faStar,
  faCheck,
  faCalendarDays,
} from "@fortawesome/free-solid-svg-icons";
import { useCart } from "../context/CartContext";
import Toast from "../components/ui/Toast";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { motion, AnimatePresence } from "framer-motion";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:9999";

const STATUS_MAP = {
  available: { label: "Còn Hàng", color: "bg-emerald-500", dot: "bg-emerald-400" },
  rented: { label: "Đang Thuê", color: "bg-red-500", dot: "bg-red-400" },
  maintenance: { label: "Bảo Trì", color: "bg-amber-500", dot: "bg-amber-400" },
  dry_cleaning: { label: "Đang Giặt", color: "bg-amber-500", dot: "bg-amber-400" },
};

function formatPrice(price) {
  return new Intl.NumberFormat("vi-VN").format(price) + "đ";
}

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, removeFromCart, cartItems } = useCart();
  const [costume, setCostume] = useState(null);
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

  const [activePicker, setActivePicker] = useState(null);
  const pickerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setActivePicker(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [toast, setToast] = useState({ isVisible: false, message: "", type: "success" });
  const showToast = (message, type = "success") => {
    setToast({ isVisible: true, message, type });
  };

  const isInCart = costume && selectedVariant
    ? cartItems.some(item => item.costume?._id === costume._id && item.variant?._id === selectedVariant._id && item.startDate === startDate && item.endDate === endDate)
    : false;

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

  const handleQuickSelect = (days) => {
    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(end.getDate() + days);
    setEndDate(end.toISOString().split("T")[0]);
  };

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

  useEffect(() => {
    const fetchCostume = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/api/costumes/${id}`);
        const data = await res.json();
        setCostume(data.costume);

        if (data.costume && data.costume.variants && data.costume.variants.length > 0) {
          const firstAvailable = data.costume.variants.find(v => (v.availableStock || 0) > 0);
          setSelectedVariant(firstAvailable || data.costume.variants[0]);
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
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#1a1a1a] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!costume) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-2xl font-bold text-[#1a1a1a] mb-2">Không tìm thấy sản phẩm</h2>
        <p className="text-[#666] mb-6">Sản phẩm này không tồn tại hoặc đã bị xóa.</p>
        <button onClick={() => navigate(-1)} className="px-6 py-2 bg-[#1a1a1a] text-white rounded text-sm uppercase tracking-wider">
          Quay Lại
        </button>
      </div>
    );
  }

  const categoryName = typeof costume.categoryId === "object" ? costume.categoryId?.name : "Chưa phân loại";
  const statusInfo = STATUS_MAP[costume.status] || STATUS_MAP.available;
  const images = costume.images?.length > 0 ? costume.images : [
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='1000' viewBox='0 0 800 1000'%3E%3Crect fill='%23f5f3f0' width='800' height='1000'/%3E%3Ctext fill='%23c4bdb5' font-family='sans-serif' font-size='24' x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle'%3EHình Ảnh Sản Phẩm%3C/text%3E%3C/svg%3E"
  ];

  return (
    <div className="bg-[#fafafa] min-h-screen pb-20">
      {/* Breadcrumb / Back Navigation */}
      <div className="bg-white border-b border-[#eaeaea]">
        <div className="mx-auto max-w-[1200px] px-6 py-4 flex items-center gap-4 text-[12px] font-medium text-[#666]">
          <button onClick={() => navigate(-1)} className="hover:text-[#1a1a1a] transition-colors flex items-center gap-2">
            <FontAwesomeIcon icon={faChevronLeft} className="text-[10px]" />
            Quay lại
          </button>
          <span className="text-[#ccc]">|</span>
          <span className="text-[#1a1a1a] truncate">{costume.name}</span>
        </div>
      </div>

      <div className="mx-auto max-w-[1200px] px-6 py-8 lg:py-12">
        <div className="flex flex-col lg:flex-row gap-10 lg:gap-16">

          {/* Left: Image Gallery */}
          <div className="w-full lg:w-1/2 flex flex-col gap-4">
            <div className="relative aspect-[3/4] bg-white rounded-xl border border-[#eaeaea] overflow-hidden group">
              <img
                src={images[activeImage]}
                alt={costume.name}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              {/* Status Badge Overlaid on Image */}
              <div className="absolute top-4 left-4">
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-bold text-white shadow-md backdrop-blur-md bg-black/40`}>
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
                    className={`relative w-20 aspect-[3/4] flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all duration-200 ${activeImage === idx ? "border-[#1a1a1a] opacity-100" : "border-transparent opacity-60 hover:opacity-100"
                      }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Product Info */}
          <div className="w-full lg:w-1/2 flex flex-col">
            <div className="mb-6">
              <p className="text-[11px] uppercase tracking-[0.2em] font-semibold text-[#999] mb-2">
                {categoryName}
              </p>
              <h1 className="text-[28px] lg:text-[34px] font-bold text-[#1a1a1a] leading-tight mb-4" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                {costume.name}
              </h1>

              <div className="flex items-center gap-4 text-sm mb-6">
                <div className="flex items-center gap-1 text-amber-400 text-[13px]">
                  <FontAwesomeIcon icon={faStar} />
                  <FontAwesomeIcon icon={faStar} />
                  <FontAwesomeIcon icon={faStar} />
                  <FontAwesomeIcon icon={faStar} />
                  <FontAwesomeIcon icon={faStar} className="text-[#e8e8e8]" />
                  <span className="text-[#666] ml-1">(0 đánh giá)</span>
                </div>
                <span className="text-[#ccc]">|</span>
                <span className="text-[#666]">Mã SP: <span className="font-semibold text-[#1a1a1a]">{costume.sku || "N/A"}</span></span>
              </div>

              {/* Pricing Box */}
              <div className="bg-white rounded-xl border border-[#eaeaea] p-5 mb-8 shadow-sm">
                <div className="flex items-end gap-3 mb-2">
                  <span className="text-[32px] font-bold text-[#1a1a1a] leading-none tracking-tight">
                    {formatPrice(costume.rentalRates?.pricePerDay || 0)}
                  </span>
                  <span className="text-[14px] text-[#666] font-medium pb-1">/ ngày thuê</span>
                </div>
                <div className="flex items-center gap-2 text-[13px] text-[#999] bg-[#faf9f7] px-3 py-2 rounded mt-4">
                  <FontAwesomeIcon icon={faShieldHalved} className="text-emerald-500" />
                  Tiền cọc bắt buộc: <strong className="text-[#1a1a1a]">{formatPrice(costume.deposit || 0)}</strong>
                </div>
              </div>

              {/* Attributes (Size & Color) */}
              <div className="flex gap-6 mb-8 border-b border-[#eaeaea] pb-8">
                <div className="flex-1">
                  <h4 className="text-[11px] uppercase tracking-[0.1em] font-semibold text-[#1a1a1a] mb-3">
                    Kích Thước
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
                            className={`min-w-[40px] px-3 py-2 text-[13px] font-medium rounded border transition-all ${isSelected
                              ? "border-[#1a1a1a] bg-[#1a1a1a] text-white shadow-md"
                              : isOutOfStock
                                ? "border-[#eaeaea] bg-[#faf9f7] text-[#ccc] cursor-not-allowed"
                                : "border-[#eaeaea] bg-white text-[#1a1a1a] hover:border-[#1a1a1a]"
                              }`}
                          >
                            {v.size}
                          </button>
                        );
                      })
                    ) : (
                      <button className="min-w-[40px] px-3 py-2 text-[13px] font-medium rounded border border-[#1a1a1a] bg-[#1a1a1a] text-white shadow-md">
                        {costume.size || "Free Size"}
                      </button>
                    )}
                  </div>
                  {selectedVariant && (
                    <p className={`mt-3 text-[12px] font-medium ${selectedVariant.availableStock > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                      {selectedVariant.availableStock > 0
                        ? `Còn lại ${selectedVariant.availableStock} sản phẩm`
                        : 'Đã hết hàng cho kích thước này'}
                    </p>
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="text-[11px] uppercase tracking-[0.1em] font-semibold text-[#1a1a1a] mb-3">
                    Màu Sắc
                  </h4>
                  <div className="inline-flex items-center justify-center px-4 py-2 bg-[#f5f5f5] text-[#1a1a1a] text-[13px] font-medium rounded">
                    {costume.color || "Không xác định"}
                  </div>
                </div>
              </div>

              {/* Date & Quantity Picker */}
              <div className="mb-8">
                <h4 className="text-[13px] uppercase tracking-[0.1em] font-semibold text-[#1a1a1a] mb-4 border-b border-[#eaeaea] pb-2">
                  Tùy chọn Thuê
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6" ref={pickerRef}>
                  {/* Ngày Nhận */}
                  <div className="relative">
                    <label className="block text-[11px] uppercase tracking-[0.05em] text-[#999] font-medium mb-1.5">
                      Ngày nhận đồ
                    </label>
                    <button
                      onClick={() => setActivePicker(activePicker === 'start' ? null : 'start')}
                      className={`w-full text-left bg-white border ${
                        activePicker === 'start' ? 'border-[#1a1a1a] shadow-sm' : 'border-[#eaeaea]'
                      } text-[13px] text-[#1a1a1a] rounded-lg px-4 py-3 font-semibold transition-all flex justify-between items-center hover:border-[#1a1a1a]`}
                    >
                      {new Date(startDate).toLocaleDateString('vi-VN')}
                      <FontAwesomeIcon icon={faCalendarDays} className={activePicker === 'start' ? 'text-[#1a1a1a]' : 'text-[#999]'} />
                    </button>
                    
                    <AnimatePresence>
                      {activePicker === 'start' && (
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          transition={{ duration: 0.2 }}
                          className="absolute z-20 mt-2 p-3 bg-white rounded-xl shadow-xl border border-[#eaeaea] custom-calendar-wrapper left-0 min-w-[280px]"
                        >
                          <Calendar
                            onChange={(date) => {
                              const startStr = new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().split("T")[0];
                              setStartDate(startStr);
                              if (startStr > endDate) setEndDate(startStr);
                              setActivePicker('end'); // Tự động chuyển sang chọn ngày trả
                            }}
                            value={new Date(startDate)}
                            minDate={new Date()}
                            className="border-none text-[13px] font-sans w-full"
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Ngày Trả */}
                  <div className="relative">
                    <label className="block text-[11px] uppercase tracking-[0.05em] text-[#999] font-medium mb-1.5">
                      Ngày trả đồ
                    </label>
                    <button
                      onClick={() => setActivePicker(activePicker === 'end' ? null : 'end')}
                      className={`w-full text-left bg-white border ${
                        activePicker === 'end' ? 'border-[#1a1a1a] shadow-sm' : 'border-[#eaeaea]'
                      } text-[13px] text-[#1a1a1a] rounded-lg px-4 py-3 font-semibold transition-all flex justify-between items-center hover:border-[#1a1a1a]`}
                    >
                      {new Date(endDate).toLocaleDateString('vi-VN')}
                      <FontAwesomeIcon icon={faCalendarDays} className={activePicker === 'end' ? 'text-[#1a1a1a]' : 'text-[#999]'} />
                    </button>
                    
                    <AnimatePresence>
                      {activePicker === 'end' && (
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          transition={{ duration: 0.2 }}
                          className="absolute z-20 mt-2 p-3 bg-white rounded-xl shadow-xl border border-[#eaeaea] custom-calendar-wrapper right-0 min-w-[280px]"
                        >
                          <Calendar
                            onChange={(date) => {
                              const endStr = new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().split("T")[0];
                              setEndDate(endStr);
                              setActivePicker(null); // Chọn xong thì đóng lịch
                            }}
                            value={new Date(endDate)}
                            minDate={new Date(startDate)}
                            className="border-none text-[13px] font-sans w-full"
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                <style>{`
                  .custom-calendar-wrapper .react-calendar {
                    border: none !important;
                    font-family: inherit;
                    width: 100%;
                  }
                  .custom-calendar-wrapper .react-calendar__tile {
                    padding: 0.6em 0.2em;
                    border-radius: 8px;
                    transition: background 0.2s;
                  }
                  .custom-calendar-wrapper .react-calendar__tile:enabled:hover {
                    background: #f5f5f5 !important;
                  }
                  .custom-calendar-wrapper .react-calendar__tile--active {
                    background: #1a1a1a !important;
                    color: white !important;
                    font-weight: bold;
                    border-radius: 8px;
                  }
                  .custom-calendar-wrapper .react-calendar__navigation button {
                    border-radius: 8px;
                    min-width: 36px;
                  }
                  .custom-calendar-wrapper .react-calendar__navigation button:enabled:hover,
                  .custom-calendar-wrapper .react-calendar__navigation button:enabled:focus {
                    background-color: #f5f5f5;
                  }
                  .custom-calendar-wrapper .react-calendar__month-view__days__day--weekend {
                    color: #d10000;
                  }
                `}</style>

                {/* Quick select blocks */}
                <div className="flex gap-2 mb-6">
                  <button onClick={() => handleQuickSelect(1)} className="px-3 py-1.5 border border-[#eaeaea] text-[11px] rounded hover:border-[#1a1a1a] transition-colors">Thuê lẻ 1 ngày</button>
                  <button onClick={() => handleQuickSelect(3)} className="px-3 py-1.5 border border-[#eaeaea] text-[11px] rounded hover:border-[#1a1a1a] transition-colors">Gói 3 ngày</button>
                  <button onClick={() => handleQuickSelect(5)} className="px-3 py-1.5 border border-[#eaeaea] text-[11px] rounded hover:border-[#1a1a1a] transition-colors">Gói 5 ngày</button>
                </div>

                {/* Quantity */}
                <div className="flex items-center justify-between bg-[#faf9f7] p-3 rounded border border-[#eaeaea]">
                  <span className="text-[12px] uppercase tracking-[0.05em] text-[#666] font-medium">Số lượng thuê</span>
                  <div className="flex items-center gap-4">
                    <button onClick={handleDecreaseQty} disabled={quantity <= 1} className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-[#ddd] hover:bg-gray-50 disabled:opacity-50 transition-colors">-</button>
                    <span className="text-[14px] font-bold min-w-[20px] text-center">{quantity}</span>
                    <button onClick={handleIncreaseQty} disabled={!selectedVariant || quantity >= selectedVariant.availableStock} className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-[#ddd] hover:bg-gray-50 disabled:opacity-50 transition-colors">+</button>
                  </div>
                </div>
              </div>

              {/* Dynamic Billing Summary */}
              <div className="bg-gray-50 rounded-xl p-5 mb-8 border border-[#e8e8e8]">
                <h4 className="text-[13px] font-semibold text-[#1a1a1a] mb-4">Tóm tắt chi phí tạm tính</h4>
                <div className="space-y-3 text-[13px]">
                  <div className="flex justify-between text-[#666]">
                    <span>Tiền thuê ({formatPrice(costume.rentalRates?.pricePerDay || 0)} x {rentalDays} ngày x {quantity} bộ)</span>
                    <span className="font-semibold text-[#1a1a1a]">{formatPrice((costume.rentalRates?.pricePerDay || 0) * rentalDays * quantity)}</span>
                  </div>
                  <div className="flex justify-between text-[#666]">
                    <span>Tiền cọc ({formatPrice(costume.deposit || 0)} x {quantity} bộ)</span>
                    <span className="font-semibold text-[#1a1a1a]">{formatPrice((costume.deposit || 0) * quantity)}</span>
                  </div>
                  <div className="pt-3 border-t border-dashed border-[#ccc] flex justify-between items-center">
                    <span className="font-bold text-[#1a1a1a] uppercase text-[12px]">Tổng thanh toán</span>
                    <span className="font-bold text-[#f94a00] text-[18px]">
                      {formatPrice(((costume.rentalRates?.pricePerDay || 0) * rentalDays * quantity) + ((costume.deposit || 0) * quantity))}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mb-8">
                <button
                  onClick={() => {
                    if (costume.status === "available") {
                      if (!isInCart) addToCart(costume, selectedVariant, quantity, startDate, endDate, rentalDays);
                      navigate("/cart");
                    }
                  }}
                  className={`flex-[2] flex items-center justify-center gap-2 py-4 rounded-lg text-[13px] uppercase tracking-[0.08em] font-bold transition-all duration-300 ${costume.status === "available"
                    ? "bg-[#1a1a1a] text-white hover:bg-[#333] hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
                    : "bg-[#e8e8e8] text-[#999] cursor-not-allowed"
                    }`}
                  disabled={costume.status !== "available" || !selectedVariant}
                >
                  Thuê Ngay
                </button>

                <button
                  onClick={() => {
                    if (!isInCart && costume.status === "available") {
                      addToCart(costume, selectedVariant, quantity, startDate, endDate, rentalDays);
                      showToast("Đã thêm vào giỏ hàng");
                    }
                    else if (isInCart) {
                      removeFromCart(costume._id, selectedVariant?._id, startDate, endDate);
                      showToast("Đã bỏ khỏi giỏ hàng");
                    }
                  }}
                  className={`flex-[2] flex items-center justify-center gap-2 py-4 rounded-lg text-[13px] uppercase tracking-[0.08em] font-bold transition-all duration-300 border-2 ${isInCart
                    ? "border-emerald-500 bg-emerald-50 text-[#1a1a1a] hover:bg-emerald-100 hover:-translate-y-0.5 active:translate-y-0"
                    : costume.status === "available"
                      ? "border-[#1a1a1a] bg-white text-[#1a1a1a] hover:bg-[#fafafa] hover:-translate-y-0.5 active:translate-y-0"
                      : "border-[#eaeaea] bg-white text-[#999] cursor-not-allowed"
                    }`}
                  disabled={costume.status !== "available" && !isInCart}
                >
                  <FontAwesomeIcon icon={isInCart ? faCheck : faCartPlus} className="text-[14px]" />
                  {isInCart ? "Đã Thêm" : "Thêm Vào Giỏ"}
                </button>
              </div>

              {/* Service Guarantees */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="flex items-center gap-3 text-[12px] text-[#666] bg-white p-3 rounded border border-[#f0ece8]">
                  <FontAwesomeIcon icon={faTruckFast} className="text-[#1a1a1a] text-[16px]" />
                  <span>Giao hàng hỏa tốc trong 2H</span>
                </div>
                <div className="flex items-center gap-3 text-[12px] text-[#666] bg-white p-3 rounded border border-[#f0ece8]">
                  <FontAwesomeIcon icon={faRotateLeft} className="text-[#1a1a1a] text-[16px]" />
                  <span>Đổi trả linh hoạt nếu không vừa</span>
                </div>
              </div>

              {/* Description */}
              <div>
                <h4 className="text-[13px] uppercase tracking-[0.1em] font-semibold text-[#1a1a1a] mb-3">
                  Mô Tả Sản Phẩm
                </h4>
                <div className="text-[14px] leading-relaxed text-[#666] whitespace-pre-wrap bg-white p-5 rounded-xl border border-[#f0ece8]">
                  {costume.description || "Chưa có mô tả chi tiết cho sản phẩm này."}
                </div>
              </div>

            </div>
          </div>

        </div>
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
