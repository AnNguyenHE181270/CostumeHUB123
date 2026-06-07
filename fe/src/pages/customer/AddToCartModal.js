import { useState, useEffect } from "react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faShoppingCart, faBox, faCalendarDays } from "@fortawesome/free-solid-svg-icons"
import { useCart } from '../../context/CartContext'
import QuantitySelector from "../../components/ui/QuantitySelector"
import Modal from "../../components/Modal"
import { formatPrice } from "../../utils/formatters"
export function AddToCartModal({ open, onOpenChange, costume, showToast }) {
    const { addToCart } = useCart()
    const [isSubmitting, setIsSubmitting] = useState(false)

    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowStr = tomorrow.toISOString().split('T')[0]

    const dayAfter = new Date()
    dayAfter.setDate(dayAfter.getDate() + 2)
    const dayAfterStr = dayAfter.toISOString().split('T')[0]

    // Lấy danh sách tất cả các variant
    let allVariants = [];
    if (costume?.variants && costume.variants.length > 0) {
        allVariants = costume.variants;
    } else if (costume?.size) {
        allVariants = [{ size: costume.size, availableStock: costume?.availableStock ?? costume?.stock ?? 1 }];
    } else {
        allVariants = [{ size: "M", availableStock: 1 }];
    }

    const availableSizes = allVariants.filter(v => (v.availableStock ?? v.stock ?? 0) > 0).map(v => v.size);

    const [formData, setFormData] = useState({
        size: availableSizes.length > 0 ? availableSizes[0] : "",
        quantity: 1,
        startDate: tomorrowStr,
        endDate: dayAfterStr
    })

    useEffect(() => {
        if (open) {
            setFormData({
                size: availableSizes.length > 0 ? availableSizes[0] : "",
                quantity: 1,
                startDate: tomorrowStr,
                endDate: dayAfterStr
            })
        }
    }, [open, costume?._id])

    const handleSubmit = async () => {
        if (!formData.size || !formData.startDate || !formData.endDate) return

        setIsSubmitting(true)

        const startObj = new Date(formData.startDate);
        const endObj = new Date(formData.endDate);
        let diffDays = Math.ceil((endObj - startObj) / (1000 * 60 * 60 * 24));
        if (diffDays <= 0) diffDays = 1;

        const res = await addToCart(
            costume,
            { size: formData.size },
            formData.quantity,
            formData.startDate,
            formData.endDate,
            diffDays
        );

        setIsSubmitting(false)
        if (res && res.success === false) {
            alert(res.message || "Lỗi khi thêm vào giỏ hàng");
            return;
        }
        if (showToast) showToast("Đã thêm vào giỏ hàng");
        resetForm()
        onOpenChange(false)
    }

    const resetForm = () => {
        setFormData({
            size: availableSizes.length > 0 ? availableSizes[0] : "",
            quantity: 1,
            startDate: tomorrowStr,
            endDate: dayAfterStr,
        })
    }

    const handleClose = () => {
        resetForm()
        onOpenChange(false)
    }


    const isFormValid = formData.size && formData.startDate && formData.endDate

    const currentSelectedVariant = allVariants.find(v => v.size === formData.size);
    const maxStock = currentSelectedVariant ? (currentSelectedVariant.availableStock ?? currentSelectedVariant.stock ?? 0) : 0;

    return (
        <Modal isOpen={open} onClose={handleClose} title="Thêm vào giỏ hàng">
            <div className="overflow-y-auto max-h-[calc(90vh-180px)] px-4">
                {/* Product Preview */}
                <div className="flex gap-4 rounded-lg mb-5">
                    <div className="h-20 w-16 shrink-0 rounded-lg overflow-hidden bg-[oklch(0.92_0.03_130)] flex items-center justify-center">
                        {costume?.images?.[0] ? (
                            <img src={costume.images[0]} alt={costume.name} className="h-full w-full object-cover" crossOrigin="anonymous" />
                        ) : (
                            <FontAwesomeIcon icon={faBox} className="h-6 w-6 text-[oklch(0.7_0.04_130)]" />
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="font-serif text-md font-medium text-foreground line-clamp-2">
                            {costume?.name}
                        </h3>
                        <span className="text-muted-foreground text-xs">{formatPrice(costume.price)}</span>
                        <p className="mt-1 text-md font-semibold text-foreground">
                            {formatPrice(costume.rentalPerDay || 0)}/ngày
                        </p>
                    </div>
                </div>

                <div className="space-y-5">
                    {/* Size Selection */}
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                            Kích thước <span className="text-red-500">*</span>
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {availableSizes.length === 0 && (
                                <span className="text-sm text-red-500 font-medium py-2">Tất cả kích thước đã hết hàng</span>
                            )}
                            {allVariants.map((variant) => {
                                const size = variant.size;
                                const isOutOfStock = (variant.availableStock ?? variant.stock ?? 0) <= 0;
                                return (
                                    <button
                                        type="button"
                                        key={size}
                                        disabled={isOutOfStock}
                                        onClick={() => setFormData(prev => ({ ...prev, size, quantity: 1 }))}
                                        className={`h-10 min-w-[40px] rounded-lg border px-3 text-sm font-medium transition-all ${isOutOfStock
                                            ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                                            : formData.size === size
                                                ? "border-black bg-black text-white"
                                                : "border-border text-foreground hover:border-gray-400"
                                            }`}
                                    >
                                        {size}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Rental Period */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                                Ngày bắt đầu thuê <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <FontAwesomeIcon icon={faCalendarDays} className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <input
                                    type="date"
                                    value={formData.startDate}
                                    min={tomorrowStr}
                                    onChange={(e) => {
                                        const newStart = e.target.value;
                                        setFormData(prev => {
                                            const updates = { startDate: newStart };
                                            if (prev.endDate && new Date(newStart) > new Date(prev.endDate)) {
                                                updates.endDate = newStart;
                                            }
                                            return { ...prev, ...updates };
                                        });
                                    }}
                                    className="h-10 w-full rounded-lg border pl-10 pr-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                                Ngày kết thúc thuê <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <FontAwesomeIcon icon={faCalendarDays} className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <input
                                    type="date"
                                    value={formData.endDate}
                                    min={formData.startDate || tomorrowStr}
                                    onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                                    className="h-10 w-full rounded-lg border pl-10 pr-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Quantity */}
                    <div className="flex justify-between items-center">
                        <label className="block text-sm font-medium text-foreground mt-1">
                            Số lượng
                            {formData.size && (
                                <span className="text-muted-foreground text-xs ml-1">(Còn {maxStock})</span>
                            )}
                        </label>
                        <QuantitySelector
                            label={null}
                            quantity={formData.quantity}
                            onDecrease={() => setFormData(prev => ({ ...prev, quantity: Math.max(1, prev.quantity - 1) }))}
                            onIncrease={() => setFormData(prev => {
                                const selectedVariant = allVariants.find(v => v.size === prev.size);
                                const maxStock = selectedVariant ? (selectedVariant.availableStock ?? selectedVariant.stock ?? 1) : 1;
                                return { ...prev, quantity: Math.min(maxStock, prev.quantity + 1) };
                            })}
                        />
                    </div>
                </div>
                <div className="flex gap-3 mt-4">
                    <button
                        type="button"
                        onClick={handleClose}
                        className="flex-1 rounded-lg border px-4 py-2 text-sm font-medium"
                    >
                        Hủy
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={!isFormValid || isSubmitting}
                        className={`flex-1 flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${isFormValid && !isSubmitting
                            ? "bg-black text-white hover:bg-black/60"
                            : "bg-muted text-muted-foreground cursor-not-allowed"
                            }`}
                    >
                        <FontAwesomeIcon icon={faShoppingCart} className="h-4 w-4" />
                        {isSubmitting ? "Đang thêm..." : "Thêm vào giỏ"}
                    </button>
                </div>
            </div>

            {/* Footer */}

        </Modal>
    )
}
