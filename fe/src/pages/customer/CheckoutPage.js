import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMapMarkerAlt,
  faShieldHalved,
  faTruck,
  faCheck,
  faCreditCard,
  faWallet,
  faGem,
  faArrowRight,
  faStore,
  faTruckFast,
  faTriangleExclamation,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";
import Button from "../../components/ui/Button";
import Radio from "../../components/ui/Radio";
import Input from "../../components/ui/Input";
import Toast from "../../components/ui/Toast";
import { formatPrice, formatDateNoHours, getRentalDays, getRentalPriceFactor } from "../../utils/formatters";
import rentalService from "../../services/rental.service";

const SERIF = { fontFamily: "'Cormorant Garamond', serif" };

export function Checkout() {
  const navigate = useNavigate();
  const location = useLocation();
  const selectedIds = location.state?.selectedIds || [];
  const buyNow = location.state?.buyNow;

  const { cartItems, clearCart, removeFromCart } = useCart();
  const { user, refreshProfile } = useAuth();
  const [deliveryOption, setDeliveryOption] = useState("delivery");
  const [paymentMethod, setPaymentMethod] = useState("WALLET");
  const [address, setAddress] = useState({ name: "", phone: "", detail: "" });
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState({ isVisible: false, message: "", type: "success" });
  const [deliveryEstimate, setDeliveryEstimate] = useState({ loading: false, date: null, isLate: false });

  useEffect(() => {
    if (user) {
      let defaultAddress = user.addresses?.find((a) => a.isDefault);
      if (!defaultAddress && user.addresses?.length > 0) {
        defaultAddress = user.addresses[0];
      }
      if (defaultAddress) {
        setSelectedAddress(defaultAddress);
        const parts = [
          defaultAddress.addressDetail,
          defaultAddress.ward,
          defaultAddress.district,
          defaultAddress.province,
        ].filter(Boolean);
        setAddress({
          name: defaultAddress.receiverName || user.fullName || "",
          phone: defaultAddress.receiverPhone || user.phone || "",
          detail: parts.join(", "),
        });
      } else {
        setSelectedAddress(null);
        setAddress((prev) => ({
          ...prev,
          name: user.fullName || "",
          phone: user.phone || "",
        }));
      }
    }
  }, [user]);

  const showToast = (message, type = "error") => {
    setToast({ isVisible: true, message, type });
  };

  const checkoutItems = buyNow
    ? cartItems.filter(
      (item) =>
        (item.costumeId === buyNow.costumeId || item.costume?._id === buyNow.costumeId) &&
        (item.size === buyNow.size || item.variant?.size === buyNow.size) &&
        (item.startDate || "").substring(0, 10) === (buyNow.startDate || "").substring(0, 10) &&
        (item.endDate || "").substring(0, 10) === (buyNow.endDate || "").substring(0, 10)
    )
    : selectedIds.length > 0
      ? cartItems.filter((item) => selectedIds.includes(item._id))
      : cartItems;

  const orderStartDate = checkoutItems[0]?.startDate;
  const orderEndDate = checkoutItems[0]?.endDate;

  // Tính tổng tiền thuê
  const totalRental = checkoutItems.reduce((sum, item) => {
    const days = getRentalDays(item.startDate, item.endDate);
    const factor = getRentalPriceFactor(days);
    return sum + item.rentalPerDay * factor * item.quantity;
  }, 0);

  // Tính tổng tiền cọc
  const totalDeposit = checkoutItems.reduce((sum, item) => {
    return sum + item.deposit * item.quantity;
  }, 0);

  const deliveryFee = 0; // Miễn phí giao hàng trọn gói
  const total = totalRental + totalDeposit + deliveryFee;

  // Hiện ngay dự kiến giao hàng GHN khi đã có địa chỉ + ngày nhận, không đợi tới lúc ấn xác nhận đặt thuê.
  useEffect(() => {
    if (deliveryOption !== "delivery" || !selectedAddress?.districtId || !selectedAddress?.wardCode || !orderStartDate) {
      setDeliveryEstimate({ loading: false, date: null, isLate: false });
      return;
    }
    let cancelled = false;
    setDeliveryEstimate((prev) => ({ ...prev, loading: true }));
    rentalService
      .estimateDelivery(selectedAddress.districtId, selectedAddress.wardCode)
      .then((data) => {
        if (cancelled) return;
        const estimatedDate = new Date(data.estimatedDeliveryDate);
        setDeliveryEstimate({
          loading: false,
          date: estimatedDate,
          isLate: new Date(orderStartDate) < estimatedDate,
        });
      })
      .catch(() => {
        if (!cancelled) setDeliveryEstimate({ loading: false, date: null, isLate: false });
      });
    return () => {
      cancelled = true;
    };
  }, [deliveryOption, selectedAddress?.districtId, selectedAddress?.wardCode, orderStartDate]);

  const handleCheckout = async () => {
    if (checkoutItems.length === 0) return;

    if (deliveryOption === "delivery" && (!address.name || !address.phone || !address.detail)) {
      showToast("Vui lòng nhập đầy đủ thông tin giao hàng!");
      return;
    }

    if (deliveryOption === "pickup" && (!address.name || !address.phone)) {
      showToast("Vui lòng nhập họ tên và số điện thoại người nhận!");
      return;
    }

    const isSameDates = checkoutItems.every(
      (item) => item.startDate === orderStartDate && item.endDate === orderEndDate
    );
    if (!isSameDates) {
      showToast(
        "Các sản phẩm trong đơn hàng phải có CÙNG ngày nhận và ngày trả. Vui lòng quay lại giỏ hàng để tách đơn."
      );
      return;
    }
    setIsLoading(true);
    try {
      const payload = {
        startDate: new Date(orderStartDate).toISOString(),
        endDate: new Date(orderEndDate).toISOString(),
        items: checkoutItems.map((item) => ({
          costume: item.costumeId || item._id || item.costume?._id,
          size: item.size || item.variant?.size || "M",
          color: item.color || item.costume?.color || "Mặc định",
          quantity: item.quantity || 1,
          cartStartDate: item.startDate,
          cartEndDate: item.endDate,
        })),
        shippingFee: deliveryFee,
        paymentMethod: paymentMethod,
        shippingAddress: {
          receiverName: address.name,
          receiverPhone: address.phone,
          addressDetail:
            deliveryOption === "delivery" && address.detail ? address.detail : "Nhận tại cửa hàng",
          provinceId: deliveryOption === "delivery" && selectedAddress ? selectedAddress.provinceId : null,
          districtId: deliveryOption === "delivery" && selectedAddress ? selectedAddress.districtId : null,
          wardCode: deliveryOption === "delivery" && selectedAddress ? selectedAddress.wardCode : null,
          province: deliveryOption === "delivery" && selectedAddress ? selectedAddress.province : null,
          district: deliveryOption === "delivery" && selectedAddress ? selectedAddress.district : null,
          ward: deliveryOption === "delivery" && selectedAddress ? selectedAddress.ward : null,
        },
      };

      await rentalService.createOrder(payload);

      if (checkoutItems.length === cartItems.length) {
        await clearCart();
      } else {
        for (const item of checkoutItems) {
          await removeFromCart(
            item.costumeId || item._id || item.costume?._id,
            item.size || item.variant?.size,
            item.startDate,
            item.endDate
          );
        }
      }
      await refreshProfile();
      showToast("Thanh toán thành công! Đơn hàng đã được tạo.", "success");
      setTimeout(() => {
        navigate("/rental-history");
      }, 1800);
    } catch (err) {
      if (err.extra?.estimatedDeliveryDate) {
        navigate("/cart", { state: { checkoutError: err.message } });
        return;
      }
      showToast(err.message || "Lỗi kết nối đến máy chủ. Vui lòng thử lại sau.");
    } finally {
      setIsLoading(false);
    }
  };

  if (checkoutItems.length === 0) {
    return (
      <div className="min-h-screen bg-[#faf6f0] flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-[32px] font-bold text-[#1a1a1a] mb-4" style={SERIF}>
          Giỏ hàng của bạn đang trống
        </h2>
        <p className="text-[#8a7d63] text-sm mb-6">Chưa có sản phẩm nào được chọn để thanh toán.</p>
        <button
          onClick={() => navigate("/cart")}
          className="px-8 py-3.5 bg-black text-[#f5e6ca] rounded-2xl text-xs font-bold uppercase tracking-widest hover:brightness-125 transition-all shadow-md"
        >
          Quay lại giỏ hàng
        </button>
      </div>
    );
  }

  return (
    <div className="bg-[#faf6f0] min-h-screen py-8 lg:py-12 px-4 sm:px-6">
      <Toast
        isVisible={toast.isVisible}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast((prev) => ({ ...prev, isVisible: false }))}
      />

      {/* Khung duy nhất bao bọc toàn bộ màn hình Checkout */}
      <div className="mx-auto max-w-[1280px] bg-white rounded-3xl border border-[#e6dcab] p-6 sm:p-8 lg:p-10 shadow-[0_15px_50px_rgba(0,0,0,0.04)]">
        {/* Header & Stepper */}
        <div className="pb-8 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] bg-black text-[#f5e6ca] mb-3 shadow-sm">
            <FontAwesomeIcon icon={faGem} className="text-[9px] text-[#d4af37]" />
            XÁC NHẬN & THANH TOÁN ĐƠN THUÊ
          </div>
          <h1
            className="text-[32px] sm:text-[40px] font-bold text-[#1a1a1a] leading-tight mb-8"
            style={SERIF}
          >
            Thanh Toán Đơn Thuê
          </h1>
        </div>

        {/* Content Layout Grid */}
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-10 items-start">
          {/* LEFT: Items, Address & Payment */}
          <div className="w-full lg:w-2/3 flex flex-col gap-8">
            {/* Items List Card */}
            <div>
              <h2 className="text-[20px] font-bold text-[#1a1a1a] mb-4 flex items-center gap-2" style={SERIF}>
                <FontAwesomeIcon icon={faGem} className="text-[14px] text-[#d4af37]" />
                Sản Phẩm Đăng Ký Thuê ({checkoutItems.length})
              </h2>
              <div className="space-y-4">
                {checkoutItems.map((cartItem, idx) => {
                  const rentalDays = getRentalDays(cartItem.startDate, cartItem.endDate);
                  const factor = getRentalPriceFactor(rentalDays);
                  return (
                    <div
                      key={`${cartItem.costumeId || cartItem._id}-${idx}`}
                      className="bg-white rounded-2xl border border-[#e6dcab]/80 p-4 sm:p-5 flex flex-col sm:flex-row gap-4 items-center shadow-sm hover:shadow-md transition-all"
                    >
                      <div className="w-20 sm:w-24 aspect-[3/4] rounded-xl overflow-hidden bg-[#f5f3f0] border border-[#e6dcab]/60 shrink-0 shadow-sm">
                        <img
                          src={cartItem.image}
                          alt={cartItem.costumeName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        {cartItem.category && (
                          <p className="text-[10px] uppercase tracking-wider text-[#b8935a] font-bold mb-1">
                            {cartItem.category}
                          </p>
                        )}
                        <h3 className="text-[17px] font-bold text-[#1a1a1a] line-clamp-1 mb-2" style={SERIF}>
                          {cartItem.costumeName}
                        </h3>
                        <div className="flex flex-wrap items-center gap-4 text-[12px] text-[#665a45]">
                          <span>Size: <strong className="text-[#1a1a1a]">{cartItem.size}</strong></span>
                          <span>Số lượng: <strong className="text-[#1a1a1a]">{cartItem.quantity}</strong></span>
                          <span>Thời gian: <strong className="text-[#1a1a1a]">{rentalDays} ngày</strong></span>
                        </div>
                        <p className="text-[11px] text-[#8a7d63] mt-1">
                          {rentalDays === 1
                            ? `Trong ngày ${formatDateNoHours(cartItem.startDate)}`
                            : `Từ ${formatDateNoHours(cartItem.startDate)} đến ${formatDateNoHours(cartItem.endDate)}`}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[16px] font-extrabold text-[#1a1a1a]">
                          {formatPrice(cartItem.rentalPerDay * factor * cartItem.quantity)}
                        </p>
                        <p className="text-[11px] text-[#8a7d63]">
                          Cọc: {formatPrice(cartItem.deposit * cartItem.quantity)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Delivery Option Card */}
            <h3 className="text-[20px] font-bold text-[#1a1a1a] flex items-center gap-2" style={SERIF}>
              <FontAwesomeIcon icon={faTruck} className="text-[#b8935a] text-[16px]" />
              Phương Thức Nhận Hàng
            </h3>
            <div className="bg-[#faf6f0]/60 rounded-3xl border border-[#e6dcab] p-4 shadow-sm">
              <div className="space-y-3 mb-5">
                <label
                  htmlFor="delivery"
                  className={`flex items-start gap-4 p-4 rounded-2xl border cursor-pointer transition-all ${deliveryOption === "delivery"
                    ? "border-[#c9a869] bg-white ring-2 ring-[#c9a869]/20 shadow-sm"
                    : "border-[#e2d5bd] bg-white/70 hover:bg-white"
                    }`}
                >
                  <Radio
                    value="delivery"
                    id="delivery"
                    name="deliveryOption"
                    checked={deliveryOption === "delivery"}
                    onChange={(e) => setDeliveryOption(e.target.value)}
                    className="mt-1 accent-[#b8935a]"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#1a1a1a] text-[14px]">Giao hàng hỏa tốc tận nơi</span>
                      <span className="text-[12px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                        Miễn phí
                      </span>
                    </div>
                    <p className="text-[12px] text-[#8a7d63] mt-1">
                      Đơn vị giao hàng GHN bảo quản trang phục nguyên vẹn tận tay bạn
                    </p>
                  </div>
                </label>

                <label
                  htmlFor="pickup"
                  className={`flex items-start gap-4 p-4 rounded-2xl border cursor-pointer transition-all ${deliveryOption === "pickup"
                    ? "border-[#c9a869] bg-white ring-2 ring-[#c9a869]/20 shadow-sm"
                    : "border-[#e2d5bd] bg-white/70 hover:bg-white"
                    }`}
                >
                  <Radio
                    value="pickup"
                    id="pickup"
                    name="deliveryOption"
                    checked={deliveryOption === "pickup"}
                    onChange={(e) => setDeliveryOption(e.target.value)}
                    className="mt-1 accent-[#b8935a]"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#1a1a1a] text-[14px]">Trực tiếp nhận tại showroom CostumeHUB</span>
                      <span className="text-[12px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">Miễn phí</span>
                    </div>
                    <p className="text-[12px] text-[#8a7d63] mt-1">
                      Showroom: 123 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP.HCM
                    </p>
                  </div>
                </label>
              </div>

              {/* Delivery Details Input */}
              {deliveryOption === "pickup" && (
                <div className="space-y-3 pt-3 border-t border-[#e6dcab]">
                  <div className="flex items-center gap-2 text-[13px] font-bold text-[#1a1a1a] mb-2">
                    <FontAwesomeIcon icon={faStore} className="text-[#b8935a]" />
                    <span>Thông tin người nhận tại cửa hàng</span>
                  </div>
                  <Input
                    id="pickup-name"
                    label="Họ và tên người nhận"
                    placeholder="Nhập họ và tên"
                    value={address.name}
                    onChange={(e) => setAddress((prev) => ({ ...prev, name: e.target.value }))}
                  />
                  <Input
                    id="pickup-phone"
                    label="Số điện thoại người nhận"
                    placeholder="Nhập số điện thoại"
                    value={address.phone}
                    onChange={(e) => setAddress((prev) => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
              )}

              {deliveryOption === "delivery" && (
                <div className="pt-3 border-t border-[#e6dcab]">
                  <div className="flex items-center justify-between gap-2 text-[13px] text-[#8a7d63] mb-3">
                    <div className="flex items-center gap-2">
                      <FontAwesomeIcon icon={faMapMarkerAlt} className="text-[#b8935a]" />
                      <span className="font-bold text-[#1a1a1a]">Địa chỉ giao hàng</span>
                    </div>
                    <button
                      onClick={() => navigate("/user/addresses", { state: { pendingStartDate: orderStartDate } })}
                      className="text-[11px] uppercase tracking-wider font-bold text-[#b8935a] hover:underline transition-colors"
                    >
                      Thay đổi địa chỉ
                    </button>
                  </div>
                  {selectedAddress ? (
                    <div className="border border-[#e6dcab] p-4 rounded-2xl bg-white shadow-sm">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-bold text-[#1a1a1a] text-base">{selectedAddress.receiverName}</span>
                        <span className="text-[#c8ab7a]">|</span>
                        <span className="text-[#665a45] font-medium">{selectedAddress.receiverPhone}</span>
                        {selectedAddress.isDefault && (
                          <span className="text-[10px] uppercase tracking-widest font-bold border border-[#b8935a] text-[#b8935a] px-2 py-0.5 rounded-full bg-[#faf6f0]">
                            Mặc định
                          </span>
                        )}
                      </div>
                      <p className="text-[#555] text-sm mb-1">{selectedAddress.addressDetail}</p>
                      <p className="text-[#8a7d63] text-xs font-medium">
                        {selectedAddress.ward}, {selectedAddress.district}, {selectedAddress.province}
                      </p>

                      {deliveryEstimate.loading && (
                        <div className="mt-3 pt-3 border-t border-[#eee] flex items-center gap-2 text-[12px] text-[#8a7d63]">
                          <FontAwesomeIcon icon={faSpinner} spin />
                          <span>Đang kiểm tra thời gian giao hàng dự kiến (GHN)...</span>
                        </div>
                      )}
                      {!deliveryEstimate.loading && deliveryEstimate.date && (
                        <div
                          className={`mt-3 pt-3 border-t border-[#eee] flex items-start gap-2 text-[12px] font-medium ${deliveryEstimate.isLate ? "text-amber-700" : "text-emerald-700"
                            }`}
                        >
                          <FontAwesomeIcon
                            icon={deliveryEstimate.isLate ? faTriangleExclamation : faTruckFast}
                            className="mt-0.5 shrink-0"
                          />
                          {deliveryEstimate.isLate ? (
                            <span>
                              Đơn hàng của bạn dự kiến được giao vào{" "}
                              {deliveryEstimate.date.toLocaleDateString("vi-VN", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                              })}
                              , hãy lựa chọn lại thời gian nhận cho phù hợp để được hỗ trợ tốt nhất.
                            </span>
                          ) : (
                            <span>
                              Dự kiến giao hàng vào{" "}
                              {deliveryEstimate.date.toLocaleDateString("vi-VN", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                              })}{" "}
                              — phù hợp với ngày bạn chọn nhận đồ.
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="border border-amber-200 bg-amber-50/70 p-4 rounded-2xl text-center">
                      <p className="text-amber-800 text-sm mb-3 font-semibold">Bạn chưa chọn địa chỉ giao hàng.</p>
                      <Button
                        onClick={() => navigate("/user/addresses", { state: { pendingStartDate: orderStartDate } })}
                        className="bg-[#1a1a1a] text-[#f5e6ca] text-xs h-9 px-6 rounded-xl font-bold uppercase tracking-wider mx-auto w-auto hover:brightness-125"
                      >
                        Thêm địa chỉ giao hàng ngay
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Payment Method Card */}
            <h3 className="text-[20px] font-bold text-[#1a1a1a] flex items-center gap-2" style={SERIF}>
              <FontAwesomeIcon icon={faCreditCard} className="text-[#b8935a] text-[16px]" />
              Phương Thức Thanh Toán
            </h3>

            <div className="space-y-3">
              <label
                htmlFor="wallet"
                className={`flex items-start gap-4 p-4 rounded-2xl border cursor-pointer transition-all ${paymentMethod === "WALLET"
                  ? "border-[#c9a869] bg-white ring-2 ring-[#c9a869]/20 shadow-sm"
                  : "border-[#e2d5bd] bg-white/70 hover:bg-white"
                  }`}
              >
                <Radio
                  value="WALLET"
                  id="wallet"
                  name="paymentMethod"
                  checked={paymentMethod === "WALLET"}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="mt-1 accent-[#b8935a]"
                />
                <div className="flex-1 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <FontAwesomeIcon icon={faWallet} className="text-[#d4af37]" />
                      <span className="font-bold text-[#1a1a1a] text-[14px]">Thanh toán bằng Số Dư Ví CostumeHUB</span>
                    </div>
                    <p className="text-[12px] text-[#8a7d63] mt-1">
                      Thanh toán tức thì, tự động hoàn cọc trực tiếp về ví khi hoàn trả sản phẩm
                    </p>
                  </div>
                  {user?.balance !== undefined && (
                    <span className="text-[13px] font-extrabold text-[#1a1a1a] bg-[#faf6f0] border border-[#e2d5bd] px-3 py-1 rounded-xl shrink-0">
                      Số dư: {formatPrice(user.balance)}
                    </span>
                  )}
                </div>
              </label>
            </div>
          </div>

          {/* RIGHT: Order Summary Box */}
          <div className="w-full lg:w-1/3 bg-[#faf6f0]/90 rounded-3xl border border-[#e6dcab] p-6 mt-12 lg:p-8 shadow-md sticky top-[100px] space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <FontAwesomeIcon icon={faGem} className="text-[12px] text-[#d4af37]" />
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#b8935a]">
                  TÓM TẮT THÀNH TIỀN
                </span>
              </div>
              <h3 className="text-[26px] font-bold text-[#1a1a1a] leading-tight" style={SERIF}>
                Tổng Đơn Thuê
              </h3>
            </div>

            <div className="space-y-4 text-[13px] border-t border-[#e6dcab]/80 pt-5">
              <div className="flex justify-between items-center text-[#665a45]">
                <span>Tổng tiền thuê ({checkoutItems.length} mục)</span>
                <span className="font-bold text-[#1a1a1a] text-[15px]">{formatPrice(totalRental)}</span>
              </div>

              <div className="flex justify-between items-center text-[#665a45]">
                <span className="flex items-center gap-1.5">
                  <FontAwesomeIcon icon={faShieldHalved} className="text-[#d4af37]" />
                  Tiền cọc bảo đảm (Hoàn 100%)
                </span>
                <span className="font-bold text-[#1a1a1a] text-[15px]">{formatPrice(totalDeposit)}</span>
              </div>

              <div className="flex justify-between items-center text-[#665a45] pt-2 border-t border-dashed border-[#e6dcab]">
                <span className="text-[12px] text-emerald-700 font-semibold flex items-center gap-1.5">
                  <FontAwesomeIcon icon={faCheck} className="text-emerald-600 text-[11px]" />
                  Phí giao hàng GHN
                </span>
                <span className="text-[12px] font-bold text-emerald-700">Miễn phí</span>
              </div>
            </div>

            <div className="border-t border-[#e6dcab] pt-5">
              <div className="flex justify-between items-end mb-6">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#b8935a] block mb-1">
                    Tổng Thanh Toán
                  </span>
                  <span className="text-[11px] text-[#8a7d63] font-medium">Đã bao gồm VAT & Bảo đảm</span>
                </div>
                <span className="text-[28px] lg:text-[32px] font-extrabold text-[#1a1a1a] leading-none text-right tracking-tight">
                  {formatPrice(total)}
                </span>
              </div>

              <Button
                onClick={handleCheckout}
                loading={isLoading}
                className="w-full py-4 rounded-2xl text-[12px] uppercase tracking-[0.15em] font-bold transition-all duration-300 flex items-center justify-center gap-3 shadow-lg bg-gradient-to-r from-[#1a1a1a] via-[#2d2d2d] to-[#121212] text-[#f5e6ca] hover:brightness-125 border border-[#c9a869]/40 luxury-btn-gold-shine"
              >
                {isLoading ? "Đang xử lý tạo đơn..." : "Xác Nhận Đặt Thuê Ngay"}
                {!isLoading && <FontAwesomeIcon icon={faArrowRight} className="text-[12px] text-[#d4af37]" />}
              </Button>

              <div className="mt-5 pt-4 border-t border-[#e6dcab] space-y-2">
                <div className="flex items-center gap-2 text-[11px] text-[#8a7d63]">
                  <FontAwesomeIcon icon={faShieldHalved} className="text-emerald-600 text-[12px]" />
                  <span>Bảo hiểm hư hỏng nhẹ trang phục đã bao gồm</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-[#8a7d63]">
                  <FontAwesomeIcon icon={faTruck} className="text-[#b8935a] text-[12px]" />
                  <span>Đơn vận chuyển hỏa tốc đóng gói chống bụi nilon cao cấp</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
