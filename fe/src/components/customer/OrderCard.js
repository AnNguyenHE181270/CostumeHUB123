import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCalendarDays, faLocationDot, faBox, faChevronRight } from '@fortawesome/free-solid-svg-icons'
import { statusOrder } from "../../constants/statusOrder"
import { formatOrderId } from "../../utils/formatters"

function OrderCard({ order, onViewDetail, isSelected, isCompact, onRentAgain, onExtendOrder, onCancelOrder, onTrackOrder, onRequestReturn }) {
    const status = statusOrder[order.status]

    return (
        <div
            className={
                "group overflow-hidden rounded-xl border bg-white transition-all cursor-pointer " +
                (isSelected
                    ? "border-primary/50  shadow-sm"
                    : "border-border hover:border-muted-foreground/30 hover:shadow-sm")
            }
            onClick={() => onViewDetail(order)}
        >
            <div className={
                "flex " +
                (isCompact ? "flex-row" : "flex-col sm:flex-row")
            }>
                <div className={
                    "relative shrink-0 bg-[oklch(0.92_0.03_130)] overflow-hidden " +
                    (isCompact
                        ? "h-40 w-20 sm:h-auto sm:w-20"
                        : "h-40 w-full sm:h-auto sm:w-32")
                }>
                    {order.costumeImage ? (
                        <img
                            src={order.costumeImage}
                            alt={order.costumeName}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <FontAwesomeIcon icon={faBox} className={
                                "text-[oklch(0.7_0.04_130)] " +
                                (isCompact ? "h-5 w-5" : "h-10 w-10")
                            } />
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className={
                    "flex flex-1 flex-col " +
                    (isCompact ? "p-3 justify-center" : "p-4 sm:p-5")
                }>
                    {/* Header */}
                    <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="space-y-1 min-w-0 flex-1">
                            <div className={
                                "flex items-center gap-2 flex-wrap " +
                                (isCompact ? "justify-between w-full" : "")
                            }>
                                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                    {formatOrderId(order.id)}
                                </span>
                                <span className={
                                    "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium " +
                                    (status?.className || "")
                                }>
                                    {status?.label}
                                </span>
                            </div>
                            <h3
                                className={
                                    "font-semibold " +
                                    (isCompact ? "text-xm mt-1.5" : "text-xl")
                                }
                                style={{ fontFamily: "'Cormorant Garamond', serif" }}
                            >
                                {order.costumeName}
                            </h3>
                        </div>
                        {!isCompact && (
                            <div className="text-right shrink-0">
                                <p className="text-lg font-semibold text-foreground">{order.totalPrice}</p>
                                <p className="text-xs text-muted-foreground">Thuê {order.rentalPeriod}</p>
                            </div>
                        )}
                    </div>

                    {/* Details */}
                    <div className={
                        "flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground " +
                        (isCompact ? "mt-1.5" : "mt-4")
                    }>
                        <div className="flex items-center gap-1.5">
                            <FontAwesomeIcon icon={faCalendarDays} className="h-3.5 w-3.5" />
                            <span className={isCompact ? "text-xs" : "text-sm"}>
                                {order.startDate} - {order.endDate}
                            </span>
                        </div>
                        {!isCompact && (
                            <div className="flex items-center gap-1.5">
                                <FontAwesomeIcon icon={faLocationDot} className="h-4 w-4" />
                                <span className="truncate max-w-[200px]">{order.address}</span>
                            </div>
                        )}
                    </div>

                    {/* Actions - Only show on non-compact view */}
                    {!isCompact && (
                        <div className="mt-4 flex items-end justify-between border-t border-border pt-4">
                            <div className="flex gap-2">
                                {order.status === "renting" && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (onExtendOrder) onExtendOrder(order);
                                            else onViewDetail(order);
                                        }}
                                        className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90"
                                    >
                                        Gia hạn thuê
                                    </button>
                                )}
                                {['renting', 'overdue'].includes(order.status) && onRequestReturn && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onRequestReturn(order);
                                        }}
                                        className="flex items-center gap-2 rounded-lg bg-[#b8935a] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#a07d4a]"
                                    >
                                        Trả hàng
                                    </button>
                                )}
                                {["completed", "cancelled"].includes(order.status) && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onRentAgain?.(order.items);
                                        }}
                                        className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90"
                                    >
                                        Thuê lại
                                    </button>
                                )}
                                {order.status === "pending" && onCancelOrder && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onCancelOrder(order);
                                        }}
                                        className="rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-100"
                                    >
                                        Hủy đơn hàng
                                    </button>
                                )}
                                {order.status === "delivering" && onTrackOrder && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onTrackOrder(order);
                                        }}
                                        className="flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
                                    >
                                        <FontAwesomeIcon icon={faLocationDot} className="h-4 w-4" />
                                        Theo dõi đơn
                                    </button>
                                )}
                            </div>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation()
                                    onViewDetail(order)
                                }}
                                className="flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                            >
                                Chi tiết
                                <FontAwesomeIcon icon={faChevronRight} className="h-4 w-4" />
                            </button>
                        </div>
                    )}

                    {/* Compact view - Price on right */}
                    {isCompact && (
                        <span className="mt-1.5 text-sm font-semibold text-foreground">{order.totalPrice}</span>
                    )}
                </div>
            </div>
        </div>
    )
}

export default OrderCard
