import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash, faArrowRight, faCalendarDays, faShieldHalved } from "@fortawesome/free-solid-svg-icons";

function formatPrice(price) {
  return new Intl.NumberFormat("vi-VN").format(price) + "đ";
}

export default function CartPage() {
  const { cartItems, removeFromCart, updateDates, clearCart } = useCart();
  const navigate = useNavigate();
  const getItemId = (item) => `${item.costume._id}-${item.variant?._id || 'novar'}-${item.startDate}-${item.endDate}`;

  const [expandedItem, setExpandedItem] = useState(null);
  const [selectedIds, setSelectedIds] = useState(() => cartItems.map(getItemId));

  // Đồng bộ selectedIds nếu cartItems thay đổi (vd: bị xóa đi)
  useEffect(() => {
    setSelectedIds(prev => prev.filter(id => cartItems.some(item => getItemId(item) === id)));
  }, [cartItems]);

  const toggleExpand = (id) => {
    setExpandedItem(prev => prev === id ? null : id);
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(cartItems.map(getItemId));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectItem = (id, checked) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
    }
  };

  const selectedCartItems = cartItems.filter(item => selectedIds.includes(getItemId(item)));

  const totalRental = selectedCartItems.reduce(
    (acc, item) =>
      acc + (item.costume.rentalRates?.pricePerDay || 0) * item.rentalDays * (item.quantity || 1),
    0
  );
  const totalDeposit = selectedCartItems.reduce(
    (acc, item) => acc + (item.costume.deposit || 0) * (item.quantity || 1),
    0
  );
  const grandTotal = totalRental + totalDeposit;

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
    <div className="bg-[#fafafa] min-h-screen pb-20">
      <div className="bg-white border-b border-[#e8e8e8]">
        <div className="mx-auto max-w-[1200px] px-6 py-4">
          <h1 className="text-[32px] font-bold text-[#1a1a1a]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            Giỏ Thuê Của Bạn
          </h1>
          <p className="text-[#999] text-[13px] mt-1 uppercase tracking-[0.1em]">
            {cartItems.length} sản phẩm trong giỏ
          </p>
          <div className="flex items-center gap-2 mt-4">
            <input
              type="checkbox"
              checked={selectedIds.length === cartItems.length && cartItems.length > 0}
              onChange={handleSelectAll}
              className="w-4 h-4 cursor-pointer accent-[#1a1a1a]"
            />
            <span className="text-[14px] text-[#1a1a1a] font-medium">Chọn tất cả</span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1200px] px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-8 items-start">

          {/* Cart Items List */}
          <div className="w-full lg:w-2/3 flex flex-col gap-5">
            {cartItems.map((item) => (
              <div key={getItemId(item)} className="bg-white rounded-xl border border-[#f0ece8] p-5 flex flex-col sm:flex-row gap-5 relative group shadow-sm hover:shadow-md transition-shadow">
                {/* Checkbox */}
                <div className="flex items-center sm:items-start pt-1">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(getItemId(item))}
                    onChange={(e) => handleSelectItem(getItemId(item), e.target.checked)}
                    className="w-4 h-4 cursor-pointer accent-[#1a1a1a]"
                  />
                </div>

                {/* Delete Btn */}
                <button
                  onClick={() => removeFromCart(item.costume._id, item.variant?._id, item.startDate, item.endDate)}
                  className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#faf9f7] text-[#999] flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-colors"
                  title="Xóa khỏi giỏ"
                >
                  <FontAwesomeIcon icon={faTrash} className="text-[13px]" />
                </button>

                {/* Image */}
                <div className="w-[100px] h-[130px] rounded-lg overflow-hidden bg-[#f5f5f5] flex-shrink-0">
                  <img
                    src={item.costume.images?.[0] || ""}
                    alt={item.costume.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Details */}
                <div className="flex-1 flex flex-col justify-center">
                  <div className="pr-10">
                    <p className="text-[10px] uppercase tracking-[0.1em] text-[#999] font-semibold mb-1">
                      {typeof item.costume.categoryId === 'object' ? item.costume.categoryId?.name : "Chưa phân loại"}
                    </p>
                    <Link to={`/product/${item.costume._id}`} className="text-[16px] font-bold text-[#1a1a1a] hover:text-[#707070] transition-colors line-clamp-1 mb-2">
                      {item.costume.name}
                    </Link>

                    <div className="flex items-center gap-6 text-[13px] text-[#666] mb-3">
                      <span>Size: <strong className="text-[#1a1a1a]">{item.variant?.size || item.costume.size || "Free"}</strong></span>
                      <span>Màu: <strong className="text-[#1a1a1a]">{item.costume.color || "N/A"}</strong></span>
                      {item.quantity && <span>Số lượng: <strong className="text-[#1a1a1a]">{item.quantity}</strong></span>}
                    </div>

                    {/* Toggle button to expand dates */}
                    <button
                      onClick={() => toggleExpand(getItemId(item))}
                      className="text-[11px] font-medium text-[#1a1a1a] underline hover:text-[#666] transition-colors flex items-center gap-1.5"
                    >
                      <FontAwesomeIcon icon={faCalendarDays} className="text-[#999]" />
                      {expandedItem === getItemId(item) ? "Ẩn chi tiết thuê" : "Tùy chỉnh ngày thuê"}
                    </button>
                  </div>

                  {/* Dates Selection (Collapsible) */}
                  {expandedItem === getItemId(item) && (
                    <div className="bg-[#faf9f7] rounded-lg p-3 grid grid-cols-2 gap-4 mt-4 animate-fade-in">
                      <div>
                        <label className="block text-[11px] uppercase tracking-[0.05em] text-[#999] font-medium mb-1">Ngày nhận</label>
                        <input
                          type="date"
                          value={item.startDate}
                          min={new Date().toISOString().split('T')[0]}
                          onChange={(e) => updateDates(item.costume._id, e.target.value, item.endDate)}
                          className="w-full bg-white border border-[#eaeaea] text-[13px] text-[#1a1a1a] rounded px-2.5 py-1.5 focus:border-[#1a1a1a] outline-none transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] uppercase tracking-[0.05em] text-[#999] font-medium mb-1">Ngày trả</label>
                        <input
                          type="date"
                          value={item.endDate}
                          min={item.startDate}
                          onChange={(e) => updateDates(item.costume._id, item.startDate, e.target.value)}
                          className="w-full bg-white border border-[#eaeaea] text-[13px] text-[#1a1a1a] rounded px-2.5 py-1.5 focus:border-[#1a1a1a] outline-none transition-colors"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Pricing summary for this item */}
                <div className="w-full sm:w-[140px] flex flex-col justify-center border-t sm:border-t-0 sm:border-l border-[#f0ece8] pt-4 sm:pt-0 sm:pl-5">
                  <p className="text-[11px] text-[#999] mb-1">
                    {formatPrice(item.costume.rentalRates?.pricePerDay || 0)} / ngày
                  </p>
                  <p className="text-[16px] font-bold text-[#1a1a1a] mb-2">
                    {formatPrice((item.costume.rentalRates?.pricePerDay || 0) * item.rentalDays * (item.quantity || 1))}
                  </p>
                  <div className="flex items-center gap-1.5 text-[11px] text-[#666] bg-amber-50 text-amber-700 px-2 py-1 rounded w-max">
                    <FontAwesomeIcon icon={faCalendarDays} className="text-[10px]" />
                    {item.rentalDays} ngày
                  </div>
                </div>

              </div>
            ))}

            <div className="flex justify-between items-center mt-2">
              <button onClick={clearCart} className="text-[13px] text-red-500 hover:text-red-600 font-medium underline transition-colors">
                Xóa toàn bộ giỏ
              </button>
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="w-full lg:w-1/3 bg-white rounded-xl border border-[#f0ece8] shadow-sm sticky top-[100px]">
            <div className="p-6">
              <h3 className="text-[18px] font-bold text-[#1a1a1a] mb-6 border-b border-[#eaeaea] pb-4" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                Tóm Tắt Đơn Hàng
              </h3>

              <div className="space-y-4 text-[14px]">
                <div className="flex justify-between text-[#666]">
                  <span>Tổng tiền thuê ({cartItems.length} món)</span>
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
                  {formatPrice(grandTotal)}
                </span>
              </div>

              <button
                onClick={() => navigate("/checkout", { state: { selectedIds } })}
                disabled={selectedIds.length === 0}
                className={`w-full py-4 rounded-lg text-[13px] uppercase tracking-[0.1em] font-bold transition-all duration-300 flex items-center justify-center gap-3 ${selectedIds.length === 0 ? "bg-[#e8e8e8] text-[#999] cursor-not-allowed" : "bg-[#1a1a1a] text-white hover:bg-[#333] hover:shadow-lg"}`}
              >
                Tiến Hành Đặt Thuê {selectedIds.length > 0 ? `(${selectedIds.length})` : ""}
                <FontAwesomeIcon icon={faArrowRight} />
              </button>

              <p className="text-[11px] text-[#999] text-center mt-4">
                Bạn có thể xem lại đơn hàng ở bước tiếp theo trước khi chốt.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
