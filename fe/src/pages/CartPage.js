import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTrash,
  faArrowRight,
  faShieldHalved,
  faTags,
  faBagShopping,
  faGem,
  faCheck,
  faTruckFast,
  faXmark,
  faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";
import { formatPrice, getRentalDays, getRentalPriceFactor } from "../utils/formatters";
import DatePickerGroup from "../components/ui/DatePickerGroup";
import Selector from "../components/ui/Selector";
import rentalService from "../services/rental.service";

function invalidMessage(item, cartErrors = {}) {
  if (!item) return false;
  return !!item.dateError || !!cartErrors[item._id];
}

const SERIF = { fontFamily: "'Cormorant Garamond', serif" };

export default function CartPage() {
  const { cartItems, removeFromCart, clearCart, updateCartItem } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const pendingStartRef = useRef({});
  const pendingEndRef = useRef({});
  const [cartErrors, setCartErrors] = useState({});
  const [checkoutWarning, setCheckoutWarning] = useState(location.state?.checkoutError || null);
  const [addressEstimate, setAddressEstimate] = useState({ loading: false, date: null });

  useEffect(() => {
    if (location.state?.checkoutError) {
      navigate(location.pathname, { replace: true, state: {} });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Đọc theo địa chỉ mặc định của khách để báo ngay ngày giao dự kiến ngay tại giỏ hàng,
  // không cần đợi tới bước thanh toán.
  const defaultAddress = user?.addresses?.find((a) => a.isDefault) || user?.addresses?.[0] || null;

  useEffect(() => {
    if (!defaultAddress?.districtId || !defaultAddress?.wardCode) {
      setAddressEstimate({ loading: false, date: null });
      return;
    }
    let cancelled = false;
    setAddressEstimate((prev) => ({ ...prev, loading: true }));
    rentalService
      .estimateDelivery(defaultAddress.districtId, defaultAddress.wardCode)
      .then((data) => {
        if (!cancelled) setAddressEstimate({ loading: false, date: new Date(data.estimatedDeliveryDate) });
      })
      .catch(() => {
        if (!cancelled) setAddressEstimate({ loading: false, date: null });
      });
    return () => {
      cancelled = true;
    };
  }, [defaultAddress?.districtId, defaultAddress?.wardCode]);

  const setItemError = (id, msg) => setCartErrors((prev) => ({ ...prev, [id]: msg }));
  const clearItemError = (id) =>
    setCartErrors((prev) => {
      const n = { ...prev };
      delete n[id];
      return n;
    });

  const [selectedIds, setSelectedIds] = useState(() =>
    cartItems.filter((item) => (item.variant?.availableStock || 0) > 0).map((item) => item._id)
  );

  useEffect(() => {
    setSelectedIds((prev) => {
      const currentIds = cartItems
        .filter((item) => (item.variant?.availableStock || 0) > 0 && !invalidMessage(item, cartErrors))
        .map((item) => item._id);
      if (prev.length === 0 && currentIds.length > 0) {
        return currentIds;
      }
      return prev.filter((id) => currentIds.includes(id));
    });
  }, [cartItems, cartErrors]);

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(
        cartItems
          .filter((item) => (item.variant?.availableStock || 0) > 0 && !invalidMessage(item, cartErrors))
          .map((item) => item._id)
      );
    } else {
      setSelectedIds([]);
    }
  };

  const toggleItemSelection = (id) => {
    const item = cartItems.find((item) => item._id === id);
    if (!item) return;
    if ((item.variant?.availableStock || 0) <= 0) return;
    if (invalidMessage(item, cartErrors)) return;
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((selectedId) => selectedId !== id) : [...prev, id]
    );
  };

  const selectedCartItems = cartItems.filter((item) => selectedIds.includes(item._id));

  const totalRental = selectedCartItems.reduce((sum, item) => {
    const days = getRentalDays(item.startDate, item.endDate);
    const factor = getRentalPriceFactor(days);
    return sum + item.rentalPerDay * factor * item.quantity;
  }, 0);

  const totalDeposit = selectedCartItems.reduce(
    (sum, item) => sum + item.deposit * (item.quantity || 1),
    0
  );
  const total = totalRental + totalDeposit;

  // ── EMPTY CART STATE ──
  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-[#faf6f0] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-24 h-24 mb-6 rounded-3xl bg-white border border-[#e6dcab] flex items-center justify-center shadow-xl relative group">
          <FontAwesomeIcon icon={faBagShopping} className="w-10 h-10 text-[#d4af37] transition-transform duration-500 group-hover:scale-110" />
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#d4af37] animate-ping" />
        </div>
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] bg-black text-[#f5e6ca] mb-3 shadow-md">
          <FontAwesomeIcon icon={faGem} className="text-[9px] text-[#d4af37]" />
          Giỏ Hàng Trống
        </div>
        <h2 className="text-[32px] sm:text-[40px] font-bold text-[#1a1a1a] mb-3" style={SERIF}>
          Chưa Có Phục Trang Nào Trong Giỏ
        </h2>
        <p className="text-[#665a45] mb-8 text-[14px] max-w-[480px] leading-relaxed">
          Khám phá ngay bộ sưu tập thiết kế thượng hạng của CostumeHUB và lựa chọn phong cách tỏa sáng cho sự kiện sắp tới.
        </p>
        <Link
          to="/collections"
          className="px-8 py-3.5 bg-gradient-to-r from-[#1a1a1a] via-[#2d2d2d] to-[#121212] text-[#f5e6ca] rounded-2xl text-[12px] uppercase tracking-[0.15em] font-bold hover:brightness-125 transition-all duration-300 shadow-xl border border-[#c9a869]/40 flex items-center gap-2.5"
        >
          Khám Phá Bộ Sưu Tập
          <FontAwesomeIcon icon={faArrowRight} className="text-[12px] text-[#d4af37]" />
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-[#faf6f0] min-h-screen py-8 lg:py-12 px-4 sm:px-6">
      {/* Khung duy nhất bao bọc toàn bộ giỏ hàng */}
      <div className="mx-auto max-w-[1280px] bg-white rounded-3xl border border-[#e6dcab] p-6 sm:p-8 lg:p-10 shadow-[0_15px_50px_rgba(0,0,0,0.04)]">
        {/* Cảnh báo giao hàng không kịp ngày khách chọn (kiểm tra qua GHN) */}
        {checkoutWarning && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 sm:p-5">
            <FontAwesomeIcon icon={faTruckFast} className="mt-0.5 text-amber-500 text-lg shrink-0" />
            <p className="flex-1 text-[13px] sm:text-[14px] text-amber-800 leading-relaxed font-medium">
              {checkoutWarning}
            </p>
            <button
              onClick={() => setCheckoutWarning(null)}
              className="text-amber-500 hover:text-amber-700 transition-colors shrink-0"
              title="Đóng"
            >
              <FontAwesomeIcon icon={faXmark} />
            </button>
          </div>
        )}

        {/* Header */}
        <div className="mb-8 border-b border-[#e6dcab]/80 pb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] bg-black text-[#f5e6ca] mb-2 shadow-sm">
              <FontAwesomeIcon icon={faGem} className="text-[9px] text-[#d4af37]" />
              GIỎ THUÊ THỜI TRANG CAO CẤP
            </div>
            <h1 className="text-[32px] lg:text-[40px] font-bold text-[#1a1a1a] leading-none tracking-tight" style={SERIF}>
              Giỏ Thuê Của Bạn
            </h1>
          </div>
          <p className="text-[13px] text-[#8a7d63] max-w-[400px]">
            Kiểm tra các thiết kế thượng hạng đã chọn, điều chỉnh số ngày và sẵn sàng tỏa sáng.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-10 items-start">
          {/* LEFT: Cart Items List */}
          <div className="w-full lg:w-2/3 flex flex-col gap-6">
            {/* Select All & Clear All Bar */}
            <div className="bg-[#faf6f0]/80 rounded-2xl border border-[#e6dcab]/80 p-4 px-6 shadow-sm flex items-center justify-between">
              <label className="flex items-center gap-3 cursor-pointer group select-none">
                <input
                  type="checkbox"
                  checked={
                    cartItems.filter((item) => (item.variant?.availableStock || 0) > 0 && !invalidMessage(item, cartErrors)).length > 0 &&
                    cartItems.filter((item) => (item.variant?.availableStock || 0) > 0 && !invalidMessage(item, cartErrors)).every((item) => selectedIds.includes(item._id))
                  }
                  onChange={handleSelectAll}
                  className="w-5 h-5 cursor-pointer accent-[#b8935a] border-[#e2d5bd] rounded-md transition-all"
                />
                <span className="text-[13px] font-bold text-[#1a1a1a] uppercase tracking-wider">
                  Chọn tất cả ({cartItems.length} trang phục)
                </span>
              </label>

              <button
                onClick={clearCart}
                className="text-[12px] text-rose-600 hover:text-rose-800 font-bold uppercase tracking-wider flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-rose-50 transition-colors"
              >
                <FontAwesomeIcon icon={faTrash} className="text-[11px]" />
                Xóa tất cả
              </button>
            </div>

            {/* Item List */}
            {cartItems.map((item) => {
              const itemId = item._id;
              const isSelected = selectedIds.includes(itemId);
              const rentalDays = getRentalDays(item.startDate, item.endDate);
              const itemOutOfStock = (item.variant?.availableStock || 0) <= 0;
              const itemDateInvalidMessage = item.dateError || cartErrors[itemId];
              const itemDateInvalid = !itemOutOfStock && !!itemDateInvalidMessage;
              const itemCheckboxDisabled = itemOutOfStock || itemDateInvalid;

              return (
                <div
                  key={itemId}
                  onClick={() => !itemCheckboxDisabled && toggleItemSelection(itemId)}
                  className={`bg-white rounded-3xl border p-5 sm:p-6 flex flex-col sm:flex-row gap-6 relative group shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer items-stretch ${isSelected
                      ? "border-[#c9a869] ring-2 ring-[#c9a869]/20 bg-[#fffdf9]"
                      : "border-[#e6dcab]/80"
                    } ${itemOutOfStock ? "bg-[#faf9f7] opacity-75" : ""}`}
                >
                  {/* Delete Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFromCart(item.costumeId || item._id, item.size, item.startDate, item.endDate);
                    }}
                    className="absolute top-4 right-4 w-9 h-9 rounded-full bg-[#faf6f0] text-[#8a7d63] flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all duration-200 z-20 shadow-sm"
                    title="Xóa khỏi giỏ"
                  >
                    <FontAwesomeIcon icon={faTrash} className="text-[12px]" />
                  </button>

                  <div className="flex flex-col flex-1 min-w-0 gap-4 sm:gap-2">
                    <div className="flex flex-col sm:flex-row gap-6 items-stretch w-full">
                      {/* Checkbox */}
                  <div className="flex items-center shrink-0" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      disabled={itemCheckboxDisabled}
                      onChange={() => !itemCheckboxDisabled && toggleItemSelection(itemId)}
                      className="w-5 h-5 cursor-pointer accent-[#b8935a] border-[#e2d5bd] rounded-md transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    />
                  </div>

                  {/* Image */}
                  <div className="w-[110px] sm:w-[130px] aspect-[3/4] rounded-2xl overflow-hidden bg-[#f5f3f0] border border-[#e6dcab]/60 flex-shrink-0 self-start relative shadow-sm group-hover:scale-[1.02] transition-transform duration-300">
                    <img
                      src={item.image}
                      alt={item.costumeName}
                      className={`w-full h-full object-cover ${itemOutOfStock ? "grayscale" : ""}`}
                    />
                    {itemOutOfStock && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center p-1 text-center">
                        <span className="text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-rose-600 rounded-md shadow">
                          Tạm hết hàng
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Details Container */}
                  <div className="flex flex-col flex-1 min-w-0 pr-8">
                    {item.category && (
                      <p className="text-[10px] uppercase tracking-[0.2em] text-[#b8935a] font-bold mb-1">
                        {item.category}
                      </p>
                    )}
                    <Link
                      to={`/product/${item.costumeId}`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-[18px] sm:text-[20px] font-bold text-[#1a1a1a] hover:text-[#b8935a] transition-colors line-clamp-1 mb-3 block"
                      style={SERIF}
                    >
                      {item.costumeName}
                    </Link>

                    {/* Size & Quantity Controls */}
                    <div className="flex flex-wrap items-center gap-6 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#8a7d63]">Size:</span>
                        <Selector
                          value={item.size}
                          variants={item.variants}
                          disabled={itemOutOfStock}
                          onChange={(newSize) => {
                            if (updateCartItem && newSize !== item.size)
                              updateCartItem(item.costumeId || item._id, item.size, item.startDate, item.endDate, newSize, item.quantity);
                          }}
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#8a7d63]">Số lượng:</span>
                        <div className="flex items-center gap-2 bg-[#faf6f0] border border-[#e2d5bd] rounded-full p-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (updateCartItem) updateCartItem(item.costumeId || item._id, item.size, item.startDate, item.endDate, item.size, item.quantity - 1);
                            }}
                            disabled={itemOutOfStock || item.quantity <= 1}
                            className="w-7 h-7 flex items-center justify-center rounded-full bg-white text-[#1a1a1a] hover:bg-[#1a1a1a] hover:text-white disabled:opacity-40 transition-colors font-bold text-xs shadow-sm"
                          >
                            -
                          </button>
                          <span className="text-[13px] font-bold min-w-[20px] text-center text-[#1a1a1a]">{item.quantity}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (updateCartItem) updateCartItem(item.costumeId || item._id, item.size, item.startDate, item.endDate, item.size, item.quantity + 1);
                            }}
                            disabled={itemOutOfStock || (item.variant?.availableStock ? item.quantity >= item.variant.availableStock : false)}
                            className="w-7 h-7 flex items-center justify-center rounded-full bg-white text-[#1a1a1a] hover:bg-[#1a1a1a] hover:text-white disabled:opacity-40 transition-colors font-bold text-xs shadow-sm"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>

                    <div onClick={(e) => e.stopPropagation()} className="mt-1">
                      <DatePickerGroup
                        startDate={pendingStartRef.current[itemId] || item.startDate}
                        disabled={itemOutOfStock}
                        minRentalDays={item.minRentalDays}
                        setStartDate={(newStart) => {
                          pendingStartRef.current[itemId] = newStart;
                          clearItemError(itemId);
                          if (pendingStartRef.current[`timer_${itemId}`]) clearTimeout(pendingStartRef.current[`timer_${itemId}`]);
                          pendingStartRef.current[`timer_${itemId}`] = setTimeout(async () => {
                            const effectiveStart = pendingStartRef.current[itemId] || item.startDate;
                            const effectiveEnd = pendingEndRef.current[itemId] || item.endDate;
                            if (updateCartItem) {
                              const result = await updateCartItem(item.costumeId || item._id, item.size, item.startDate, item.endDate, item.size, item.quantity, effectiveStart, effectiveEnd);
                              if (result?.error) setItemError(itemId, result.error);
                              else {
                                clearItemError(itemId);
                                delete pendingStartRef.current[itemId];
                                delete pendingEndRef.current[itemId];
                              }
                            }
                          }, 400);
                        }}
                        endDate={pendingEndRef.current[itemId] || item.endDate}
                        setEndDate={(newEnd) => {
                          pendingEndRef.current[itemId] = newEnd;
                          // Force re-render to update UI immediately
                          clearItemError(itemId);

                          // Clear any existing timeout
                          if (pendingStartRef.current[`timer_${itemId}`]) clearTimeout(pendingStartRef.current[`timer_${itemId}`]);

                          pendingStartRef.current[`timer_${itemId}`] = setTimeout(async () => {
                            const effectiveStart = pendingStartRef.current[itemId] || item.startDate;
                            const effectiveEnd = pendingEndRef.current[itemId] || item.endDate;
                            if (updateCartItem) {
                              const result = await updateCartItem(item.costumeId || item._id, item.size, item.startDate, item.endDate, item.size, item.quantity, effectiveStart, effectiveEnd);
                              if (result?.error) setItemError(itemId, result.error);
                              else {
                                clearItemError(itemId);
                                delete pendingStartRef.current[itemId];
                                delete pendingEndRef.current[itemId];
                              }
                            }
                          }, 400);
                        }}
                      />
                    </div>
                  </div>
                  </div>

                  {itemDateInvalidMessage && (
                    <div className="flex items-center gap-2 px-3.5 py-2 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-[12px] font-semibold">
                      <span>⚠️ {itemDateInvalidMessage}</span>
                    </div>
                  )}

                  {!itemDateInvalidMessage && addressEstimate.date && new Date(item.startDate) < addressEstimate.date && (
                    <div className="flex items-start gap-2 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-[12px] font-semibold">
                      <FontAwesomeIcon icon={faTriangleExclamation} className="mt-0.5 shrink-0" />
                      <span className="flex-1">
                        Đơn hàng dự kiến được giao tới địa chỉ mặc định của bạn vào{" "}
                        {addressEstimate.date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })}
                        , hãy nới ngày nhận cho phù hợp để được hỗ trợ tốt nhất.
                      </span>
                    </div>
                  )}
                </div>

                {/* Pricing Summary For Item */}
                  <div className="w-full sm:w-[210px] flex flex-col justify-center border-t sm:border-t-0 sm:border-l border-[#f0e9d5] pt-4 sm:pt-0 sm:pl-6 shrink-0">
                    {(() => {
                      const factor = getRentalPriceFactor(rentalDays);
                      const adjustedRentalPrice = item.rentalPerDay * factor;
                      return (
                        <>
                          <span className="text-[10px] uppercase tracking-wider text-[#b8935a] font-bold block mb-1">
                            Tổng thuê ({rentalDays} ngày)
                          </span>
                          <p className="text-[20px] font-extrabold text-[#1a1a1a] leading-none mb-2">
                            {formatPrice(adjustedRentalPrice * (item.quantity || 1))}
                          </p>
                          <p className="text-[11px] text-[#8a7d63] mb-3">
                            {formatPrice(item.rentalPerDay)}/ngày {factor > 1 ? `(+${Math.round((factor - 1) * 100)}%)` : ""}
                          </p>
                        </>
                      );
                    })()}

                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#665a45] bg-[#faf6f0] border border-[#e8dfcd] px-3 py-1.5 rounded-xl w-fit">
                      <FontAwesomeIcon icon={faShieldHalved} className="text-[#d4af37] text-[12px]" />
                      <span>Cọc: <strong className="text-[#1a1a1a]">{formatPrice(item.deposit * (item.quantity || 1))}</strong></span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* RIGHT: Order Summary Box */}
          <div className="w-full lg:w-1/3 bg-[#faf6f0]/90 rounded-3xl border border-[#e6dcab] p-6 lg:p-8 shadow-md sticky top-[100px] space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <FontAwesomeIcon icon={faGem} className="text-[12px] text-[#d4af37]" />
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#b8935a]">
                  TÓM TẮT ĐƠN THUÊ
                </span>
              </div>
              <h3 className="text-[26px] font-bold text-[#1a1a1a] leading-tight" style={SERIF}>
                Tổng Chi Phí
              </h3>
            </div>

            <div className="space-y-4 text-[13px] border-t border-[#e6dcab]/80 pt-5">
              <div className="flex justify-between items-center text-[#665a45]">
                <span className="flex items-center gap-2 font-medium">
                  <FontAwesomeIcon icon={faTags} className="text-[#b8935a]" />
                  Tổng tiền thuê trang phục
                </span>
                <span className="font-bold text-[#1a1a1a] text-[15px]">{formatPrice(totalRental)}</span>
              </div>

              <div className="flex justify-between items-center text-[#665a45]">
                <span className="flex items-center gap-2 font-medium">
                  <FontAwesomeIcon icon={faShieldHalved} className="text-[#d4af37]" />
                  Tiền cọc bảo đảm (Hoàn 100%)
                </span>
                <span className="font-bold text-[#1a1a1a] text-[15px]">{formatPrice(totalDeposit)}</span>
              </div>

              <div className="flex justify-between items-center text-[#665a45] pt-2 border-t border-dashed border-[#e6dcab]">
                <span className="text-[12px] text-emerald-700 font-semibold flex items-center gap-1.5">
                  <FontAwesomeIcon icon={faCheck} className="text-emerald-600 text-[11px]" />
                  Vận chuyển GHN hỏa tốc
                </span>
                <span className="text-[12px] font-bold text-emerald-700">Tự động tính ở thanh toán</span>
              </div>
            </div>

            <div className="border-t border-[#e6dcab] pt-5">
              <div className="flex justify-between items-end mb-6">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#b8935a] block mb-1">
                    Tổng Thanh Toán
                  </span>
                  <span className="text-[11px] text-[#8a7d63] font-medium">Bao gồm tiền thuê + tiền cọc</span>
                </div>
                <span className="text-[28px] lg:text-[32px] font-extrabold text-[#1a1a1a] leading-none text-right tracking-tight">
                  {formatPrice(total)}
                </span>
              </div>

              <button
                onClick={() => navigate("/checkout", { state: { selectedIds } })}
                disabled={selectedIds.length === 0}
                className={`w-full py-4 rounded-2xl text-[12px] uppercase tracking-[0.15em] font-bold transition-all duration-300 flex items-center justify-center gap-3 shadow-lg ${selectedIds.length === 0
                    ? "bg-[#e5e0d8] text-[#a0988a] cursor-not-allowed shadow-none"
                    : "bg-gradient-to-r from-[#1a1a1a] via-[#2d2d2d] to-[#121212] text-[#f5e6ca] hover:brightness-125 border border-[#c9a869]/40 luxury-btn-gold-shine"
                  }`}
              >
                Tiến Hành Đặt Thuê {selectedIds.length > 0 ? `(${selectedIds.length})` : ""}
                <FontAwesomeIcon icon={faArrowRight} className="text-[12px] text-[#d4af37]" />
              </button>

              <p className="text-[11px] text-[#8a7d63] text-center mt-4 font-medium leading-relaxed">
                🔒 Cam kết hoàn 100% tiền cọc khi trả lại sản phẩm nguyên vẹn đúng hạn.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
