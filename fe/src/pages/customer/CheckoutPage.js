"use client"

import { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { useCart } from "../../context/CartContext"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
    faClock,
    faMapMarkerAlt,
    faShieldAlt,
    faTruck,
    faCheck,
    faCreditCard,
} from '@fortawesome/free-solid-svg-icons'
import Button from "../../components/Button"
import Radio from "../../components/ui/Radio"
import Input from "../../components/ui/Input"
import QuantitySelector from "../../components/ui/QuantitySelector"
import SizeSelector from "../../components/ui/SizeSelector"

const additionalItems = [
    {
        id: "2",
        name: "Clutch Dự Tiệc",
        image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=200&h=200&fit=crop",
        pricePerDay: 150000,
    },
    {
        id: "3",
        name: "Bông Tai Pha Lê",
        image: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=200&h=200&fit=crop",
        pricePerDay: 80000,
    },
]

export function Checkout() {
    const navigate = useNavigate()
    const location = useLocation()
    const { cartItems, clearCart, removeFromCart } = useCart()

    // Lấy ID các sản phẩm đã được chọn từ Giỏ hàng
    const selectedIds = location.state?.selectedIds || [];
    const getItemId = (item) => `${item.costumeId}-${item.size}-${item.startDate}-${item.endDate}`;

    const checkoutItems = selectedIds.length > 0
        ? cartItems.filter(item => selectedIds.includes(getItemId(item)))
        : cartItems; // Nếu vào thẳng link không qua giỏ, fallback lấy hết

    const [startDate, setStartDate] = useState(() => checkoutItems[0]?.startDate || new Date().toISOString().split('T')[0])
    const [endDate, setEndDate] = useState(() => {
        if (checkoutItems[0]?.endDate) return checkoutItems[0].endDate;
        const d = new Date()
        d.setDate(d.getDate() + 2)
        return d.toISOString().split('T')[0]
    })
    const [deliveryOption, setDeliveryOption] = useState("delivery")
    const [paymentMethod, setPaymentMethod] = useState("Tiền mặt")

    const [address, setAddress] = useState({ name: "", phone: "", detail: "" })
    const [isLoading, setIsLoading] = useState(false)

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
        }).format(amount)
    }

    const startObj = new Date(startDate)
    const endObj = new Date(endDate)
    let rentalDays = Math.ceil((endObj - startObj) / (1000 * 60 * 60 * 24))
    if (rentalDays < 1) rentalDays = 1 // Safe fallback

    const subtotal = checkoutItems.reduce((sum, item) => {
        const qty = item.quantity || 1
        const price = item.rentalPrice || 0
        return sum + (price * qty * rentalDays)
    }, 0)

    const originalTotal = checkoutItems.reduce((sum, item) => {
        const qty = item.quantity || 1
        // Giả lập giá gốc gấp đôi nếu không có price
        const originalPrice = (item.rentalPrice || 0) * 2
        return sum + (originalPrice * qty * rentalDays)
    }, 0)

    const deliveryFee = deliveryOption === "delivery" ? 50000 : 0
    const insuranceFee = checkoutItems.length > 0 ? 100000 : 0
    const total = subtotal + deliveryFee + insuranceFee

    const handleCheckout = async () => {
        if (checkoutItems.length === 0) return;

        if (deliveryOption === "delivery" && (!address.name || !address.phone || !address.detail)) {
            alert("Vui lòng nhập đầy đủ thông tin giao hàng!");
            return;
        }

        setIsLoading(true);
        try {
            const token = localStorage.getItem("token") || sessionStorage.getItem("token");
            const payload = {
                startDate: new Date(startDate).toISOString(),
                endDate: new Date(endDate).toISOString(),
                items: checkoutItems.map(item => ({
                    costume: item.costumeId,
                    size: item.size || "M",
                    color: item.color || "Mặc định",
                    quantity: item.quantity || 1
                })),
                shippingFee: deliveryFee,
                paymentMethod: paymentMethod,
                shippingAddress: {
                    receiverName: deliveryOption === "delivery" ? address.name : "Khách nhận tại cửa hàng",
                    receiverPhone: deliveryOption === "delivery" ? address.phone : "Tại cửa hàng",
                    province: "",
                    district: "",
                    ward: "",
                    addressDetail: deliveryOption === "delivery" ? address.detail : "Nhận tại cửa hàng"
                }
            };

            const API_URL = process.env.REACT_APP_API_URL || "http://localhost:9999";
            const res = await fetch(`${API_URL}/api/rentals/create`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                // Nếu đặt toàn bộ giỏ thì clearCart, nếu chỉ đặt 1 vài món thì remove thủ công
                if (checkoutItems.length === cartItems.length) {
                    clearCart();
                } else {
                    checkoutItems.forEach(item => removeFromCart(item.costumeId, item.size, item.startDate, item.endDate));
                }
                navigate("/rental-history");
            } else {
                const data = await res.json();
                alert(data.message || "Lỗi khi đặt hàng");
            }
        } catch (err) {
            console.error("Lỗi đặt hàng:", err);
            alert("Lỗi kết nối đến máy chủ");
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

                <div className="grid lg:grid-cols-[1fr_320px] gap-8">
                    {/* Left Column - Product Details */}
                    <div className="lg:col-span-1 space-y-4 mb-6">
                        {/* Mapped Product Cards from Checkout */}
                        {checkoutItems.map((cartItem, idx) => {
                            const qty = cartItem.quantity || 1;
                            const price = cartItem.rentalPrice || 0;
                            const image = cartItem.image || "https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=400&h=500&fit=crop";
                            const selectedSize = cartItem.size || "M";

                            return (
                                <div key={`${cartItem.costumeId}-${idx}`} className="bg-white flex flex-col gap-6 rounded-xl border py-4 shadow-sm overflow-hidden duration-200 hover:-translate-y-1 hover:shadow-lg mb-4">
                                    <div className="px-4">
                                        <div className="flex flex-row gap-4 md:gap-6">
                                            {/* Image Gallery */}
                                            <div className="relative w-24 md:w-32 shrink-0">
                                                <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-surface">
                                                    <img
                                                        src={image}
                                                        alt={cartItem.costumeName}
                                                        className="w-full h-full object-cover"
                                                        crossOrigin="anonymous"
                                                    />
                                                </div>
                                            </div>

                                            {/* Product Info */}
                                            <div className="flex-1 space-y-4">
                                                <div className="my-4">
                                                    <h2 className="text-xl font-semibold text-foreground mb-1 text-pretty">
                                                        {cartItem.costumeName}
                                                    </h2>
                                                    <div className="flex items-baseline gap-2">
                                                        <span className="text-2xl font-bold text-primary">
                                                            {formatCurrency(price)}
                                                        </span>
                                                        <span className="text-sm text-muted-foreground">/ngày</span>
                                                    </div>
                                                </div>

                                                <div className="flex flex-wrap gap-3 items-center">
                                                    <span className="text-xs text-muted-foreground">Kích cỡ:</span>
                                                    <span className="font-semibold">{selectedSize}</span>
                                                </div>

                                                <div className="flex flex-wrap gap-3 items-center">
                                                    <span className="text-xs text-muted-foreground">Số lượng:</span>
                                                    <span className="font-semibold">{qty}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}

                        {/* Rental Duration */}
                        <div className="bg-white flex flex-col gap-6 rounded-xl border py-6 shadow-sm transform transition-transform duration-200 hover:-translate-y-1 hover:shadow-lg">
                            <div className="px-6">
                                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                                    <FontAwesomeIcon icon={faClock} className="h-5 w-5 text-primary" />
                                    Thời gian thuê ({rentalDays} ngày)
                                </h3>

                                <div className="space-y-4">
                                    <div className="grid sm:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-700">Ngày nhận</label>
                                            <Input
                                                type="date"
                                                value={startDate}
                                                min={new Date().toISOString().split('T')[0]}
                                                onChange={(e) => {
                                                    setStartDate(e.target.value)
                                                    if (new Date(e.target.value) > new Date(endDate)) {
                                                        setEndDate(e.target.value)
                                                    }
                                                }}
                                                className="bg-background"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-700">Ngày trả</label>
                                            <Input
                                                type="date"
                                                value={endDate}
                                                min={startDate}
                                                onChange={(e) => setEndDate(e.target.value)}
                                                className="bg-background"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

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
                                                    {formatCurrency(50000)}
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

                        {/* Additional Items */}
                        <div className="bg-white flex flex-col gap-6 rounded-xl border py-6 shadow-sm transform transition-transform duration-200 hover:-translate-y-1 hover:shadow-lg">
                            <div className="px-6">
                                <h3 className="text-lg font-semibold text-foreground mb-4">
                                    Có thể bạn cũng thích
                                </h3>
                                <div className="grid sm:grid-cols-2 gap-4">
                                    {additionalItems.map((addItem) => (
                                        <div
                                            key={addItem.id}
                                            className="flex items-center gap-3 p-3 rounded-lg border bg-white transition-colors duration-200 hover:bg-primary/10 cursor-pointer"
                                        >
                                            <img
                                                src={addItem.image}
                                                alt={addItem.name}
                                                className="w-16 h-16 rounded-md object-cover"
                                                crossOrigin="anonymous"
                                            />
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-foreground">{addItem.name}</p>
                                                <p className="text-sm text-primary font-semibold">
                                                    {formatCurrency(addItem.pricePerDay)}/ngày
                                                </p>
                                            </div>
                                            <Button variant="outline" size="sm">
                                                Thêm
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Order Summary */}
                    <div>
                        <div className="sticky top-24">
                            <div className="bg-white flex flex-col gap-6 rounded-xl border py-6 shadow-sm border-border shadow-lg transform transition-transform duration-200 hover:-translate-y-1 hover:shadow-2xl">
                                <div className="px-6 p-6">
                                    <div className="flex items-center gap-2 mb-4">
                                        <div variant="secondary" className="bg-primary/10 text-sm border-0">
                                            Giá đã bao gồm tất cả phí
                                        </div>
                                    </div>

                                    <h3 className="text-xl font-semibold text-foreground mb-6">
                                        Tóm tắt đơn hàng
                                    </h3>

                                    <div className="space-y-3 text-sm">
                                        {checkoutItems.map((item, idx) => {
                                            const qty = item.quantity || 1;
                                            const price = item.rentalPrice || 0;
                                            return (
                                                <div key={`${item.costumeId}-${idx}`} className="flex justify-between">
                                                    <span className="text-muted-foreground line-clamp-1 mr-4">
                                                        {item.costumeName} × {qty}
                                                    </span>
                                                    <span className="font-medium text-foreground shrink-0">{formatCurrency(price * qty * rentalDays)}</span>
                                                </div>
                                            )
                                        })}

                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground font-semibold border-t border-border pt-2 w-full flex justify-between">Tạm tính: <span>{formatCurrency(subtotal)}</span></span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Phí giao hàng</span>
                                            <span className="font-medium text-foreground">
                                                {deliveryFee === 0 ? "Miễn phí" : formatCurrency(deliveryFee)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground flex items-center gap-1">
                                                <FontAwesomeIcon icon={faShieldAlt} className="h-3.5 w-3.5" />
                                                Phí bảo hiểm
                                            </span>
                                            <span className="font-medium text-foreground">
                                                {formatCurrency(insuranceFee)}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="bg-border shrink-0 h-px w-full my-4" />

                                    <div className="flex justify-between items-baseline mb-6">
                                        <span className="text-foreground font-medium">Tổng cộng</span>
                                        <div className="text-right">
                                            <span className="text-sm text-muted-foreground line-through mr-2">
                                                {formatCurrency(originalTotal)}
                                            </span>
                                            <span className="text-2xl font-bold text-primary">{formatCurrency(total)}</span>
                                        </div>
                                    </div>

                                    <Button
                                        onClick={handleCheckout}
                                        disabled={isLoading}
                                        className="w-full h-12 text-base font-semibold bg-black hover:bg-black/90 text-white"
                                    >
                                        {isLoading ? "Đang xử lý..." : "Đặt thuê ngay"}
                                    </Button>

                                    <p className="text-xs text-center text-muted-foreground mt-3">
                                        Bạn chưa bị tính phí ngay bây giờ
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
