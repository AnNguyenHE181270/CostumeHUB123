import Button from '../Button'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCalendarDays, faLocationDot } from '@fortawesome/free-solid-svg-icons'
import { useNavigate } from 'react-router-dom'

const statusConfig = {
    delivering: {
        label: "Đang giao",
        className: "bg-blue-50 text-blue-700 border-blue-200"
    },
    rented: {
        label: "Đang thuê",
        className: "bg-[oklch(0.92_0.03_130)] text-[oklch(0.35_0.06_130)] border-[oklch(0.85_0.05_130)]"
    },
    completed: {
        label: "Hoàn thành",
        className: "bg-[oklch(0.92_0.03_130)] text-[oklch(0.35_0.06_130)] border-[oklch(0.85_0.05_130)]"
    },
    cancelled: {
        label: "Đã hủy",
        className: "bg-red-50 text-red-700 border-red-200"
    }
}

// Ảnh mặc định khi sản phẩm không có ảnh

function OrderCard({ order }) {
    const status = statusConfig[order.status]
    const navigate = useNavigate()

    return (
        <div className="group overflow-hidden rounded-xl border border-border bg-card transition-all hover:border-muted-foreground/30 hover:shadow-sm">
            <div className="flex flex-col sm:flex-row">
                {/* Product Image */}
                <div className="relative h-40 w-full shrink-0 bg-slate-50 sm:h-auto sm:w-32 overflow-hidden border-r border-border">
                    <img
                        src={order.productImage}
                        alt={order.productName}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"

                    />
                </div>

                {/* Content */}
                <div className="flex flex-1 flex-col p-4 sm:p-5">
                    {/* Header */}
                    <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                    {order.id}
                                </span>
                                <span className={
                                    "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium " +
                                    status.className
                                }>
                                    {status.label}
                                </span>
                            </div>
                            <h3 className="font-serif text-lg font-medium text-foreground">
                                {order.productName}
                            </h3>
                        </div>
                        <div className="text-right">
                            <p className="text-lg font-semibold text-foreground">{order.totalPrice}</p>
                            <p className="text-xs text-muted-foreground">Thuê {order.rentalPeriod}</p>
                        </div>
                    </div>

                    {/* Details */}
                    <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                            <FontAwesomeIcon
                                icon={faCalendarDays}
                                className="h-4 w-4 text-white fill-black stroke-black stroke-[16px]"
                            />
                            <span className="ml-2 text-slate-700">{order.startDate} - {order.endDate}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <FontAwesomeIcon
                                icon={faLocationDot}
                                className="h-4 w-4 text-white fill-black stroke-black stroke-[16px]"
                            />
                            <span className="truncate max-w-[200px]">{order.address}</span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                        <div className="flex gap-2">
                            {order.status === "delivering" && (
                                <Button onClick={() => navigate(`/order-detail/${order.id}`)}
                                    className="rounded-lg bg-primary text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90">
                                    Theo dõi đơn
                                </Button>
                            )}
                            {order.status === "rented" && (
                                <Button className="rounded-lg bg-primary text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90">
                                    Gia hạn thuê
                                </Button>
                            )}
                            {order.status === "completed" && (
                                <Button className="rounded-lg bg-primary text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90">
                                    Thuê lại
                                </Button>
                            )}
                        </div>
                        <button
                            onClick={() => navigate(`/order-detail/${order.id}`)}
                            className="flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                            Chi tiết
                            <span className="text-sm">›</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default OrderCard
