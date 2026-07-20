import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBox, faCalendarDays, faMapMarkerAlt, faCreditCard, faClock, faUser, faFileLines, faTruck, faCircleXmark, faExclamationCircle, faLocationDot } from "@fortawesome/free-solid-svg-icons"
import { statusOrder } from "../../constants/statusOrder"
import { formatPrice, formatDate, formatOrderId } from "../../utils/formatters"
import { IssuesModal } from "./IssuesPage"
import { OrderTrackingModal } from "./OrderTrackingModal"
import { ExtendRentalModal } from "./ExtendRentalModal"
import rentalService from "../../services/rental.service"

export function OrderDetail({ open, onOpenChange, order, onCancelOrder, onRequestReturn, onConfirmReceipt, onRequestIssue, onExtendSuccess, onRentAgain, onExtendOrder }) {
    const [detailedOrder, setDetailedOrder] = useState(null)
    const [loading, setLoading] = useState(false)
    const [isTrackingOpen, setIsTrackingOpen] = useState(false)
    const [isExtendOpen, setIsExtendOpen] = useState(false)
    const navigate = useNavigate()

    const fetchDetail = async () => {
        setLoading(true)
        try {
            const data = await rentalService.getDetail(order.id)
            setDetailedOrder(data)
        } catch (err) {
            console.error("Lỗi khi lấy chi tiết đơn hàng:", err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (open && order?.id) {
            fetchDetail()
        } else {
            setDetailedOrder(null)
        }
    }, [open, order])

    if (!order || !open) return null

    const currentStatus = detailedOrder?.status || order.status
    const deliveredAt = detailedOrder?.deliveredAt
    const status = statusOrder[currentStatus] || statusOrder[order.status]

    let isWithin5Hours = true
    if (deliveredAt) {
        const deliveredTime = new Date(deliveredAt).getTime()
        const now = Date.now()
        const hoursDiff = (now - deliveredTime) / (1000 * 60 * 60)
        isWithin5Hours = hoursDiff < 5
    }

    return (
        <div className="flex flex-col w-full h-full rounded-xl border bg-white p-6 mt-2 shadow-sm relative">
            <div className=" flex items-center justify-between border-b border-border pb-4 shrink-0">
                <div>
                    <h2 className=" text-xl font-semibold text-foreground">Chi tiết đơn hàng</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Mã đơn: {formatOrderId(order.id)} | Đặt ngày: {detailedOrder ? formatDate(detailedOrder.orderDate) : "..."}
                    </p>
                </div>
                <button onClick={() => onOpenChange(false)} className="text-muted-foreground hover:text-foreground text-2xl leading-none">
                    &times;
                </button>
            </div>

            {loading ? (
                <div className="py-12 text-center text-muted-foreground">Đang tải dữ liệu...</div>
            ) : detailedOrder ? (
                <div className="space-y-6 overflow-y-auto pr-2">
                    {/* Product Info */}
                    <div className="space-y-2 mt-2">
                        {detailedOrder.items?.map((item, index) => (
                            <div key={index} className="rounded-lg border border-border p-2">
                                <div className="flex gap-4">
                                    <div className="h-24 w-20 shrink-0 rounded-lg bg-[oklch(0.92_0.03_130)] flex items-center justify-center overflow-hidden border border-border">
                                        {item.image ? (
                                            <img src={item.image} alt={item.costumeName} className="h-full w-full object-cover" />
                                        ) : (
                                            <FontAwesomeIcon icon={faBox} className="h-8 w-8 text-[oklch(0.7_0.04_130)]" />
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-start justify-between mt-2 gap-2">
                                            <h3
                                                className="text-lg font-bold "
                                                style={{ fontFamily: "'Cormorant Garamond', serif" }}
                                            >
                                                {item.costumeName}
                                            </h3>
                                            {index === 0 && status && (
                                                <span className={
                                                    "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium " +
                                                    (status.className || "")
                                                }>
                                                    {status.label}
                                                </span>
                                            )}
                                        </div>
                                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                                            {item.size && <span>Size: {item.size}</span>}
                                            <span>Số lượng: {item.quantity}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Rental Period */}
                    <div className="rounded-lg border border-border p-4">
                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                            <FontAwesomeIcon icon={faCalendarDays} className="h-4 w-4" />
                            <span>Thời gian thuê</span>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                            <div className="text-center">
                                <p className="text-xs text-muted-foreground">Ngày nhận</p>
                                <p className="mt-1 font-medium text-foreground">{formatDate(detailedOrder.startDate || order.startDate)}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="h-px w-8 bg-border" />
                                <span className="rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                                    {detailedOrder.rentalPeriod || order.rentalPeriod} ngày
                                </span>
                                <div className="h-px w-8 bg-border" />
                            </div>
                            <div className="text-center">
                                <p className="text-xs text-muted-foreground">Ngày trả</p>
                                <p className="font-medium text-foreground">{formatDate(detailedOrder.endDate || order.endDate)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Customer & Delivery Info */}
                    <div className="grid gap-4 sm:grid-cols-2">
                        {/* Customer Info */}
                        <div className="rounded-lg border p-4">
                            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                <FontAwesomeIcon icon={faUser} className="h-4 w-4" />
                                <span>Thông tin khách hàng</span>
                            </div>
                            <div className="space-y-2 text-sm mt-2">
                                <p className="text-foreground">Người nhận: {detailedOrder.customer?.name}</p>
                                <p className="text-muted-foreground">Số điện thoại: {detailedOrder.customer?.phone}</p>
                            </div>
                        </div>

                        {/* Delivery Address */}
                        <div className="rounded-lg border p-4">
                            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                <FontAwesomeIcon icon={faMapMarkerAlt} className="h-4 w-4" />
                                <span>Địa chỉ giao hàng</span>
                            </div>
                            <p className="mt-3 text-sm text-foreground">{order.address}</p>
                            {detailedOrder.notes && (
                                <div className="mt-3 rounded-md bg-muted p-2">
                                    <p className="text-xs text-muted-foreground">
                                        <FontAwesomeIcon icon={faFileLines} className="mr-1 inline h-3 w-3" />
                                        {detailedOrder.notes}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Payment Info */}
                    <div className="rounded-lg border border-border p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                <FontAwesomeIcon icon={faCreditCard} className="h-4 w-4" />
                                <span>Thanh toán</span>
                            </div>
                            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                                {detailedOrder.payment?.paymentStatus === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                            </span>
                        </div>
                        <p className="mt-2 text-sm text-foreground">
                            {detailedOrder.payment?.paymentMethod === 'cod' ? 'Thanh toán khi nhận hàng (COD)' : detailedOrder.payment?.paymentMethod || 'COD'}
                        </p>

                        <div className="mt-4 space-y-2 border-t border-border pt-4">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Tiền thuê</span>
                                <span className="text-foreground">{formatPrice(detailedOrder.payment?.rental)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Tiền cọc</span>
                                <span className="text-foreground">{formatPrice(detailedOrder.payment?.deposit)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Phí vận chuyển</span>
                                <span className="text-foreground">{detailedOrder.payment?.shipping ? formatPrice(detailedOrder.payment?.shipping) : "Miễn phí"}</span>
                            </div>
                            <div className="flex justify-between border-t border-border pt-2">
                                <span className="font-medium text-foreground">Tổng cộng</span>
                                <span className="text-lg font-semibold text-foreground">
                                    {formatPrice(detailedOrder.payment?.total)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-3 pt-4 mt-auto items-center justify-evenly">

                        {/* Theo dõi đơn hàng — chỉ hiện khi giao hàng (không phải nhận tại store) */}
                        {!['renting', 'overdue'].includes(currentStatus) && detailedOrder.shippingAddress.addressDetail !== "Nhận tại cửa hàng" && (
                            <button
                                onClick={() => setIsTrackingOpen(true)}
                                className="flex items-center gap-2 rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
                            >
                                <FontAwesomeIcon icon={faLocationDot} className="h-4 w-4" />
                                Theo dõi
                            </button>
                        )}

                        {/* Hủy đơn hàng */}
                        {["pending", "awaitingPayment"].includes(currentStatus) && onCancelOrder && (
                            <button
                                onClick={() => onCancelOrder(order)}
                                className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700 transition-colors hover:bg-red-100"
                            >
                                <FontAwesomeIcon icon={faCircleXmark} className="h-4 w-4" />
                                Hủy đơn hàng
                            </button>
                        )}

                        {/* Nếu đơn ở trạng thái delivered và trong vòng 5 tiếng */}
                        {currentStatus === "delivered" && isWithin5Hours && (
                            <>
                                <button
                                    onClick={() => onRequestReturn && onRequestReturn(order)}
                                    className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700"
                                >
                                    <FontAwesomeIcon icon={faTruck} className="h-4 w-4" />
                                    Hoàn trả hàng
                                </button>
                                <button
                                    onClick={() => onConfirmReceipt && onConfirmReceipt(order)}
                                    className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-green-700"
                                >
                                    <FontAwesomeIcon icon={faBox} className="h-4 w-4" />
                                    Đã nhận hàng
                                </button>
                            </>
                        )}

                        {/* Trả hàng sau khi sử dụng (renting, overdue) hoặc sau 5 tiếng từ lúc delivered */}
                        {(['renting', 'overdue'].includes(currentStatus) || (currentStatus === 'delivered' && !isWithin5Hours)) && onRequestReturn && (
                            <button
                                onClick={() => onRequestReturn(order)}
                                className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                            >
                                <FontAwesomeIcon icon={faTruck} className="h-4 w-4" />
                                Trả hàng
                            </button>
                        )}

                        {['renting'].includes(currentStatus) && (
                            <button
                                onClick={() => {
                                    if (onExtendOrder) onExtendOrder(detailedOrder || order);
                                    else setIsExtendOpen(true);
                                }}
                                className="flex items-center gap-2 rounded-lg bg-yellow-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-yellow-600 cursor-pointer"
                            >
                                <FontAwesomeIcon icon={faClock} className="h-4 w-4" />
                                Gia hạn thuê
                            </button>
                        )}

                        {['renting', 'delivered', 'returning', 'completed'].includes(currentStatus) && (
                            <button
                                onClick={() => onRequestIssue?.()}
                                className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-colors ${detailedOrder?.hasIssue
                                    ? "bg-slate-700 hover:bg-slate-800"
                                    : "bg-red-500 hover:bg-red-600"
                                    }`}
                            >
                                <FontAwesomeIcon icon={faExclamationCircle} className="h-4 w-4" />
                                {detailedOrder?.hasIssue ? "Xem khiếu nại" : "Khiếu nại"}
                            </button>
                        )}

                        {["completed", "cancelled"].includes(currentStatus) && (
                            <button
                                onClick={() => onRentAgain?.(detailedOrder?.items)}
                                className="flex items-center gap-2 rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-black/90"
                            >
                                <FontAwesomeIcon icon={faBox} className="h-4 w-4" />
                                Thuê lại
                            </button>
                        )}

                    </div>
                </div>
            ) : (
                <div className="py-12 text-center text-red-500">Không thể tải thông tin chi tiết.</div>
            )}

            <OrderTrackingModal
                open={isTrackingOpen}
                onOpenChange={setIsTrackingOpen}
                order={order}
            />

            <ExtendRentalModal
                open={isExtendOpen}
                onOpenChange={setIsExtendOpen}
                order={detailedOrder}
                onConfirm={() => {
                    onExtendSuccess?.();
                    fetchDetail();
                }}
            />
            {/* Nếu đơn ở trạng thái delivered và trong vòng 5 tiếng */}
            {currentStatus === "delivered" && isWithin5Hours && (
                <>
                    <button
                        onClick={() => onRequestReturn && onRequestReturn(order)}
                        className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700"
                    >
                        <FontAwesomeIcon icon={faTruck} className="h-4 w-4" />
                        Hoàn trả hàng
                    </button>
                    <button
                        onClick={() => onConfirmReceipt && onConfirmReceipt(order)}
                        className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-green-700"
                    >
                        <FontAwesomeIcon icon={faBox} className="h-4 w-4" />
                        Đã nhận hàng
                    </button>
                </>
            )}

        </div>
    )
}
