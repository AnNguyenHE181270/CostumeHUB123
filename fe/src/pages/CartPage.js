import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash, faArrowRight, faCalendarDays, faShieldHalved, faTags } from "@fortawesome/free-solid-svg-icons";
import { formatPrice, getRentalDays } from "../utils/formatters"
import CustomDateRangePicker from "../components/ui/CustomDateRangePicker"
import Modal from "../components/Modal"

export default function CartPage() {
  const { cartItems, removeFromCart, addToCart, clearCart, updateCartItem } = useCart();
  const navigate = useNavigate();

  const [selectedIds, setSelectedIds] = useState(() => cartItems.map(item => item._id));
  const [editingDateItem, setEditingDateItem] = useState(null);
  const [tempDateRange, setTempDateRange] = useState([{
    startDate: new Date(),
    endDate: new Date(),
    key: 'selection'
  }]);

  useEffect(() => {
    setSelectedIds(prev => {
      const currentIds = cartItems.map(item => item._id);
      if (prev.length === 0 && currentIds.length > 0) {
        return currentIds;
      }
      return prev.filter(id => currentIds.includes(id));
    });
  }, [cartItems]);

  const openDateModal = (item) => {
    setEditingDateItem(item);
    setTempDateRange([{
      startDate: new Date(item.startDate),
      endDate: new Date(item.endDate),
      key: 'selection'
    }]);
  };

  const handleSelectDateRange = (ranges) => {
    setTempDateRange([ranges.selection]);
  };

  const handleSaveDates = async () => {
    if (editingDateItem) {
      const start = tempDateRange[0].startDate;
      const end = tempDateRange[0].endDate;
      const formatLocal = (date) => {
        const d = new Date(date);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      };
      const newStart = formatLocal(start);
      const newEnd = formatLocal(end);

      if (updateCartItem) {
        await updateCartItem(
          editingDateItem.costumeId || editingDateItem._id,
          editingDateItem.size,
          editingDateItem.startDate,
          editingDateItem.endDate,
          editingDateItem.size,
          editingDateItem.quantity,
          newStart,
          newEnd
        );
      }
      setEditingDateItem(null);
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(cartItems.map(item => item._id));
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

  const toggleItemSelection = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(selectedId => selectedId !== id) : [...prev, id]
    );
  };

  const selectedCartItems = cartItems.filter(item => selectedIds.includes(item._id));


  // tính tiền thuê
  const totalRental = selectedCartItems.reduce((sum, item) => {
    const rDays = getRentalDays(item.startDate, item.endDate);
    const rates = item.rentalRates || item.costume?.rentalRates || {};
    let price = (rates.pricePerDay || 0) * rDays;
    if (rDays === 3 && rates.pricePer3Days) {
      price = rates.pricePer3Days;
    } else if (rDays === 7 && rates.pricePerWeek) {
      price = rates.pricePerWeek;
    }
    return sum + price * (item.quantity || 1);
  }, 0);

  const totalDeposit = selectedCartItems.reduce(
    (sum, item) => sum + (item.deposit || item.depositPrice || item.costume?.deposit || item.costume?.price || 0) * (item.quantity || 1),
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
          <div className="w-full lg:w-2/3 flex flex-col gap-5">
            <div className="flex justify-between items-center">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={selectedIds.length === cartItems.length && cartItems.length > 0}
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

              const rates = item.rentalRates || item.costume?.rentalRates || {};
              let calculatedPrice = (rates.pricePerDay || 0) * rentalDays;
              let isPackage = null;
              if (rentalDays === 3 && rates.pricePer3Days) {
                calculatedPrice = rates.pricePer3Days;
                isPackage = 3;
              } else if (rentalDays === 7 && rates.pricePerWeek) {
                calculatedPrice = rates.pricePerWeek;
                isPackage = 7;
              }

              const handleItemQuickSelect = async (days) => {
                const start = new Date(item.startDate);
                const end = new Date(start);
                end.setDate(end.getDate() + (days - 1));
                const formatLocal = (date) => {
                  const d = new Date(date);
                  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                };
                const newEndStr = formatLocal(end);

                if (updateCartItem) {
                  await updateCartItem(
                    item.costumeId || item._id,
                    item.size,
                    item.startDate,
                    item.endDate,
                    item.size,
                    item.quantity,
                    item.startDate,
                    newEndStr
                  );
                }
              };

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
                      removeFromCart(item.costumeId || item._id, item.size, item.startDate, item.endDate);
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

                      <div className="flex items-center gap-2 mt-1 mb-1" onClick={(e) => e.stopPropagation()}>
                        <span className="text-[13px] text-[#666]">Size:</span>
                        <select
                          value={item.size}
                          onChange={(e) => console.log("Cần viết thêm hàm updateSize cho: ", e.target.value)}
                          className="text-[13px] font-bold text-[#1a1a1a] border rounded px-2 py-0.5 outline-none cursor-pointer focus:border-[#1a1a1a] transition-colors bg-white"
                        >
                          {item.variants?.map((v, idx) => (
                            <option key={idx} value={v.size} disabled={v.availableStock === 0}>
                              {v.size} {v.availableStock === 0 ? "(Hết hàng)" : ""}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex items-center gap-3 mt-1 mb-1">
                        <span className="text-[13px] text-[#666]">Số lượng:</span>
                        <div className="flex items-center gap-4">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (updateCartItem) updateCartItem(item.costumeId || item._id, item.size, item.startDate, item.endDate, item.size, item.quantity - 1);
                            }}
                            disabled={item.quantity <= 1}
                            className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-[#ddd] hover:bg-gray-50 disabled:opacity-50 transition-colors">-</button>
                          <span className="text-[14px] font-bold min-w-[20px] text-center">{item.quantity}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (updateCartItem) updateCartItem(item.costumeId || item._id, item.size, item.startDate, item.endDate, item.size, item.quantity + 1);
                            }}
                            disabled={item.variant?.availableStock ? item.quantity >= item.variant.availableStock : false}
                            className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-[#ddd] hover:bg-gray-50 disabled:opacity-50 transition-colors">+</button>
                        </div>
                      </div>

                      {/* Toggle button to expand dates */}
                      <button
                        onClick={(e) => { e.stopPropagation(); openDateModal(item); }}
                        className="text-[11px] font-medium text-[#1a1a1a] underline hover:text-[#666] transition-colors flex items-center gap-1 relative z-10"
                      >
                        <FontAwesomeIcon icon={faCalendarDays} className="text-[#999]" />
                        Tùy chỉnh ngày thuê
                      </button>
                    </div>

                    {/* Quick select blocks */}
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleItemQuickSelect(1); }}
                        className={`px-3 py-1 border text-[11px] rounded transition-colors ${rentalDays === 1 ? 'border-black bg-black text-white' : 'border-[#eaeaea] hover:border-[#1a1a1a]'}`}>Thuê lẻ 1 ngày</button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleItemQuickSelect(3); }}
                        className={`px-3 py-1 border text-[11px] rounded transition-colors ${rentalDays === 3 ? 'border-black bg-black text-white' : 'border-[#eaeaea] hover:border-[#1a1a1a]'}`}>Gói 3 ngày</button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleItemQuickSelect(7); }}
                        className={`px-3 py-1 border text-[11px] rounded transition-colors ${rentalDays === 7 ? 'border-black bg-black text-white' : 'border-[#eaeaea] hover:border-[#1a1a1a]'}`}>Gói 1 tuần</button>
                    </div>
                  </div>

                  {/* Pricing summary for this item */}
                  <div className="w-full sm:w-[200px] flex flex-col justify-center border-t sm:border-t-0 sm:border-l border-[#f0ece8] pt-4 sm:pt-0 sm:pl-5">
                    <p className="text-[16px] font-bold text-[#1a1a1a] mb-2">
                      {formatPrice(calculatedPrice * (item.quantity || 1))}
                    </p>
                    <p className="text-[11px] text-[#999] mb-1">
                      {isPackage ? `Gói ${isPackage} ngày` : `${formatPrice(rates.pricePerDay || 0)} / ngày`}
                    </p>
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
          <div className="w-full lg:w-1/3 bg-white rounded-xl border border-[#f0ece8] shadow-sm sticky top-[100px]">
            <div className="p-6">
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

      {/* Modal Customize Date */}
      <Modal isOpen={!!editingDateItem} onClose={() => setEditingDateItem(null)} title="Tùy chỉnh thời gian thuê">
        <CustomDateRangePicker
          dateRange={tempDateRange}
          onChange={handleSelectDateRange}
          minDate={new Date()}
        />

        <div className="flex gap-3 mt-6">
          <button
            onClick={() => setEditingDateItem(null)}
            className="flex-1 rounded-xl border border-[#eaeaea] bg-white px-4 py-3 text-[13px] uppercase tracking-[0.08em] font-bold text-[#555] hover:bg-[#fafafa] transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={handleSaveDates}
            className="flex-1 rounded-xl px-4 py-3 text-[13px] uppercase tracking-[0.08em] font-bold transition-all bg-[#1a1a1a] text-white hover:bg-[#333] shadow-md"
          >
            Xác nhận
          </button>
        </div>
      </Modal>

    </div>
  );
}
