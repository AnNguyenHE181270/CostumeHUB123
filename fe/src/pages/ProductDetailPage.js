import React, { useState, useEffect } from "react";
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
} from "@fortawesome/free-solid-svg-icons";
import { useCart } from "../context/CartContext";
import Toast from "../components/ui/Toast";

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

  const [toast, setToast] = useState({ isVisible: false, message: "", type: "success" });
  const showToast = (message, type = "success") => {
    setToast({ isVisible: true, message, type });
  };

  const isInCart = costume ? cartItems.some(item => item.costume._id === costume._id) : false;

  useEffect(() => {
    const fetchCostume = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/api/costumes/${id}`);
        const data = await res.json();
        setCostume(data.costume);
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
                    className={`relative w-20 aspect-[3/4] flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                      activeImage === idx ? "border-[#1a1a1a] opacity-100" : "border-transparent opacity-60 hover:opacity-100"
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
                    {['S', 'M', 'L', 'XL', 'Free Size'].map((size) => {
                      const isAvailable = costume.size ? (costume.size.toUpperCase() === size.toUpperCase() || (costume.size === "" && size === "Free Size")) : size === "Free Size";
                      return (
                        <button
                          key={size}
                          disabled={!isAvailable}
                          className={`min-w-[40px] px-3 py-2 text-[13px] font-medium rounded border transition-all ${
                            isAvailable
                              ? "border-[#1a1a1a] bg-[#1a1a1a] text-white shadow-md"
                              : "border-[#eaeaea] bg-[#faf9f7] text-[#ccc] cursor-not-allowed"
                          }`}
                        >
                          {size}
                        </button>
                      );
                    })}
                  </div>
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

              {/* Action Buttons */}
              <div className="flex gap-3 mb-8">
                <button 
                  onClick={() => {
                    if (costume.status === "available") {
                      if (!isInCart) addToCart(costume);
                      navigate("/cart");
                    }
                  }}
                  className={`flex-[2] flex items-center justify-center gap-2 py-4 rounded-lg text-[13px] uppercase tracking-[0.08em] font-bold transition-all duration-300 ${
                    costume.status === "available" 
                      ? "bg-[#1a1a1a] text-white hover:bg-[#333] hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
                      : "bg-[#e8e8e8] text-[#999] cursor-not-allowed"
                  }`}
                  disabled={costume.status !== "available"}
                >
                  Thuê Ngay
                </button>
                
                <button 
                  onClick={() => {
                    if (!isInCart && costume.status === "available") {
                      addToCart(costume);
                      showToast("Đã thêm vào giỏ hàng");
                    }
                    else if (isInCart) {
                      removeFromCart(costume._id);
                      showToast("Đã bỏ khỏi giỏ hàng");
                    }
                  }}
                  className={`flex-[2] flex items-center justify-center gap-2 py-4 rounded-lg text-[13px] uppercase tracking-[0.08em] font-bold transition-all duration-300 border-2 ${
                    isInCart 
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
