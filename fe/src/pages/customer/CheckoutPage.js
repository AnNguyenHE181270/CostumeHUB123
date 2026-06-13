import { useState } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { useCart } from "../../context/CartContext"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faMapMarkerAlt, faShieldAlt, faTruck, faCheck, faCreditCard, } from '@fortawesome/free-solid-svg-icons'
import Button from "../../components/Button"
import Radio from "../../components/ui/Radio"
import Input from "../../components/ui/Input"
import Toast from "../../components/ui/Toast"
import { formatPrice, formatDateNoHours, getRentalDays } from "../../utils/formatters"
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:9999";

export function Checkout() {
    const navigate = useNavigate()
    const location = useLocation()
    const selectedIds = location.state?.selectedIds || [];

    const { cartItems, clearCart, removeFromCart } = useCart()
    const [deliveryOption, setDeliveryOption] = useState("delivery")
    const [paymentMethod, setPaymentMethod] = useState("VietQR")
    const [address, setAddress] = useState({ name: "", phone: "", detail: "" })
    const [isLoading, setIsLoading] = useState(false)
    const [toast, setToast] = useState({ isVisible: false, message: "", type: "success" })

    const showToast = (message, type = "error") => {
        setToast({ isVisible: true, message, type });
    };

    const checkoutItems = selectedIds.length > 0
        ? cartItems.filter(item => selectedIds.includes(item._id))
        : cartItems;
    const orderStartDate = checkoutItems[0]?.startDate;
    const orderEndDate = checkoutItems[0]?.endDate;

    // tính tiền thuê
    const totalRental = checkoutItems.reduce((sum, item) => {
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

    // tính tiền cọc
    const totalDeposit = checkoutItems.reduce((sum, item) => {
        return sum + (item.deposit * item.quantity)
    }, 0)

    const deliveryFee = deliveryOption === "delivery" ? 50000 : 0
    const total = totalRental + totalDeposit + deliveryFee

    const handleCheckout = async () => {
        if (checkoutItems.length === 0) return;

        if (deliveryOption === "delivery" && (!address.name || !address.phone || !address.detail)) {
            showToast("Vui lòng nhập đầy đủ thông tin giao hàng!");
            return;
        }

        const isSameDates = checkoutItems.every(item => item.startDate === orderStartDate && item.endDate === orderEndDate);
        if (!isSameDates) {
            showToast("Các sản phẩm trong đơn hàng phải có CÙNG ngày nhận và ngày trả. Vui lòng quay lại giỏ hàng để tách đơn.");
            return;
        }
        setIsLoading(true);
        try {
            const token = localStorage.getItem("token") || sessionStorage.getItem("token");
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
                    receiverName: deliveryOption === "delivery" ? address.name : "Khách nhận tại cửa hàng",
                    receiverPhone: deliveryOption === "delivery" ? address.phone : "Tại cửa hàng",
                    addressDetail: deliveryOption === "delivery" ? address.detail : "Nhận tại cửa hàng"
                }
            };

            const res = await fetch(`${API_URL}/api/rentals/create`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
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
                navigate("/rental-history");
            } else {
                const data = await res.json();
                showToast(data.message || "Lỗi khi đặt hàng");
            }
        } catch (err) {
            console.error("Lỗi đặt hàng:", err);
            showToast("Lỗi kết nối đến máy chủ. Vui lòng thử lại sau.");
        } finally {
            setIsLoading(false);
        }
    };

    if (checkoutItems.length === 0) {
        return (
            <div className="min-h-screen bg-[#faf9f7] pt-32 text-center">
                <h2 className="text-2xl font-bold mb-4">Giỏ hàng của bạn đang trống</h2>
                <Button onClick={() => navigate("/category")} className="bg-black text-white hover:bg-black/90">
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
                        {checkoutItems.map((cartItem, idx) => {
                            const rDays = getRentalDays(cartItem.startDate, cartItem.endDate);
                            const rates = cartItem.rentalRates || cartItem.costume?.rentalRates || {};
                            let calculatedPrice = (rates.pricePerDay || 0) * rDays;
                            let isPackage = null;
                            if (rDays === 3 && rates.pricePer3Days) {
                                calculatedPrice = rates.pricePer3Days;
                                isPackage = 3;
                            } else if (rDays === 7 && rates.pricePerWeek) {
                                calculatedPrice = rates.pricePerWeek;
                                isPackage = 7;
                            }
                            return (
                                <div key={`${cartItem.costumeId || cartItem._id}-${idx}`} className="bg-white flex flex-col gap-4 rounded-xl border py-3 shadow-sm overflow-hidden duration-200 hover:-translate-y-1 hover:shadow-lg mb-3">
                                    <div className="px-3">
                                        <div className="flex flex-row gap-3 md:gap-4">
                                            {/* Image Gallery */}
                                            <div className="relative w-16 md:w-24 shrink-0">
                                                <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-surface">
                                                    <img
                                                        src={cartItem.image || cartItem.costume?.images?.[0] || "https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=400&h=500&fit=crop"}
                                                        alt={cartItem.costumeName || cartItem.costume?.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                            </div>

                                            {/* Product Info */}
                                            <div className="flex-1 space-y-3">
                                                <div className="my-3">
                                                    <h2 className="text-lg font-semibold text-foreground mb-1 text-pretty">
                                                        {cartItem.costumeName}
                                                    </h2>
                                                    <div className="flex items-baseline gap-2">
                                                        <span className="text-xl font-bold text-primary">
                                                            {formatPrice(calculatedPrice)}
                                                        </span>
                                                        <span className="text-sm text-muted-foreground">
                                                            {isPackage ? `(Gói ${isPackage} ngày)` : `(/ ${rDays} ngày)`}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="flex flex-wrap justify-between">
                                                    <div className="flex flex-wrap gap-2 items-center">
                                                        <span className="text-sm">Kích cỡ:</span>
                                                        <span className="font-semibold">{cartItem.size}</span>
                                                    </div>
                                                    <div className="flex flex-wrap gap-2 items-center">
                                                        <span className="font-semibold">x {cartItem.quantity}</span>
                                                    </div>

                                                </div>
                                                <span className="text-sm">
                                                    Thời gian thuê ({getRentalDays(cartItem.startDate, cartItem.endDate)} ngày): {getRentalDays(cartItem.startDate, cartItem.endDate) === 1
                                                        ? <span className="font-medium text-foreground">Trong ngày {formatDateNoHours(cartItem.startDate)}</span>
                                                        : <span className="font-medium text-foreground">Từ {formatDateNoHours(cartItem.startDate)} đến {formatDateNoHours(cartItem.endDate)}</span>}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}



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
                                                <span className="text-sm font-semibold text-primary">
                                                    {formatPrice(50000)}
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

                                {deliveryOption === "delivery" && (
                                    <div className="mt-4 space-y-3">
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <FontAwesomeIcon icon={faMapMarkerAlt} className="h-4 w-4" />
                                            <span>Địa chỉ giao hàng</span>
                                        </div>
                                        <Input
                                            placeholder="Tên người nhận"
                                            value={address.name}
                                            onChange={(e) => setAddress({ ...address, name: e.target.value })}
                                            className="bg-background"
                                        />
                                        <Input
                                            placeholder="Số điện thoại"
                                            value={address.phone}
                                            onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                                            className="bg-background"
                                        />
                                        <Input
                                            placeholder="Địa chỉ giao hàng chi tiết"
                                            value={address.detail}
                                            onChange={(e) => setAddress({ ...address, detail: e.target.value })}
                                            className="bg-background"
                                        />
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
                                        htmlFor="vietqr"
                                        className={[
                                            "flex items-start gap-4 p-4 rounded-lg border cursor-pointer transition-colors",
                                            paymentMethod === "VietQR" ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary/50" : "border-border hover:bg-surface/50",
                                        ].filter(Boolean).join(' ')}
                                    >
                                        <Radio
                                            value="VietQR"
                                            id="vietqr"
                                            name="paymentMethod"
                                            checked={paymentMethod === "VietQR"}
                                            onChange={(e) => setPaymentMethod(e.target.value)}
                                            className="mt-0.5"
                                        />
                                        <div className="flex-1">
                                            <span className="font-medium text-foreground">Chuyển khoản ngân hàng (VietQR)</span>
                                        </div>
                                    </label>

                                    <label
                                        htmlFor="vnpay"
                                        className={[
                                            "flex items-start gap-4 p-4 rounded-lg border cursor-pointer transition-colors",
                                            paymentMethod === "VNPAY" ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary/50" : "border-border hover:bg-surface/50",
                                        ].filter(Boolean).join(' ')}
                                    >
                                        <Radio
                                            value="VNPAY"
                                            id="vnpay"
                                            name="paymentMethod"
                                            checked={paymentMethod === "VNPAY"}
                                            onChange={(e) => setPaymentMethod(e.target.value)}
                                            className="mt-0.5"
                                        />
                                        <div className="flex-1">
                                            <span className="font-medium text-foreground">Thanh toán qua VNPAY</span>
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
                                            const rDays = getRentalDays(item.startDate, item.endDate);
                                            const rates = item.rentalRates || item.costume?.rentalRates || {};
                                            let calculatedPrice = (rates.pricePerDay || 0) * rDays;
                                            if (rDays === 3 && rates.pricePer3Days) {
                                                calculatedPrice = rates.pricePer3Days;
                                            } else if (rDays === 7 && rates.pricePerWeek) {
                                                calculatedPrice = rates.pricePerWeek;
                                            }

                                            return (
                                                <div key={`${item.costumeId || item._id}-${idx}`} className="flex justify-between">
                                                    <span className="text-muted-foreground line-clamp-1 mr-4">
                                                        {item.costumeName}
                                                    </span>
                                                    <span className="font-medium text-foreground shrink-0">{formatPrice(calculatedPrice * (item.quantity || 1))}</span>
                                                </div>
                                            )
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
                                        disabled={isLoading}
                                        className="w-full h-12 text-base font-semibold bg-black hover:bg-black/90 text-white"
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
