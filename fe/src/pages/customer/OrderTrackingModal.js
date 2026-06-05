"use client"

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTruck, faCheckCircle, faMapMarkerAlt, faPhone } from '@fortawesome/free-solid-svg-icons'

const trackingSteps = [
    {
        id: 1,
        title: "Đơn hàng đã được xác nhận",
        description: "Đơn hàng của bạn đã được xác nhận và đang chuẩn bị",
        time: "09:30",
        date: "28/05/2026",
        completed: true,
        current: false,
    },
    {
        id: 2,
        title: "Đang chuẩn bị hàng",
        description: "Trang phục đang được kiểm tra và đóng gói cẩn thận",
        time: "11:45",
        date: "28/05/2026",
        completed: true,
        current: false,
    },
    {
        id: 3,
        title: "Đã giao cho đơn vị vận chuyển",
        description: "Đơn hàng đã được bàn giao cho Giao Hàng Nhanh",
        time: "14:20",
        date: "28/05/2026",
        completed: true,
        current: false,
    },
    {
        id: 4,
        title: "Đang vận chuyển",
        description: "Đơn hàng đang trên đường giao đến bạn",
        time: "08:15",
        date: "29/05/2026",
        completed: false,
        current: true,
    },
    {
        id: 5,
        title: "Giao hàng thành công",
        description: "Đơn hàng đã được giao đến địa chỉ của bạn",
        time: "",
        date: "",
        completed: false,
        current: false,
    },
]

const shipperInfo = {
    name: "Nguyễn Văn Minh",
    phone: "0901 234 567",
    vehicle: "59-X1 12345",
}

export function OrderTrackingModal({ open, onOpenChange, order }) {
    if (!order || !open) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => onOpenChange(false)}>
            <div
                className="relative w-full max-w-md sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-lg bg-background p-6 shadow-lg"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="mb-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="font-serif text-xl font-semibold text-foreground">Theo dõi đơn hàng</h2>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Mã đơn: {order.id}
                            </p>
                        </div>
                        <button onClick={() => onOpenChange(false)} className="text-muted-foreground hover:text-foreground text-2xl leading-none">
                            &times;
                        </button>
                    </div>
                </div>

                {/* Current Status Banner */}
                <div className="rounded-lg bg-[oklch(0.92_0.03_130)] p-4 ">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[oklch(0.78_0.06_130)]">
                            <FontAwesomeIcon icon={faTruck} className="h-4 w-4 text-white" />
                        </div>
                        <div>
                            <p className="font-medium text-foreground">Đang vận chuyển</p>
                            <p className="text-sm text-muted-foreground">Dự kiến giao: Hôm nay, 14:00 - 18:00</p>
                        </div>
                    </div>
                </div>

                {/* Shipper Info */}
                <div className="rounded-lg border border-border p-4 my-2">
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
                <div className="flex items-start gap-3 rounded-lg border border-border p-4">
                    <FontAwesomeIcon icon={faMapMarkerAlt} className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <div>
                        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                            Địa chỉ giao hàng
                        </p>
                        <p className="mt-1 text-sm text-foreground">{order.address}</p>
                    </div>
                </div>

                {/* Tracking Timeline */}
                <div className="mt-2">
                    <p className="mb-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
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
            </div>
        </div>
    )
}
