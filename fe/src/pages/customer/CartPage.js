import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash, faArrowRight, faCalendarDays, faShieldHalved } from "@fortawesome/free-solid-svg-icons";

function formatPrice(price) {
  return new Intl.NumberFormat("vi-VN").format(price) + "đ";
}

export default function CartPage() {
  const [carts, setCarts] = useState([])
  const { cartItems, removeFromCart, updateDates, clearCart } = useCart();
  const navigate = useNavigate();
  const getItemId = (item) => `${item._id}-${item.size}-${item.startDate}-${item.endDate}`;
  const [expandedItem, setExpandedItem] = useState(null);
  const [selectedIds, setSelectedIds] = useState(() => cartItems.map(getItemId));



  // Đồng bộ selectedIds nếu cartItems thay đổi (vd: bị xóa đi)
  useEffect(() => {
    setSelectedIds(prev => prev.filter(id => cartItems.some(item => getItemId(item) === id)));
  }, [cartItems]);

  console.log(cartItems)
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

  const toggleItemSelection = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(selectedId => selectedId !== id) : [...prev, id]
    );
  };

  const selectedCartItems = cartItems.filter(item => selectedIds.includes(getItemId(item)));

  const getRentalDays = (start, end) => {
    if (!start || !end) return 1;
    const startObj = new Date(start);
    const endObj = new Date(end);
    const days = Math.ceil((endObj - startObj) / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 1;
  };

  const totalRental = selectedCartItems.reduce(
    (acc, item) =>
      acc + (item.rentalPrice || 0) * getRentalDays(item.startDate, item.endDate) * (item.quantity || 1),
    0
  );
  const totalDeposit = selectedCartItems.reduce(
    (acc, item) => acc + (item.deposit || 0) * (item.quantity || 1),
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

        </div>
      </div>

      <div className="mx-auto max-w-[1200px] px-6 py-8">

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Cart Items List */}
          <div className="w-full lg:w-2/3 flex flex-col gap-4">
            {/* Toolbar */}
            <div className="flex justify-between items-center">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={selectedIds.length === cartItems.length && cartItems.length > 0}
                  onChange={handleSelectAll}
                  className="w-5 h-5 cursor-pointer accent-[#1a1a1a] border-[#ccc] rounded transition-all"
                />
                <span className="text-sm font-semibold text-[#1a1a1a] select-none group-hover:text-[#555] transition-colors">
                  Chọn tất cả ({cartItems.length})
                </span>
              </label>
              <button
                onClick={clearCart}
                className="text-sm text-red-500 hover:text-red-700 font-medium flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-red-50 transition-colors"
              >
                Xóa tất cả
              </button>
            </div>

            {cartItems.map((item) => {
              const itemId = getItemId(item);
              const isSelected = selectedIds.includes(itemId);
              const rentalDays = getRentalDays(item.startDate, item.endDate);

              return (
                <div
                  key={itemId}
                  onClick={() => toggleItemSelection(itemId)}
                  className={`rounded-xl border p-3 flex flex-col sm:flex-row gap-5 relative group shadow-sm hover:shadow-md transition-all cursor-pointer ${isSelected ? "bg-white border-[#8CE882]" : "bg-white border-[#f0ece8]"}`}
                >
                  {/* Delete Btn */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFromCart(item._id, item.size, item.startDate, item.endDate);
                    }}
                    className="absolute top-1/2 -translate-y-1/2 right-4 w-8 h-8 rounded-full bg-[#faf9f7] text-[#999] flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-colors z-10"
                    title="Xóa khỏi giỏ"
                  >
                    <FontAwesomeIcon icon={faTrash} className="text-[13px]" />
                  </button>

                  {/* Image */}
                  <div className="w-[100px] h-[130px] rounded-lg overflow-hidden bg-[#f5f5f5]">
                    <img
                      src={item.image || "https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=200&h=300&fit=crop"}
                      alt={item.costumeName}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Details */}
                  <div className="flex flex-col flex-1 py-2">
                    <div className="">
                      <p className="text-[10px] uppercase tracking-[0.1em] text-[#999] font-semibold mb-1">
                        {item.category}
                      </p>
                      <Link to={`/product/${item.costumeId}`} onClick={(e) => e.stopPropagation()} className="text-[16px] font-bold text-[#1a1a1a] hover:text-[#707070] transition-colors line-clamp-1 mb-2 relative z-10 w-fit block">
                        {item.costumeName}
                      </Link>

                      <div className="flex items-center gap-6 text-[13px] text-[#666] mb-3">
                        <span>Size: <strong className="text-[#1a1a1a]">{item.size}</strong></span>
                        <span>Số lượng: <strong className="text-[#1a1a1a]">{item.quantity}</strong></span>
                      </div>

                      {/* Toggle button to expand dates */}
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleExpand(itemId); }}
                        className="text-[11px] font-medium text-[#1a1a1a] underline hover:text-[#666] transition-colors flex items-center gap-1.5 relative z-10"
                      >
                        <FontAwesomeIcon icon={faCalendarDays} className="text-[#999]" />
                        {expandedItem === itemId ? "Ẩn chi tiết thuê" : "Tùy chỉnh ngày thuê"}
                      </button>
                    </div>

                    {/* Dates Selection (Collapsible) */}
                    {expandedItem === itemId && (
                      <div className="bg-[#faf9f7] rounded-lg p-2 grid grid-cols-2 gap-4 mt-4 animate-fade-in relative z-10" onClick={(e) => e.stopPropagation()}>
                        <div>
                          <label className="block text-[11px] uppercase tracking-[0.05em] text-[#999] font-medium mb-1">Ngày nhận</label>
                          <input
                            type="date"
                            value={item.startDate}
                            min={new Date().toISOString().split('T')[0]}
                            onChange={(e) => updateDates(item.costumeId, e.target.value, item.endDate)}
                            className="w-full bg-white border border-[#eaeaea] text-[13px] text-[#1a1a1a] rounded px-2 py-1 focus:border-[#1a1a1a] outline-none transition-colors cursor-text"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] uppercase tracking-[0.05em] text-[#999] font-medium mb-1">Ngày trả</label>
                          <input
                            type="date"
                            value={item.endDate}
                            min={item.startDate}
                            onChange={(e) => updateDates(item.costumeId, item.startDate, e.target.value)}
                            className="w-full bg-white border border-[#eaeaea] text-[13px] text-[#1a1a1a] rounded px-2 py-1 focus:border-[#1a1a1a] outline-none transition-colors cursor-text"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Pricing summary for this item */}
                  <div className="w-full sm:w-[140px] flex flex-col justify-center border-t sm:border-t-0 sm:border-l border-[#f0ece8] pt-4 sm:pt-0 sm:pl-5">
                    <p className="text-[11px] text-[#999] mb-1">
                      {formatPrice(item.rentalPrice || 0)} / ngày
                    </p>
                    <p className="text-[16px] font-bold text-[#1a1a1a] mb-2">
                      {formatPrice((item.rentalPrice || 0) * rentalDays * (item.quantity || 1))}
                    </p>
                    <div className="flex items-center gap-1.5 text-[11px] text-[#666] bg-amber-50 text-amber-700 px-2 py-1 rounded w-max">
                      <FontAwesomeIcon icon={faCalendarDays} className="text-[10px]" />
                      {rentalDays} ngày
                    </div>
                  </div>

                </div>
              )
            })}


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
