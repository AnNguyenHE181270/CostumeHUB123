import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash, faArrowRight, faCalendarDays, faShieldHalved, faTags } from "@fortawesome/free-solid-svg-icons";
import { formatPrice, getRentalDays } from "../utils/formatters"
import DatePickerGroup from "../components/ui/DatePickerGroup"
import Selector from "../components/ui/Selector"

function invalidMessage(item, cartErrors = {}) {
  if (!item) return false;
  return !!item.dateError || !!cartErrors[item._id];
}

export default function CartPage() {
  const { cartItems, removeFromCart, clearCart, updateCartItem } = useCart();
  const navigate = useNavigate();
  const pendingStartRef = useRef({});
  const [cartErrors, setCartErrors] = useState({}); // { [itemId]: "error message" }

  const setItemError = (id, msg) => setCartErrors(prev => ({ ...prev, [id]: msg }));
  const clearItemError = (id) => setCartErrors(prev => { const n = { ...prev }; delete n[id]; return n; });
  const [selectedIds, setSelectedIds] = useState(() =>
    cartItems.filter(item => (item.variant?.availableStock || 0) > 0).map(item => item._id)
  );

  useEffect(() => {
    setSelectedIds(prev => {
      const currentIds = cartItems
        .filter(item => (item.variant?.availableStock || 0) > 0 && !invalidMessage(item, cartErrors))
        .map(item => item._id);
      if (prev.length === 0 && currentIds.length > 0) {
        return currentIds;
      }
      return prev.filter(id => currentIds.includes(id));
    });
  }, [cartItems, cartErrors]);

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(
        cartItems
          .filter(item => (item.variant?.availableStock || 0) > 0 && !invalidMessage(item, cartErrors))
          .map(item => item._id)
      );
    } else {
      setSelectedIds([]);
    }
  };

  const toggleItemSelection = (id) => {
    const item = cartItems.find(item => item._id === id);
    if (!item) return;
    if ((item.variant?.availableStock || 0) <= 0) return; // Không cho phép chọn sản phẩm hết hàng
    if (invalidMessage(item, cartErrors)) return; // Không cho phép chọn sản phẩm ngày không hợp lệ
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(selectedId => selectedId !== id) : [...prev, id]
    );
  };

  const selectedCartItems = cartItems.filter(item => selectedIds.includes(item._id));
  // tính tiền thuê
  const totalRental = selectedCartItems.reduce((sum, item) => {
    const days = getRentalDays(item.startDate, item.endDate);
    const factor = days >= 3 ? 1.1 : 1.0;
    return sum + item.rentalPerDay * factor * item.quantity;
  }, 0);

  const totalDeposit = selectedCartItems.reduce(
    (sum, item) => sum + item.deposit * (item.quantity || 1),
    0
  );
  const total = totalRental + totalDeposit;

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-24 h-24 mb-6 rounded-full bg-white flex items-center justify-center shadow-sm">
          <svg
            className="w-10 h-10 text-[#d0c9c0]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
              d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
            />
          </svg>
        </div>
        <h2 className="text-[24px] font-bold text-[#1a1a1a] mb-2" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
          Giỏ Hàng Trống
        </h2>
        <p className="text-[#666] mb-8 text-[14px]">
          Bạn chưa chọn sản phẩm nào để thuê. Khám phá ngay các bộ sưu tập của chúng tôi.
        </p>
        <Link
          to="/products"
          className="px-8 py-3.5 bg-[#1a1a1a] text-white rounded text-[12px] uppercase tracking-[0.1em] font-semibold hover:bg-[#333] transition-colors"
        >
          Tiếp tục mua sắm
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#eaeaea] px-6 py-4 mx-auto my-6 max-w-[1200px] rounded-xl">
      <h3 className="text-3xl font-bold text-[#1a1a1a]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
        Giỏ Thuê Của Bạn
      </h3>
      <p className="text-[14px] text-[#858585] pb-4 mb-2 border-b border-[#eaeaea]">
        Xem lại các trang phục bạn đã chọn và tiến hành đặt thuê.
      </p>


      <div className="flex flex-col lg:flex-row gap-8 items-start">

        {/* Cart Items List */}
        <div className="w-full py-6 lg:w-2/3 flex flex-col gap-5">
          <div className="flex justify-between items-center">
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={
                  cartItems.filter(item => (item.variant?.availableStock || 0) > 0).length > 0 &&
                  cartItems.filter(item => (item.variant?.availableStock || 0) > 0).every(item => selectedIds.includes(item._id))
                }
                onChange={handleSelectAll}
                className="w-5 h-5 cursor-pointer accent-[#1a1a1a] border-[#ccc] rounded transition-all"
              />
              Tất cả ({cartItems.length})

            </label>
            <button
              onClick={clearCart}
              className="text-sm text-red-500 hover:text-red-700 font-medium flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-red-50 transition-colors"
            >
              Xóa tất cả
            </button>
          </div>
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
                className={`rounded-xl border p-2 flex flex-col sm:flex-row gap-5 relative group shadow-sm hover:shadow-md transition-all cursor-pointer items-stretch ${itemOutOfStock ? "bg-[#fafafa] border-red-100 opacity-80" : ""}`}
              >
                {/* Checkbox */}
                <div className="pl-2 sm:pl-3 flex items-center" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    disabled={itemCheckboxDisabled}
                    onChange={() => !itemCheckboxDisabled && toggleItemSelection(itemId)}
                    className="w-5 h-5 cursor-pointer accent-[#1a1a1a] border-[#ccc] rounded transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>

                {/* Delete Btn */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFromCart(item.costumeId || item._id, item.size, item.startDate, item.endDate);
                  }}
                  className="absolute top-1/2 -translate-y-1/2 right-4 w-8 h-8 rounded-full bg-[#faf9f7] text-[#999] flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-colors z-10"
                  title="Xóa khỏi giỏ"
                >
                  <FontAwesomeIcon icon={faTrash} className="text-[13px]" />
                </button>

                {/* Image */}
                <div className="w-[100px] sm:w-[130px] aspect-[3/4] mt-3 rounded-lg overflow-hidden bg-[#f5f5f5] flex-shrink-0 self-start relative">
                  <img
                    src={item.image}
                    alt={item.costumeName}
                    className={`w-full h-full object-cover ${itemOutOfStock ? "grayscale" : ""}`}
                  />
                  {itemOutOfStock && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <span className="text-white text-[11px] font-bold uppercase tracking-wider px-2 py-1 bg-red-600 rounded">
                        Hết hàng
                      </span>
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex flex-col flex-1 py-2">
                  <p className="text-[10px] uppercase tracking-[0.1em] text-[#999] font-semibold mb-1">
                    {item.category}
                  </p>
                  <Link to={`/product/${item.costumeId}`} onClick={(e) => e.stopPropagation()} className="text-[16px] font-bold text-[#1a1a1a] hover:text-[#707070] transition-colors line-clamp-1 mb-2 relative z-10 w-fit block">
                    {item.costumeName}
                  </Link>

                  <div className="flex items-center gap-3">
                    <span className="text-[13px] text-[#666]">Size:</span>
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
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[13px] text-[#666]">Số lượng:</span>
                    <div className="flex items-center gap-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (updateCartItem) updateCartItem(item.costumeId || item._id, item.size, item.startDate, item.endDate, item.size, item.quantity - 1);
                        }}
                        disabled={itemOutOfStock || item.quantity <= 1}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-[#ddd] hover:bg-gray-50 disabled:opacity-50 transition-colors">-</button>
                      <span className="text-[14px] font-bold min-w-[20px] text-center">{item.quantity}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (updateCartItem) updateCartItem(item.costumeId || item._id, item.size, item.startDate, item.endDate, item.size, item.quantity + 1);
                        }}
                        disabled={itemOutOfStock || (item.variant?.availableStock ? item.quantity >= item.variant.availableStock : false)}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-[#ddd] hover:bg-gray-50 disabled:opacity-50 transition-colors">+</button>
                    </div>
                  </div>

                  <div onClick={(e) => e.stopPropagation()} className="mt-2">

                    <DatePickerGroup
                      startDate={item.startDate}
                      disabled={itemOutOfStock}
                      minRentalDays={item.minRentalDays}
                      setStartDate={async (newStart) => {
                        const newEnd = newStart > item.endDate ? newStart : item.endDate;
                        pendingStartRef.current[itemId] = newStart;
                        if (updateCartItem) {
                          const result = await updateCartItem(item.costumeId || item._id, item.size, item.startDate, item.endDate, item.size, item.quantity, newStart, newEnd);
                          if (result?.error) setItemError(itemId, result.error);
                          else clearItemError(itemId);
                        }
                      }}
                      endDate={item.endDate}
                      setEndDate={async (newEnd) => {
                        const effectiveStart = pendingStartRef.current[itemId] ?? item.startDate;
                        delete pendingStartRef.current[itemId];
                        if (updateCartItem) {
                          const result = await updateCartItem(item.costumeId || item._id, item.size, item.startDate, item.endDate, item.size, item.quantity, effectiveStart, newEnd);
                          if (result?.error) setItemError(itemId, result.error);
                          else clearItemError(itemId);
                        }
                      }}
                    />
                  </div>
                  {itemDateInvalidMessage && (
                    <div className="flex items-center gap-2 mt-2 px-3 py-2 bg-amber-50 border border-amber-300 rounded-lg">
                      <svg className="w-4 h-4 text-amber-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <span className="text-[12px] font-semibold text-amber-700">
                        {itemDateInvalidMessage}
                      </span>
                    </div>
                  )}
                </div>

                {/* Pricing summary for this item */}
                <div className="w-full sm:w-[200px] flex flex-col justify-center border-t sm:border-t-0 sm:border-l border-[#f0ece8] pt-4 sm:pt-0 sm:pl-5">
                  {(() => {
                    const factor = rentalDays >= 3 ? 1.1 : 1.0;
                    const adjustedRentalPerDay = item.rentalPerDay * factor;
                    return (
                      <>
                        <p className="text-[16px] font-bold text-[#1a1a1a] mb-2">
                          {formatPrice(adjustedRentalPerDay * (item.quantity || 1))}
                        </p>
                        <p className="text-[11px] text-[#999] mb-1">
                          {formatPrice(adjustedRentalPerDay)} / ngày {factor > 1 ? "(+10%)" : ""}
                        </p>
                      </>
                    );
                  })()}
                  <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#666] bg-[#f5f5f5] w-fit px-2 py-1 rounded">
                    <FontAwesomeIcon icon={faCalendarDays} className="text-[#999]" />
                    <span>{rentalDays} ngày</span>
                  </div>
                </div>
              </div>
            )
          })}


        </div>

        {/* Order Summary Sidebar */}
        <div className="w-full p-6 lg:w-1/3 mt-20 bg-white rounded-xl border border-[#f0ece8] shadow-sm sticky top-[100px]">
          <h3 className="text-[18px] font-bold text-[#1a1a1a] mb-6 border-b border-[#eaeaea] pb-4" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            Tóm Tắt Đơn Hàng
          </h3>

          <div className="space-y-4 text-[14px]">
            <div className="flex justify-between text-[#666]">
              <span className="flex items-center gap-1.5">
                <FontAwesomeIcon icon={faTags} className="text-[#1a1a1a]" /> Tổng tiền thuê
              </span>
              <span className="font-semibold text-[#1a1a1a]">{formatPrice(totalRental)}</span>
            </div>
            <div className="flex justify-between text-[#666]">
              <span className="flex items-center gap-1.5">
                <FontAwesomeIcon icon={faShieldHalved} className="text-emerald-500" /> Tiền cọc (Hoàn trả)
              </span>
              <span className="font-semibold text-[#1a1a1a]">{formatPrice(totalDeposit)}</span>
            </div>
          </div>

          <div className="my-6 border-t border-dashed border-[#dcdcdc]" />

          <div className="flex justify-between items-end mb-8">
            <span className="text-[14px] font-bold text-[#1a1a1a] uppercase tracking-wide">Tổng Thanh Toán</span>
            <span className="text-[24px] font-bold text-[#1a1a1a] leading-none text-right">
              {formatPrice(total)}
            </span>
          </div>

          <button
            onClick={() => navigate("/checkout", { state: { selectedIds } })}
            disabled={selectedIds.length === 0}
            className={`w-full py-4 rounded-lg text-[13px] uppercase tracking-[0.1em] font-bold transition-all duration-300 flex items-center justify-center gap-3 ${selectedIds.length === 0
              ? "bg-[#e8e8e8] text-[#999] cursor-not-allowed"
              : "bg-[#1a1a1a] text-white hover:bg-[#333] hover:shadow-lg"
              }`}
          >
            Tiến Hành Đặt Thuê {selectedIds.length > 0 ? `(${selectedIds.length})` : ""}
            <FontAwesomeIcon icon={faArrowRight} />
          </button>

          <p className="text-[11px] text-[#999] text-center mt-4">
            Bạn có thể kiểm tra kỹ thông tin sản phẩm trước khi chốt.
          </p>
        </div>

      </div>
    </div>
  );
}
