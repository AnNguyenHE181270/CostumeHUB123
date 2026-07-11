import { useState } from "react"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTruck, faBox, faCheckCircle, faMapMarkerAlt, faPhone } from '@fortawesome/free-solid-svg-icons'
import Modal from "../../components/Modal"

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
]

function getTrackingSteps(status) {
    let currentStep = 0;
    if (status === 'pending') currentStep = 1;
    else if (status === 'delivering') currentStep = 2;
    else if (['renting', 'returning', 'completed', 'overdue'].includes(status)) currentStep = 4;

    return STEP_DEFINITIONS.map((step) => ({
        ...step,
        completed: step.id < currentStep,
        current: step.id === currentStep,
    }))
}


const shipperInfo = {
    name: "Nguyễn Văn Minh",
    phone: "0901 234 567",
    vehicle: "59-X1 12345",
}

export function OrderTrackingModal({ open, onOpenChange, order }) {
    const [showAllItems, setShowAllItems] = useState(false)
    if (!order) return null

    const status = order.status
    const trackingSteps = getTrackingSteps(status)
    const currentStepTitle = STEP_DEFINITIONS.find(s => s.status === status)?.title ?? "Đang xử lý"

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
                        <p className="text-sm text-muted-foreground">Dự kiến giao: Hôm nay, 14:00 - 18:00</p>
                    </div>
                </div>
            </div>

            {/* Shipper Info */}
            <div className="rounded-lg border border-border p-3 my-2">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Nhân viên giao hàng
                </p>
                <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                            <span className="text-sm font-medium text-foreground">NM</span>
                        </div>
                        <div>
                            <p className="font-medium text-foreground">{shipperInfo.name}</p>
                            <p className="text-sm text-muted-foreground">{shipperInfo.vehicle}</p>
                        </div>
                    </div>
                    <a
                        href={`tel:${shipperInfo.phone.replace(/\s/g, "")}`}
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-primary/90"
                    >
                        <FontAwesomeIcon icon={faPhone} className="h-4 w-4" />
                    </a>
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

            {/* Tracking Timeline */}
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
        </Modal>
    )
}
