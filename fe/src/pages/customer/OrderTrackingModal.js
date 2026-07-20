import { useState, useEffect } from "react"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTruck, faBox, faCheckCircle, faMapMarkerAlt, faCircleXmark } from '@fortawesome/free-solid-svg-icons'
import Modal from "../../components/Modal"
import rentalService from "../../services/rental.service"
import { formatPrice } from "../../utils/formatters"

const STEP_DEFINITIONS = [
    {
        id: 1,
        status: "pending",
        title: "Đang chuẩn bị hàng",
        description: "Trang phục đang được kiểm tra và đóng gói cẩn thận",
    },
    {
        id: 2,
        status: "delivering",
        title: "Đang vận chuyển",
        description: "Đơn hàng đang trên đường giao đến bạn",
    },
    {
        id: 3,
        status: "delivered",
        title: "Giao hàng thành công",
        description: "Đơn hàng đã được giao đến địa chỉ của bạn",
    },
    {
        id: 4,
        status: "returning",
        title: "Đã gửi yêu cầu trả hàng",
        description: "Đang chờ cửa hàng nhận lại và kiểm tra trang phục",
    },
    {
        id: 5,
        status: "completed",
        title: "Hoàn tất trả hàng",
        description: "Cửa hàng đã kiểm tra xong, đơn thuê đã hoàn tất",
    },
]

// Nhãn hiển thị ở banner trạng thái hiện tại — tách riêng khỏi các mốc trên timeline
// vì renting/overdue không có mốc riêng (vẫn coi là "đã giao hàng, đang dùng") nhưng cần
// dòng chữ khác nhau để khách phân biệt được đang thuê hay đã quá hạn trả.
const CURRENT_STATUS_LABEL = {
    pending: "Đang chuẩn bị hàng",
    delivering: "Đang vận chuyển",
    delivered: "Giao hàng thành công",
    renting: "Đang sử dụng dịch vụ",
    overdue: "Đã quá hạn trả — vui lòng trả sớm",
    returning: "Đã gửi yêu cầu trả hàng",
    completed: "Hoàn tất trả hàng",
    cancelled: "Đơn hàng đã hủy",
}

const CURRENT_STATUS_SUBTITLE = {
    pending: "Trang phục đang được chuẩn bị và kiểm tra kỹ lưỡng",
    delivering: "Đơn hàng đang trên đường giao đến bạn",
    delivered: "Đơn hàng đã được giao thành công",
    renting: "Đơn hàng đã được giao thành công",
    overdue: "Vui lòng hoàn trả trang phục cho cửa hàng",
    returning: "Đang chờ cửa hàng nhận lại và kiểm tra trang phục",
    completed: "Giao dịch đã hoàn tất thành công",
    cancelled: "Đơn hàng đã bị hủy",
}

function getTrackingSteps(status) {
    let currentStep = 0;
    if (status === 'pending') currentStep = 1;
    else if (status === 'delivering') currentStep = 2;
    else if (['delivered', 'renting', 'overdue'].includes(status)) currentStep = 3;
    else if (status === 'returning') currentStep = 4;
    else if (status === 'completed') currentStep = 5;

    return STEP_DEFINITIONS.map((step) => ({
        ...step,
        completed: step.id < currentStep,
        current: step.id === currentStep,
    }))
}


