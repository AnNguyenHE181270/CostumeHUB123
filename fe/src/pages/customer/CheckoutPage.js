"use client"

import { useState } from "react"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
    faCalendarDays,
    faChevronLeft,
    faChevronRight,
    faClock,
    faMapMarkerAlt,
    faMinus,
    faPlus,
    faShieldAlt,
    faTruck,
    faTimes,
} from '@fortawesome/free-solid-svg-icons'
import Header from '../../components/layout/Header'
import Footer from '../../components/layout/Footer'

import Button from "../../components/Button"
import { Card, CardContent } from "../../components/customer/CheckoutCard"
import { RadioGroup, RadioGroupItem } from "../../components/ui/Radio"
import Input from "../../components/ui/Input"

const sampleItem = {
    id: "1",
    name: "Váy Dạ Hội Sequin Sang Trọng",
    image: "https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=400&h=500&fit=crop",
    pricePerDay: 450000,
    originalPrice: 2500000,
    size: "M",
    color: "Đỏ",
    quantity: 1,
}

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
    const [item, setItem] = useState(sampleItem)
    const [rentalDays, setRentalDays] = useState(3)
    const [startDate, setStartDate] = useState(new Date())
    const [deliveryOption, setDeliveryOption] = useState("delivery")
    const [currentImageIndex, setCurrentImageIndex] = useState(0)

    const images = [
        "https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=600&h=800&fit=crop",
        "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&h=800&fit=crop",
        "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600&h=800&fit=crop",
    ]

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
        }).format(amount)
    }

    const formatDate = (date) => {
        return new Intl.DateTimeFormat("vi-VN", {
            weekday: "short",
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        }).format(date)
    }

    const endDate = new Date(startDate)
    endDate.setDate(endDate.getDate() + rentalDays - 1)

    const subtotal = item.pricePerDay * rentalDays * item.quantity
    const deliveryFee = deliveryOption === "delivery" ? 50000 : 0
    const insuranceFee = 100000
    const total = subtotal + deliveryFee + insuranceFee

    const handleQuantityChange = (delta) => {
        setItem((prev) => ({
            ...prev,
            quantity: Math.max(1, prev.quantity + delta),
        }))
    }

    const handleRentalDaysChange = (delta) => {
        setRentalDays((prev) => Math.max(1, Math.min(30, prev + delta)))
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-white via-[#fbf9f6] to-[#faf9f7] pt-20 transition-colors duration-300">
            <Header />
            <main className="container mx-auto px-4 py-6 max-w-6xl">
                <div className="grid lg:grid-cols-[1fr_320px] gap-8">
                    {/* Left Column - Product Details */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Product Card */}
                        <Card className="overflow-hidden border-border transform transition-transform duration-200 hover:-translate-y-1 hover:shadow-lg">
                            <CardContent className="p-0">
                                <div className="flex flex-col md:flex-row gap-6 p-6">
                                    {/* Image Gallery */}
                                    <div className="relative w-full md:w-64 shrink-0">
                                        <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-surface">
                                            <img
                                                src={images[currentImageIndex]}
                                                alt={item.name}
                                                className="w-full h-full object-cover"
                                                crossOrigin="anonymous"
                                            />
                                            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                                                {images.map((_, idx) => (
                                                    <button
                                                        key={idx}
                                                        onClick={() => setCurrentImageIndex(idx)}
                                                        className={[
                                                            "w-2 h-2 rounded-full transition-all",
                                                            idx === currentImageIndex ? "bg-primary w-4" : "bg-card/80",
                                                        ]
                                                            .filter(Boolean)
                                                            .join(' ')}
                                                    />
                                                ))}
                                            </div>
                                            <button
                                                onClick={() =>
                                                    setCurrentImageIndex((prev) =>
                                                        prev === 0 ? images.length - 1 : prev - 1
                                                    )
                                                }
                                                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-card/90 flex items-center justify-center hover:bg-card transition-colors"
                                            >
                                                <FontAwesomeIcon icon={faChevronLeft} className="h-4 w-4 text-foreground" />
                                            </button>
                                            <button
                                                onClick={() =>
                                                    setCurrentImageIndex((prev) =>
                                                        prev === images.length - 1 ? 0 : prev + 1
                                                    )
                                                }
                                                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-card/90 flex items-center justify-center hover:bg-card transition-colors"
                                            >
                                                <FontAwesomeIcon icon={faChevronRight} className="h-4 w-4 text-foreground" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Product Info */}
                                    <div className="flex-1 space-y-4">
                                        <div>
                                            <div className="mb-2  text-primary border-0 hover:bg-primary/20">
                                                Giảm 82%
                                            </div>
                                            <h2 className="text-xl font-semibold text-foreground mb-1 text-pretty">
                                                {item.name}
                                            </h2>
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-2xl font-bold text-primary">
                                                    {formatCurrency(item.pricePerDay)}
                                                </span>
                                                <span className="text-sm text-muted-foreground">/ngày</span>
                                                <span className="text-sm text-muted-foreground line-through ml-2">
                                                    {formatCurrency(item.originalPrice)}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-3">
                                            <div className="px-3 py-1.5 rounded-md bg-surface">
                                                <span className="text-xs text-muted-foreground">Kích cỡ</span>
                                                <p className="text-sm font-medium text-foreground">{item.size}</p>
                                            </div>
                                            <div className="px-3 py-1.5 rounded-md bg-surface">
                                                <span className="text-xs text-muted-foreground">Màu sắc</span>
                                                <p className="text-sm font-medium text-foreground">{item.color}</p>
                                            </div>
                                        </div>

                                        {/* Quantity */}
                                        <div className="flex items-center gap-4">
                                            <span className="text-sm font-medium text-foreground">Số lượng:</span>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    onClick={() => handleQuantityChange(-1)}
                                                >
                                                    <FontAwesomeIcon icon={faMinus} className="h-3 w-3" />
                                                </Button>
                                                <span className="w-8 text-center font-medium text-foreground">
                                                    {item.quantity}
                                                </span>
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    onClick={() => handleQuantityChange(1)}
                                                >
                                                    <FontAwesomeIcon icon={faPlus} className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Rental Duration */}
                        <Card className="border-border transform transition-transform duration-200 hover:-translate-y-1 hover:shadow-lg">
                            <CardContent className="p-6">
                                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                                    <FontAwesomeIcon icon={faClock} className="h-5 w-5 text-primary" />
                                    Thời gian thuê
                                </h3>

                                <div className="space-y-4">
                                    {/* Duration Selector */}
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">Số ngày thuê</span>
                                        <div className="flex items-center gap-3">
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="h-9 w-9"
                                                onClick={() => handleRentalDaysChange(-1)}
                                            >
                                                <FontAwesomeIcon icon={faMinus} className="h-4 w-4" />
                                            </Button>
                                            <span className="w-12 text-center text-lg font-semibold text-foreground">
                                                {rentalDays}
                                            </span>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="h-9 w-9"
                                                onClick={() => handleRentalDaysChange(1)}
                                            >
                                                <FontAwesomeIcon icon={faPlus} className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="bg-border shrink-0 h-px w-full" />

                                    {/* Date Display */}
                                    <div className="grid sm:grid-cols-2 gap-4">
                                        <div className="p-4 rounded-lg bg-surface/50 border border-border">
                                            <div className="flex items-center gap-2 mb-2">
                                                <FontAwesomeIcon icon={faCalendarDays} className="h-4 w-4 text-primary" />
                                                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                                    Ngày nhận
                                                </span>
                                            </div>
                                            <p className="text-sm font-semibold text-foreground">{formatDate(startDate)}</p>
                                        </div>
                                        <div className="p-4 rounded-lg bg-surface/50 border border-border">
                                            <div className="flex items-center gap-2 mb-2">
                                                <FontAwesomeIcon icon={faCalendarDays} className="h-4 w-4 text-primary" />
                                                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                                    Ngày trả
                                                </span>
                                            </div>
                                            <p className="text-sm font-semibold text-foreground">{formatDate(endDate)}</p>
                                        </div>
                                    </div>

                                    {/* Quick Duration Options */}
                                    <div className="flex flex-wrap gap-2">
                                        {[1, 3, 5, 7, 14].map((days) => (
                                            <Button
                                                key={days}
                                                variant={rentalDays === days ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => setRentalDays(days)}
                                                className={[
                                                    "text-xs",
                                                    rentalDays === days && "bg-primary text-primary-foreground",
                                                ].filter(Boolean).join(' ')}
                                            >
                                                {days} ngày
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Delivery Options */}
                        <Card className="border-border transform transition-transform duration-200 hover:-translate-y-1 hover:shadow-lg">
                            <CardContent className="p-6">
                                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                                    <FontAwesomeIcon icon={faTruck} className="h-5 w-5 text-primary" />
                                    Phương thức nhận hàng
                                </h3>

                                <RadioGroup
                                    value={deliveryOption}
                                    onValueChange={setDeliveryOption}
                                    className="space-y-3"
                                >
                                    <label
                                        htmlFor="delivery"
                                        className={[
                                            "flex items-start gap-4 p-4 rounded-lg border cursor-pointer transition-colors",
                                            deliveryOption === "delivery" ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary/50" : "border-border hover:bg-surface/50",
                                        ].filter(Boolean).join(' ')}
                                    >
                                        <RadioGroupItem value="delivery" id="delivery" className="mt-0.5" />
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
                                        <RadioGroupItem value="pickup" id="pickup" className="mt-0.5" />
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
                                </RadioGroup>

                                {deliveryOption === "delivery" && (
                                    <div className="mt-4 space-y-3">
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <FontAwesomeIcon icon={faMapMarkerAlt} className="h-4 w-4" />
                                            <span>Địa chỉ giao hàng</span>
                                        </div>
                                        <Input
                                            placeholder="Nhập địa chỉ giao hàng của bạn"
                                            className="bg-background"
                                        />
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Additional Items */}
                        <Card className="border-border transform transition-transform duration-200 hover:-translate-y-1 hover:shadow-lg">
                            <CardContent className="p-6">
                                <h3 className="text-lg font-semibold text-foreground mb-4">
                                    Có thể bạn cũng thích
                                </h3>
                                <div className="grid sm:grid-cols-2 gap-4">
                                    {additionalItems.map((addItem) => (
                                        <div
                                            key={addItem.id}
                                            className="flex items-center gap-3 p-3 rounded-lg border border-border bg-white transition-colors duration-200 hover:bg-primary/10 cursor-pointer"
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
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column - Order Summary */}
                    <div>
                        <div className="sticky top-24">
                            <Card className="border-border shadow-lg transform transition-transform duration-200 hover:-translate-y-1 hover:shadow-2xl">
                                <CardContent className="p-6">
                                    <div className="flex items-center gap-2 mb-4">
                                        <div variant="secondary" className="bg-primary/10 text-sm border-0">
                                            Giá đã bao gồm tất cả phí
                                        </div>
                                    </div>

                                    <h3 className="text-xl font-semibold text-foreground mb-6">
                                        Tóm tắt đơn hàng
                                    </h3>

                                    <div className="space-y-3 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">
                                                {item.name} × {item.quantity}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">
                                                {formatCurrency(item.pricePerDay)} × {rentalDays} ngày
                                            </span>
                                            <span className="font-medium text-foreground">{formatCurrency(subtotal)}</span>
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
                                                {formatCurrency(item.originalPrice * item.quantity)}
                                            </span>
                                            <span className="text-2xl font-bold text-primary">{formatCurrency(total)}</span>
                                        </div>
                                    </div>

                                    <Button className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground">
                                        Đặt thuê ngay
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
                                </CardContent>
                            </Card>

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
            </main>
            <Footer />
        </div>
    )
}
