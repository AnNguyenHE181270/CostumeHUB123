import { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { useCart } from "../../context/CartContext"
import { useAuth } from "../../context/AuthContext"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faMapMarkerAlt, faShieldAlt, faTruck, faCheck, faCreditCard, } from '@fortawesome/free-solid-svg-icons'
import Button from "../../components/ui/Button"
import Radio from "../../components/ui/Radio"
import Input from "../../components/ui/Input"
import Toast from "../../components/ui/Toast"
import { formatPrice, formatDateNoHours, getRentalDays } from "../../utils/formatters"
import rentalService from "../../services/rental.service";

export function Checkout() {
    const navigate = useNavigate()
    const location = useLocation()
    const selectedIds = location.state?.selectedIds || [];
    const buyNow = location.state?.buyNow;

    const { cartItems, clearCart, removeFromCart } = useCart()
    const { user, refreshProfile } = useAuth()
    const [deliveryOption, setDeliveryOption] = useState("delivery")
    const [paymentMethod, setPaymentMethod] = useState("WALLET")
    const [address, setAddress] = useState({ name: "", phone: "", detail: "" })
    const [selectedAddress, setSelectedAddress] = useState(null)
    const [isLoading, setIsLoading] = useState(false)
    const [toast, setToast] = useState({ isVisible: false, message: "", type: "success" })



    useEffect(() => {
        if (user) {
            let defaultAddress = user.addresses?.find(a => a.isDefault);
            if (!defaultAddress && user.addresses?.length > 0) {
                defaultAddress = user.addresses[0];
            }
            if (defaultAddress) {
                setSelectedAddress(defaultAddress);
                const parts = [defaultAddress.addressDetail, defaultAddress.ward, defaultAddress.district, defaultAddress.province].filter(Boolean);
                setAddress({
                    name: defaultAddress.receiverName || user.fullName || "",
                    phone: defaultAddress.receiverPhone || user.phone || "",
                    detail: parts.join(", ")
                });
            } else {
                setSelectedAddress(null);
                setAddress(prev => ({
                    ...prev,
                    name: user.fullName || "",
                    phone: user.phone || ""
                }));
            }
        }
    }, [user]);

    const showToast = (message, type = "error") => {
        setToast({ isVisible: true, message, type });
    };

    const checkoutItems = buyNow
        ? cartItems.filter(item =>
            (item.costumeId === buyNow.costumeId || item.costume?._id === buyNow.costumeId) &&
            (item.size === buyNow.size || item.variant?.size === buyNow.size) &&
            (item.startDate || "").substring(0, 10) === (buyNow.startDate || "").substring(0, 10) &&
            (item.endDate || "").substring(0, 10) === (buyNow.endDate || "").substring(0, 10)
        )
        : selectedIds.length > 0
            ? cartItems.filter(item => selectedIds.includes(item._id))
            : cartItems;
    const orderStartDate = checkoutItems[0]?.startDate;
    const orderEndDate = checkoutItems[0]?.endDate;

    // tính tiền thuê
    const totalRental = checkoutItems.reduce((sum, item) => {
        const days = getRentalDays(item.startDate, item.endDate);
        const factor = days >= 3 ? 1.1 : 1.0;
        return sum + item.rentalPerDay * factor * item.quantity;
    }, 0);

    // tính tiền cọc
    const totalDeposit = checkoutItems.reduce((sum, item) => {
        return sum + (item.deposit * item.quantity)
    }, 0)

    const deliveryFee = 0; // Miễn phí giao hàng trọn gói
    const total = totalRental + totalDeposit + deliveryFee

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

        const isSameDates = checkoutItems.every(item => item.startDate === orderStartDate && item.endDate === orderEndDate);
        if (!isSameDates) {
            showToast("Các sản phẩm trong đơn hàng phải có CÙNG ngày nhận và ngày trả. Vui lòng quay lại giỏ hàng để tách đơn.");
            return;
        }
        setIsLoading(true);
        try {
            const payload = {
                startDate: new Date(orderStartDate).toISOString(),
                endDate: new Date(orderEndDate).toISOString(),
                items: checkoutItems.map(item => ({
                    costume: item.costumeId || item._id || item.costume?._id,
                    size: item.size || item.variant?.size || "M",
                    color: item.color || item.costume?.color || "Mặc định",
                    quantity: item.quantity || 1,
                    cartStartDate: item.startDate,
                    cartEndDate: item.endDate
                })),
                shippingFee: deliveryFee,
                paymentMethod: paymentMethod,
                shippingAddress: {
                    receiverName: address.name,
                    receiverPhone: address.phone,
                    addressDetail: deliveryOption === "delivery" && address.detail ? address.detail : "Nhận tại cửa hàng",
                    provinceId: deliveryOption === "delivery" && selectedAddress ? selectedAddress.provinceId : null,
                    districtId: deliveryOption === "delivery" && selectedAddress ? selectedAddress.districtId : null,
                    wardCode: deliveryOption === "delivery" && selectedAddress ? selectedAddress.wardCode : null,
                    province: deliveryOption === "delivery" && selectedAddress ? selectedAddress.province : null,
                    district: deliveryOption === "delivery" && selectedAddress ? selectedAddress.district : null,
                    ward: deliveryOption === "delivery" && selectedAddress ? selectedAddress.ward : null
                }
            };

            await rentalService.createOrder(payload);
            // Fallback: Xóa khỏi giỏ thủ công phía Frontend để đảm bảo 100% dọn dẹp
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
            navigate("/rental-history");
        } catch (err) {
            showToast(err.message || "Lỗi kết nối đến máy chủ. Vui lòng thử lại sau.");
        } finally {
            setIsLoading(false);
        }
    };

    if (checkoutItems.length === 0) {
        return (
            <div className="min-h-screen bg-[#faf9f7] pt-32 text-center">
                <h2 className="text-2xl font-bold mb-4">Giỏ hàng của bạn đang trống</h2>
                <Button onClick={() => navigate("/category")} className="w-auto mx-auto bg-black text-white hover:bg-black/90 px-8">
                    Khám phá sản phẩm
                </Button>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-white via-[#fbf9f6] to-[#faf9f7] pt-20 transition-colors duration-300">
            <Toast
                isVisible={toast.isVisible}
                message={toast.message}
                type={toast.type}
                onClose={() => setToast(prev => ({ ...prev, isVisible: false }))}
            />
            <div className="center mx-auto px-4 max-w-6xl">
                {/* Page Header & Stepper */}
                <div className="mb-12 pb-4">
                    <h1
                        className="text-3xl font-bold text-[#1a1a1a] tracking-tight mb-8 text-center"
                        style={{ fontFamily: "'Cormorant Garamond', serif" }}
                    >
                        Thanh Toán Đơn Thuê
                    </h1>

                    {/* Horizontal Stepper */}
                    <div className="flex items-center w-full max-w-2xl mx-auto px-4 sm:px-0">
                        {/* Step 1 */}
                        <div className="relative flex flex-col items-center z-10 shrink-0">
                            <div className="w-8 h-8 flex items-center justify-center rounded-full bg-[#1a1a1a] text-white">
                                <FontAwesomeIcon icon={faCheck} className="w-4 h-4" />
                            </div>
                            <p className="absolute top-10 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs sm:text-sm font-medium text-[#1a1a1a]">
                                Thông tin thuê
                            </p>
                        </div>

                        {/* Line 1 */}
                        <div className="flex-1 h-[2px] bg-border mx-2 sm:mx-4"></div>

                        {/* Step 2 */}
                        <div className="relative flex flex-col items-center z-10 shrink-0">
                            <div className="w-8 h-8 flex items-center justify-center rounded-full bg-white border-2 border-border text-muted-foreground">
                                <span className="text-sm font-semibold">2</span>
                            </div>
                            <p className="absolute top-10 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs sm:text-sm font-bold text-[#1a1a1a]">
                                Thanh toán
                            </p>
                        </div>

                        {/* Line 2 */}
                        <div className="flex-1 h-[2px] bg-border mx-2 sm:mx-4"></div>

                        {/* Step 3 */}
                        <div className="relative flex flex-col items-center z-10 shrink-0">
                            <div className="w-8 h-8 flex items-center justify-center rounded-full bg-white border-2 border-border text-muted-foreground">
                                <span className="text-sm font-semibold">3</span>
                            </div>
                            <p className="absolute top-10 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs sm:text-sm font-medium text-muted-foreground">
                                Tạo đơn thành công
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid lg:grid-cols-[1fr_400px] gap-10">
                    {/* Left Column - Product Details */}
                    <div className="lg:col-span-1 space-y-4 mb-6">
                        {/* Mapped Product Cards from Checkout */}
                        {checkoutItems.map((cartItem, idx) => (
                            <div key={`${cartItem.costumeId || cartItem._id}-${idx}`} className="bg-white flex flex-col gap-4 rounded-xl border py-3 shadow-sm overflow-hidden duration-200 hover:-translate-y-1 hover:shadow-lg mb-3">
                                <div className="px-3">
                                    <div className="flex flex-row gap-4 md:gap-5 items-stretch">
                                        {/* Image Gallery */}
                                        <div className="relative w-24 md:w-32 shrink-0 rounded-lg overflow-hidden bg-surface">
                                            <img
                                                src={cartItem.image || cartItem.costume?.images?.[0] || "https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=400&h=500&fit=crop"}
                                                alt={cartItem.costumeName || cartItem.costume?.name}
                                                className="absolute inset-0 w-full h-full object-cover"
                                            />
                                        </div>

                                        {/* Product Info */}
                                        <div className="flex-1 text-sm space-y-2 py-1">
                                            <h2 className="text-lg font-bold text-foreground mb-2 text-pretty" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                                                {cartItem.costumeName}
                                            </h2>
                                            <p className="text-md font-bold text-primary">Giá thuê: {formatPrice(cartItem.rentalPerDay)} </p>
                                            <p className="text-muted-foreground">Kích cỡ: <span className="font-medium text-foreground">{cartItem.size}</span></p>
                                            <p className="text-muted-foreground">Số lượng: <span className="font-medium text-foreground">{cartItem.quantity}</span></p>
                                            <p className="text-muted-foreground"> Thời gian thuê ({getRentalDays(cartItem.startDate, cartItem.endDate)} ngày): {getRentalDays(cartItem.startDate, cartItem.endDate) === 1
                                                ? <span className="font-medium text-foreground">Trong ngày {formatDateNoHours(cartItem.startDate)}</span>
                                                : <span className="font-medium text-foreground">Từ {formatDateNoHours(cartItem.startDate)} đến {formatDateNoHours(cartItem.endDate)}</span>}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                        )}

                        {/* Delivery Options */}
                        <div className="bg-white flex flex-col gap-6 rounded-xl border py-6 shadow-sm transform transition-transform duration-200 hover:-translate-y-1 hover:shadow-lg">
                            <div className="px-6">
                                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                                    <FontAwesomeIcon icon={faTruck} className="h-5 w-5 text-primary" />
                                    Phương thức nhận hàng
                                </h3>

                                <div className="space-y-3">
                                    <label
                                        htmlFor="delivery"
                                        className={[
                                            "flex items-start gap-4 p-4 rounded-lg border cursor-pointer transition-colors",
                                            deliveryOption === "delivery" ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary/50" : "border-border hover:bg-surface/50",
                                        ].filter(Boolean).join(' ')}
                                    >
                                        <Radio
                                            value="delivery"
                                            id="delivery"
                                            name="deliveryOption"
                                            checked={deliveryOption === "delivery"}
                                            onChange={(e) => setDeliveryOption(e.target.value)}
                                            className="mt-0.5"
                                        />
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between">
                                                <span className="font-medium text-foreground">Giao hàng tận nơi</span>
                                                <span className="text-sm font-semibold text-green-600">
                                                    Miễn phí
                                                </span>
                                            </div>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                Nhận hàng trong 2-3 ngày làm việc
                                            </p>
                                        </div>
                                    </label>

                                    <label
                                        htmlFor="pickup"
                                        className={[
                                            "flex items-start gap-4 p-4 rounded-lg border cursor-pointer transition-colors",
                                            deliveryOption === "pickup" ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary/50" : "border-border hover:bg-surface/50",
                                        ].filter(Boolean).join(' ')}
                                    >
                                        <Radio
                                            value="pickup"
                                            id="pickup"
                                            name="deliveryOption"
                                            checked={deliveryOption === "pickup"}
                                            onChange={(e) => setDeliveryOption(e.target.value)}
                                            className="mt-0.5"
                                        />
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between">
                                                <span className="font-medium text-foreground">Nhận tại cửa hàng</span>
                                                <span className="text-sm font-semibold text-green-600">Miễn phí</span>
                                            </div>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                123 Nguyễn Huệ, Q.1, TP.HCM
                                            </p>
                                        </div>
                                    </label>
                                </div>

                                {deliveryOption === "pickup" && (
                                    <div className="mt-4 space-y-3">
                                        <div className="flex items-center gap-2 text-sm mb-2">
                                            <FontAwesomeIcon icon={faMapMarkerAlt} className="h-4 w-4 text-primary" />
                                            <span className="font-semibold text-foreground">Thông tin người nhận tại cửa hàng</span>
                                        </div>
                                        <Input
                                            id="pickup-name"
                                            label="Họ và tên người nhận"
                                            placeholder="Nhập họ và tên"
                                            value={address.name}
                                            onChange={(e) => setAddress(prev => ({ ...prev, name: e.target.value }))}
                                        />
                                        <Input
                                            id="pickup-phone"
                                            label="Số điện thoại"
                                            placeholder="Nhập số điện thoại"
                                            value={address.phone}
                                            onChange={(e) => setAddress(prev => ({ ...prev, phone: e.target.value }))}
                                        />
                                    </div>
                                )}

                                {deliveryOption === "delivery" && (
                                    <div className="mt-4">
                                        <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground mb-3">
                                            <div className="flex items-center gap-2">
                                                <FontAwesomeIcon icon={faMapMarkerAlt} className="h-4 w-4 text-primary" />
                                                <span className="font-semibold text-foreground">Địa chỉ giao hàng</span>
                                            </div>
                                            <button
                                                onClick={() => navigate("/user/addresses")}
                                                className="text-[12px] uppercase tracking-[0.1em] font-semibold text-primary hover:underline transition-colors"
                                            >
                                                Thay đổi
                                            </button>
                                        </div>
                                        {selectedAddress ? (
                                            <div className="border border-[#eaeaea] p-4 flex flex-col md:flex-row md:items-start justify-between gap-4 transition-colors rounded-xl bg-primary/5">
                                                <div>
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <span className="font-bold text-[#1a1a1a] text-base">{selectedAddress.receiverName}</span>
                                                        <span className="text-[#858585]">|</span>
                                                        <span className="text-[#555] font-medium">{selectedAddress.receiverPhone}</span>
                                                        {selectedAddress.isDefault && (
                                                            <span className="text-[10px] uppercase tracking-[0.1em] font-semibold border border-primary text-primary px-2 py-1 ml-2 rounded-sm bg-white">
                                                                Mặc định
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-[#555] text-sm mb-1">{selectedAddress.addressDetail}</p>
                                                    <p className="text-[#555] text-sm">{selectedAddress.ward}, {selectedAddress.district}, {selectedAddress.province}</p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="border border-red-200 bg-red-50 p-4 rounded-xl text-center">
                                                <p className="text-red-600 text-sm mb-3">Bạn chưa có địa chỉ giao hàng nào.</p>
                                                <Button onClick={() => navigate("/user/addresses")} className="bg-red-600 hover:bg-red-700 text-white text-sm h-9 px-6 rounded-lg font-medium mx-auto w-auto">
                                                    Thêm địa chỉ ngay
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Payment Options */}
                        <div className="bg-white flex flex-col gap-6 rounded-xl border py-6 shadow-sm transform transition-transform duration-200 hover:-translate-y-1 hover:shadow-lg">
                            <div className="px-6">
                                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                                    <FontAwesomeIcon icon={faCreditCard} className="h-5 w-5 text-primary" />
                                    Phương thức thanh toán
                                </h3>

                                <div className="space-y-3">
                                    <label
                                        htmlFor="wallet"
                                        className={[
                                            "flex items-start gap-4 p-4 rounded-lg border cursor-pointer transition-colors",
                                            paymentMethod === "WALLET" ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary/50" : "border-border hover:bg-surface/50",
                                        ].filter(Boolean).join(' ')}
                                    >
                                        <Radio
                                            value="WALLET"
                                            id="wallet"
                                            name="paymentMethod"
                                            checked={paymentMethod === "WALLET"}
                                            onChange={(e) => setPaymentMethod(e.target.value)}
                                            className="mt-0.5"
                                        />
                                        <div className="flex-1">
                                            <span className="font-medium text-foreground">Thanh toán bằng số dư ví</span>
                                        </div>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Order Summary */}
                    <div>
                        <div className="sticky top-24">
                            <div className="bg-white flex flex-col gap-6 rounded-xl border py-6 shadow-sm border-border shadow-lg transform transition-transform duration-200 hover:-translate-y-1 hover:shadow-2xl">
                                <div className="px-6">
                                    <h3 className="text-3xl font-bold text-foreground text-center">
                                        Tóm tắt đơn hàng
                                    </h3>
                                    <span className="block text-center italic text-sm mb-6">Giá đã bao gồm tất cả phí</span>

                                    <div className="space-y-3 text-sm">
                                        {checkoutItems.map((item, idx) => {
                                            const days = getRentalDays(item.startDate, item.endDate);
                                            const factor = days >= 3 ? 1.1 : 1.0;
                                            return (
                                                <div key={`${item.costumeId || item._id}-${idx}`} className="flex justify-between">
                                                    <span className="text-muted-foreground line-clamp-1 mr-4">
                                                        {item.costumeName}
                                                    </span>
                                                    <span className="font-medium text-foreground shrink-0">
                                                        {formatPrice(item.rentalPerDay * factor * item.quantity)}
                                                    </span>
                                                </div>
                                            );
                                        })}

                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground font-semibold border-t pt-2 w-full flex justify-between">Tạm tính: <span>{formatPrice(totalRental)}</span></span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground font-semibold w-full flex justify-between">Cọc: <span>{formatPrice(totalDeposit)}</span></span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Phí giao hàng</span>
                                            <span className="font-medium text-foreground">
                                                {deliveryFee === 0 ? "Miễn phí" : formatPrice(deliveryFee)}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="bg-border shrink-0 h-px w-full my-4" />

                                    <div className="flex justify-between items-baseline mb-6">
                                        <span className="text-foreground font-medium">Tổng cộng</span>
                                        <div className="text-right">

                                            <span className="text-2xl font-bold text-primary">{formatPrice(total)}</span>
                                        </div>
                                    </div>

                                    <Button
                                        onClick={handleCheckout}
                                        loading={isLoading}
                                        className="h-12 text-base font-semibold bg-black hover:bg-black/90 text-white"
                                    >
                                        {isLoading ? "Đang xử lý..." : "Đặt thuê ngay"}
                                    </Button>

                                    <p className="text-xs text-center text-red-600 font-medium italic animate-pulse mt-3">
                                        Vui lòng kiểm tra kỹ thông tin!
                                    </p>

                                    <div className="mt-6 pt-4 border-t border-border space-y-2">
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <FontAwesomeIcon icon={faShieldAlt} className="h-4 w-4 text-green-600" />
                                            <span>Bảo hiểm hư hỏng đã bao gồm</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <FontAwesomeIcon icon={faTruck} className="h-4 w-4 text-primary" />
                                            <span>Giao hàng nhanh 2-3 ngày</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Help */}
                            <div className="mt-4 text-center">
                                <button className="text-sm text-muted-foreground hover:text-primary transition-colors">
                                    Cần hỗ trợ? Liên hệ chúng tôi
                                </button>
                            </div>

                            {/* Trust Stats */}
                            <div className="mt-6 grid grid-cols-3 gap-2 text-center p-4 rounded-xl bg-primary/5">
                                <div>
                                    <p className="text-xl font-bold text-primary">500+</p>
                                    <p className="text-xs text-muted-foreground mt-1">Sản phẩm</p>
                                </div>
                                <div>
                                    <p className="text-xl font-bold text-primary">2000+</p>
                                    <p className="text-xs text-muted-foreground mt-1">Khách hàng</p>
                                </div>
                                <div>
                                    <p className="text-xl font-bold text-primary">24/7</p>
                                    <p className="text-xs text-muted-foreground mt-1">Hỗ trợ</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