export function OrderTrackingModal({ open, onOpenChange, order }) {
    const [showAllItems, setShowAllItems] = useState(false)
    const [estimatedDate, setEstimatedDate] = useState(null)

    const status = order?.status
    const districtId = order?.shippingAddress?.districtId
    const wardCode = order?.shippingAddress?.wardCode
    const isPickupAtStore = order?.shippingAddress?.addressDetail === "Nhận tại cửa hàng"

    // Gọi API ước tính giao hàng thật (GHN) thay vì hiển thị khung giờ bịa cố định —
    // chỉ cần thiết khi đơn còn CHƯA giao tới (pending/delivering) và có địa chỉ giao thật.
    useEffect(() => {
        if (!open || isPickupAtStore || !districtId || !wardCode || !['pending', 'delivering'].includes(status)) {
            setEstimatedDate(null);
            return;
        }
        let cancelled = false;
        rentalService.estimateDelivery(districtId, wardCode)
            .then((res) => { if (!cancelled) setEstimatedDate(res?.estimatedDeliveryDate || null); })
            .catch(() => { if (!cancelled) setEstimatedDate(null); });
        return () => { cancelled = true; };
    }, [open, isPickupAtStore, districtId, wardCode, status]);

    if (!order) return null

    const trackingSteps = getTrackingSteps(status)
    const currentStepTitle = CURRENT_STATUS_LABEL[status] ?? "Đang xử lý"
    const statusSubtitle = ['pending', 'delivering'].includes(status) && estimatedDate
        ? `Dự kiến giao: ${new Date(estimatedDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}`
        : CURRENT_STATUS_SUBTITLE[status] ?? "Đang cập nhật hành trình"

    const items = Array.isArray(order.items)
        ? order.items
        : order.items
            ? [order.items]
            : []

    const hasMoreItems = items.length > 1

    return (
        <Modal isOpen={open} onClose={() => onOpenChange(false)} title={`Theo dõi đơn hàng`}>
            <div className="space-y-3">
                {(showAllItems ? items : items.slice(0, 1)).map((item, index) => (
                    <div key={index} className="flex gap-4">
                        <div className="h-16 w-12 shrink-0 rounded-lg bg-[oklch(0.92_0.03_130)] flex items-center justify-center overflow-hidden border">
                            {(item.costume?.images?.[0] || item.image) ? (
                                <img
                                    src={item.costume?.images?.[0] || item.image}
                                    alt={item.costume?.name || item.costumeName}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <FontAwesomeIcon icon={faBox} className="h-8 w-8 text-[oklch(0.7_0.04_130)]" />
                            )}
                        </div>
                        <div className="flex-1">
                            <h3
                                className="text-lg font-bold"
                                style={{ fontFamily: "'Cormorant Garamond', serif" }}
                            >
                                {item.costume?.name || item.costumeName}
                            </h3>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground mt-1">Size: {item.size}</p>
                                </div>
                                {item.quantity != null && (
                                    <span className="text-sm text-muted-foreground">x {item.quantity}</span>
                                )}
                            </div>
                        </div>
                    </div>
                ))}

                {hasMoreItems && (
                    <button
                        type="button"
                        onClick={() => setShowAllItems((prev) => !prev)}
                        className="w-full text-sm font-medium text-primary transition-colors hover:text-primary/80"
                    >
                        {showAllItems ? "Ẩn bớt" : `Xem thêm (${items.length - 1} sản phẩm khác)`}
                    </button>
                )}
            </div>
            <div className="rounded-lg bg-[oklch(0.92_0.03_130)] p-3 mt-2">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[oklch(0.78_0.06_130)]">
                        <FontAwesomeIcon icon={faTruck} className="h-4 w-4 text-white" />
                    </div>
                    <div>
                        <p className="font-medium text-foreground">{currentStepTitle}</p>
                        <p className="text-sm text-muted-foreground">{statusSubtitle}</p>
                    </div>
                </div>
            </div>

            {/* Delivery Address */}
            <div className="flex items-start gap-3 rounded-lg border border-border p-3">
                <FontAwesomeIcon icon={faMapMarkerAlt} className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Địa chỉ giao hàng
                    </p>
                    <p className="mt-1 text-sm text-foreground">
                        {order.shippingAddress 
                            ? [order.shippingAddress.addressDetail, order.shippingAddress.ward, order.shippingAddress.district, order.shippingAddress.province].filter(Boolean).join(', ')
                            : (order.address || "Chưa cập nhật")
                        }
                    </p>
                </div>
            </div>

            {/* Đơn đã hủy: không hiển thị timeline tuyến tính (vốn thiết kế cho luồng thành công) —
                thay bằng khối trạng thái kết thúc riêng, tránh hai vùng trong cùng modal nói hai điều trái ngược. */}
            {status === 'cancelled' ? (
                <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-center">
                    <FontAwesomeIcon icon={faCircleXmark} className="h-8 w-8 text-red-500 mb-2" />
                    <p className="font-semibold text-red-700">Đơn hàng đã bị hủy</p>
                    {order.cancelReason && (
                        <p className="mt-1 text-sm text-red-600">Lý do: {order.cancelReason}</p>
                    )}
                    {order.refundAmount > 0 && (
                        <p className="mt-2 text-sm text-foreground">
                            Số tiền đã hoàn: <span className="font-semibold">{formatPrice(order.refundAmount)}</span>
                        </p>
                    )}
                </div>
            ) : (
            <div className="mt-6">
                <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Hành trình đơn hàng
                </p>
                <div className="space-y-0">
                    {trackingSteps.map((step, index) => (
                        <div key={step.id} className="relative flex gap-4">
                            {/* Timeline Line */}
                            {index < trackingSteps.length - 1 && (
                                <div
                                    className={
                                        "absolute left-[11px] top-6 h-full w-0.5 " +
                                        (step.completed ? "bg-[oklch(0.78_0.06_130)]" : "bg-border")
                                    }
                                />
                            )}

                            {/* Timeline Dot */}
                            <div className="relative z-10">
                                <div
                                    className={
                                        "flex h-6 w-6 items-center justify-center rounded-full " +
                                        (step.completed
                                            ? "bg-[oklch(0.78_0.06_130)]"
                                            : step.current
                                                ? "border-2 border-[oklch(0.78_0.06_130)] bg-background"
                                                : "border-2 border-border bg-background")
                                    }
                                >
                                    {step.completed ? (
                                        <FontAwesomeIcon icon={faCheckCircle} className="h-3.5 w-3.5 text-white" />
                                    ) : step.current ? (
                                        <div className="h-2 w-2 rounded-full bg-[oklch(0.78_0.06_130)]" />
                                    ) : (
                                        <div className="h-2 w-2 rounded-full bg-muted" />
                                    )}
                                </div>
                            </div>

                            {/* Content */}
                            <div className="flex-1 pb-6">
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <p
                                            className={
                                                "font-medium " +
                                                (step.completed || step.current
                                                    ? "text-foreground"
                                                    : "text-muted-foreground")
                                            }
                                        >
                                            {step.title}
                                        </p>
                                        <p className="mt-0.5 text-sm text-muted-foreground">
                                            {step.description}
                                        </p>
                                    </div>
                                    {step.time && (
                                        <div className="shrink-0 text-right">
                                            <p className="text-sm font-medium text-foreground">{step.time}</p>
                                            <p className="text-xs text-muted-foreground">{step.date}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            )}
        </Modal>
    )
}
