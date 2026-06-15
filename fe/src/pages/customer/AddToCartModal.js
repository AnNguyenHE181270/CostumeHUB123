import { useState, useEffect } from "react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faShoppingCart, faBox, faCalendarDays } from "@fortawesome/free-solid-svg-icons"
import { useCart } from '../../context/CartContext'
import CustomDateRangePicker from "../../components/ui/CustomDateRangePicker"
import QuantitySelector from "../../components/ui/QuantitySelector"
import Modal from "../../components/Modal"
import { formatPrice, getRentalDays } from "../../utils/formatters"
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
    const [selectedPackage, setSelectedPackage] = useState(null)
    const [dateRange, setDateRange] = useState([{
        startDate: new Date(tomorrowStr),
        endDate: new Date(dayAfterStr),
        key: 'selection'
    }])

    useEffect(() => {
        if (open) {
            setFormData({
                size: availableSizes.length > 0 ? availableSizes[0] : "",
                quantity: 1,
                startDate: tomorrowStr,
                endDate: dayAfterStr
            })
            setDateRange([{
                startDate: new Date(tomorrowStr),
                endDate: new Date(dayAfterStr),
                key: 'selection'
            }])
            setSelectedPackage(null)
        }
    }, [open, costume?._id])

    // Đồng bộ highlight lịch khi user bấm các nút Gói 3 ngày, 7 ngày...
    useEffect(() => {
        if (formData.startDate && formData.endDate) {
            setDateRange([{
                startDate: new Date(formData.startDate),
                endDate: new Date(formData.endDate),
                key: 'selection'
            }]);
        }
    }, [formData.startDate, formData.endDate]);

    const handleSubmit = async () => {
        if (!formData.size || !formData.startDate || !formData.endDate) return
        setIsSubmitting(true)
        let diffDays = getRentalDays(formData.startDate, formData.endDate)
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
        setDateRange([{
            startDate: new Date(tomorrowStr),
            endDate: new Date(dayAfterStr),
            key: 'selection'
        }])
    }

    const handleClose = () => {
        resetForm()
        onOpenChange(false)
    }

    const handleSelectDateRange = (ranges) => {
        const { selection } = ranges;
        setDateRange([selection]);

        // Tránh lỗi lệch Timezone khi convert sang String
        const formatLocal = (date) => {
            const d = new Date(date);
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        };

        setFormData(prev => ({
            ...prev,
            startDate: formatLocal(selection.startDate),
            endDate: formatLocal(selection.endDate)
        }));
        setSelectedPackage(null);
    };

    const isFormValid = formData.size && formData.startDate && formData.endDate

    const currentSelectedVariant = allVariants.find(v => v.size === formData.size);
    const maxStock = currentSelectedVariant ? (currentSelectedVariant.availableStock ?? currentSelectedVariant.stock ?? 0) : 0;

    let diffDays = getRentalDays(formData.startDate, formData.endDate);

    let calculatedPrice = costume?.pricePerDay || costume?.price || 0;

    return (
        <Modal isOpen={open} onClose={handleClose} title="Thêm vào giỏ hàng">
            <div className="overflow-y-auto max-h-[calc(90vh-180px)] px-2 sm:px-4 select-none">
                {/* Product Preview */}
                <div className="flex gap-4 rounded-xl border border-[#eaeaea] p-1 mb-6 bg-[#faf9f7] shadow-sm">
                    <div className="h-24 w-20 shrink-0 overflow-hidden rounded-lg flex items-center justify-center bg-white border border-[#eaeaea]">
                        {costume?.images?.[0] ? (
                            <img src={costume.images[0]} alt={costume.name} className="h-full w-full object-cover" />
                        ) : (
                            <FontAwesomeIcon icon={faBox} className="h-6 w-6 text-[#ccc]" />
                        )}
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <h3 className="text-lg font-bold text-[#1a1a1a] line-clamp-2 leading-tight mb-1" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                            {costume?.name}
                        </h3>
                        <p className="text-[14px] font-medium text-[#f94a00]"> {formatPrice(calculatedPrice)} </p>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Size Selection */}
                    <div>
                        <label className="block text-[12px] uppercase tracking-[0.05em] font-semibold text-[#1a1a1a] mb-3">
                            Kích thước <span className="text-red-500">*</span>
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {availableSizes.length === 0 && (
                                <span className="text-sm text-red-500 font-medium py-2">Tất cả kích thước đã hết hàng</span>
                            )}
                            {allVariants.map((variant) =>
                                <button
                                    type="button"
                                    key={variant.size}
                                    disabled={(variant.availableStock ?? variant.stock ?? 0) <= 0}
                                    onClick={() => setFormData(prev => ({ ...prev, size: variant.size, quantity: 1 }))}
                                    className={`h-10 min-w-[45px] rounded-lg border px-4 text-[13px] font-medium transition-all ${(variant.availableStock ?? variant.stock ?? 0) <= 0
                                        ? "bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed"
                                        : formData.size === variant.size
                                            ? "border-[#1a1a1a] bg-[#1a1a1a] text-white shadow-md"
                                            : "border-[#eaeaea] bg-white text-[#1a1a1a] hover:border-[#1a1a1a]"
                                        }`}
                                >
                                    {variant.size}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Rental Period */}
                    <div>
                        <label className="block text-[12px] uppercase tracking-[0.05em] font-semibold text-[#1a1a1a] mb-3">
                            Thời gian thuê <span className="text-red-500">*</span>
                        </label>

                        <CustomDateRangePicker
                            dateRange={dateRange}
                            onChange={handleSelectDateRange}
                            minDate={new Date(tomorrowStr)}
                        />

                        <div className="flex flex-wrap gap-2 mt-4">
                            <button
                                type="button"
                                onClick={() => {
                                    const start = new Date(formData.startDate);
                                    const end = new Date(start);
                                    end.setDate(end.getDate() + 0);
                                    setFormData(prev => ({ ...prev, endDate: end.toISOString().split('T')[0] }));
                                    setSelectedPackage(1);
                                }}
                                className={`px-4 py-2 border text-[12px] font-medium rounded-lg transition-all ${selectedPackage === 1 ? 'border-[#1a1a1a] bg-[#1a1a1a] text-white shadow-md' : 'border-[#eaeaea] bg-white text-[#1a1a1a] hover:border-[#1a1a1a] hover:bg-[#fafafa]'}`}>Thuê lẻ 1 ngày</button>
                            <button
                                type="button"
                                onClick={() => {
                                    const start = new Date(formData.startDate);
                                    const end = new Date(start);
                                    end.setDate(end.getDate() + 2);
                                    setFormData(prev => ({ ...prev, endDate: end.toISOString().split('T')[0] }));
                                    setSelectedPackage(3);
                                }}
                                className={`px-4 py-2 border text-[12px] font-medium rounded-lg transition-all ${selectedPackage === 3 ? 'border-[#1a1a1a] bg-[#1a1a1a] text-white shadow-md' : 'border-[#eaeaea] bg-white text-[#1a1a1a] hover:border-[#1a1a1a] hover:bg-[#fafafa]'}`}>Gói 3 ngày</button>
                            <button
                                type="button"
                                onClick={() => {
                                    const start = new Date(formData.startDate);
                                    const end = new Date(start);
                                    end.setDate(end.getDate() + 6);
                                    setFormData(prev => ({ ...prev, endDate: end.toISOString().split('T')[0] }));
                                    setSelectedPackage(7);
                                }}
                                className={`px-4 py-2 border text-[12px] font-medium rounded-lg transition-all ${selectedPackage === 7 ? 'border-[#1a1a1a] bg-[#1a1a1a] text-white shadow-md' : 'border-[#eaeaea] bg-white text-[#1a1a1a] hover:border-[#1a1a1a] hover:bg-[#fafafa]'}`}>Gói 1 tuần</button>
                        </div>
                        <p className="text-[12px] text-[#f94a00] font-medium italic mt-3 bg-[#fff5f0] p-2 rounded-lg border border-[#ffe5d9]">
                            * Gợi ý: Chọn các gói dịch vụ có sẵn để nhận mức giá ưu đãi hơn.
                        </p>
                    </div>

                    {/* Quantity */}
                    <div className="flex justify-between items-center">
                        <label className="block text-[12px] uppercase tracking-[0.05em] font-semibold text-[#1a1a1a]">
                            Số lượng
                            {formData.size && (
                                <span className="text-[#666] normal-case tracking-normal ml-2 font-medium">(Còn lại {maxStock})</span>
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
                <div className="flex gap-3 mt-8 pb-4">
                    <button
                        type="button"
                        onClick={handleClose}
                        className="flex-1 rounded-xl border border-[#eaeaea] bg-white px-4 py-3.5 text-[13px] uppercase tracking-[0.08em] font-bold text-[#555] hover:bg-[#fafafa] transition-colors"
                    >
                        Hủy
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={!isFormValid || isSubmitting}
                        className={`flex-[2] flex items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-[13px] uppercase tracking-[0.08em] font-bold transition-all ${isFormValid && !isSubmitting
                            ? "bg-[#1a1a1a] text-white hover:bg-[#333] shadow-md"
                            : "bg-[#e8e8e8] text-[#999] cursor-not-allowed"
                            }`}
                    >
                        <FontAwesomeIcon icon={faShoppingCart} className="text-[14px]" />
                        {isSubmitting ? "Đang thêm..." : "Thêm vào giỏ"}
                    </button>
                </div>
            </div>

            {/* Footer */}

        </Modal>
    )
}
