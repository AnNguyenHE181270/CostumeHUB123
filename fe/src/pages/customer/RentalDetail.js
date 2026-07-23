import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBox, faCalendarDays, faMapMarkerAlt, faCreditCard, faClock, faUser, faFileLines, faTruck, faCircleXmark, faExclamationCircle, faLocationDot } from "@fortawesome/free-solid-svg-icons"
import { getOrderStatusLabel } from "../../constants/statusOrder"
import { PAYMENT_METHOD_LABELS } from "../../constants/paymentMethod"
import { formatPrice, formatDate, formatOrderId } from "../../utils/formatters"
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
    const currentIssue = detailedOrder?.hasIssue
        ? { status: detailedOrder.issueStatus, resolution: detailedOrder.issueResolution }
        : order.issue
    let status = getOrderStatusLabel({ status: currentStatus, issue: currentIssue })
    const refundDetails = detailedOrder?.refundDetails || order.refundDetails
    if (currentStatus === 'cancelled' && refundDetails?.status === 'pending') {
        status = { label: "Chờ hoàn tiền", className: "bg-blue-100 text-blue-800 border-blue-200" }
    }
    // Đơn trả hàng/hoàn tiền do khiếu nại ĐÃ được xử lý xong (status='completed' — staff đã kiểm tra
    // đồ trả ở inspectReturn) coi như đã kết thúc trọn vẹn với khách hàng — không hiện "Chờ hoàn tiền"
    // gây hiểu lầm là chưa xong nữa (refundDetails.status='pending' lúc này chỉ còn là việc NỘI BỘ
    // của cửa hàng — chờ owner tự tay xác nhận đã chuyển khoản — khách không cần thấy trạng thái đó).
    const isCompletedReturnRefund = currentStatus === 'completed' && currentIssue?.resolution === 'return_refund'

    let isWithin3HoursRenting = true
    const rentingAt = detailedOrder?.rentingAt || order?.rentingAt
    if (rentingAt) {
        const rentingTime = new Date(rentingAt).getTime()
        const now = Date.now()
        const hoursDiff = (now - rentingTime) / (1000 * 60 * 60)
        isWithin3HoursRenting = hoursDiff <= 3
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
                                {detailedOrder.payment?.paymentStatus === 'paid' ? 'Đã thanh toán' :
                                    detailedOrder.payment?.paymentStatus === 'refunded'
                                        ? (isCompletedReturnRefund || refundDetails?.status !== 'pending' ? 'Đã hoàn tiền' : 'Chờ hoàn tiền')
                                        : 'Chưa thanh toán'}
                            </span>
                        </div>
                        <p className="mt-2 text-sm text-foreground">
                            {PAYMENT_METHOD_LABELS[detailedOrder.payment?.paymentMethod] || detailedOrder.payment?.paymentMethod || 'Chưa xác định'}
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

                    {/* Phí trễ hạn ƯỚC TÍNH — hiện ngay khi đơn còn đang thuê/quá hạn và chưa trả, để
                        khách biết trước sẽ mất bao nhiêu nếu trả đúng lúc này (số này còn tăng theo
                        từng ngày trễ thêm, chỉ chốt thật khi trả hàng xong). */}
                    {['renting', 'overdue'].includes(currentStatus) && detailedOrder.estimatedLateFee > 0 && (
                        <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
                            <div className="flex items-center gap-2 text-sm font-semibold text-orange-800">
                                <FontAwesomeIcon icon={faClock} className="h-4 w-4" />
                                <span>Phí trễ hạn hiện tại (ước tính)</span>
                            </div>
                            <p className="mt-1 text-xs text-orange-700">
                                Đơn {formatOrderId(order.id)} đã trễ {detailedOrder.estimatedDaysLate} ngày so với hạn trả. Số phí dưới đây sẽ tiếp tục tăng mỗi ngày cho tới khi bạn trả hàng — số tiền chính xác cuối cùng sẽ được chốt khi cửa hàng kiểm tra đồ trả.
                            </p>
                            <p className="mt-2 text-lg font-bold text-orange-800">
                                {formatPrice(detailedOrder.estimatedLateFee)}
                            </p>
                        </div>
                    )}

                    {/* Phí đã CHỐT + số tiền hoàn — chỉ hiện khi đơn đã hoàn tất (đã kiểm tra đồ trả
                        xong), gắn rõ với đúng mã đơn này để khách đối chiếu không nhầm giữa các đơn. */}
                    {currentStatus === 'completed' && (
                        <div className="rounded-lg border border-border p-4">
                            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                <FontAwesomeIcon icon={faFileLines} className="h-4 w-4" />
                                <span>Phí phát sinh & Hoàn tiền — Đơn {formatOrderId(order.id)}</span>
                            </div>
                            <div className="mt-3 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Phí trễ hạn</span>
                                    <span className={detailedOrder.lateFee > 0 ? "font-medium text-red-600" : "text-foreground"}>
                                        {detailedOrder.lateFee > 0 ? "-" : ""}{formatPrice(detailedOrder.lateFee)}
                                    </span>
                                </div>
                                {detailedOrder.damageFee > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Phí hư hỏng ({detailedOrder.damagePercent}% cọc)</span>
                                        <span className="font-medium text-red-600">-{formatPrice(detailedOrder.damageFee)}</span>
                                    </div>
                                )}
                                {detailedOrder.replacementFee > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Phí bồi thường vượt cọc</span>
                                        <span className="font-medium text-red-600">-{formatPrice(detailedOrder.replacementFee)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between border-t border-border pt-2">
                                    <span className="font-medium text-foreground">Số tiền hoàn lại cho bạn</span>
                                    <span className="text-lg font-semibold text-emerald-600">
                                        {formatPrice(Math.max(0, (detailedOrder.refundAmount || 0) - (detailedOrder.replacementFee || 0)))}
                                    </span>
                                </div>
                                <p className="text-xs text-muted-foreground pt-1">
                                    {isCompletedReturnRefund || refundDetails?.status === "completed"
                                        ? "Cửa hàng đã xử lý hoàn tiền cho đơn này."
                                        : "Yêu cầu hoàn tiền cho đơn này đang chờ cửa hàng xử lý chuyển khoản."}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-3 pt-4 mt-auto items-center justify-evenly">

                        {/* Theo dõi đơn hàng — chỉ hiện khi giao hàng (không phải nhận tại store).
                            Không hiện cho 'delivered' (đã tới nơi, chỉ cần khách xác nhận), 'completed'
                            hay 'cancelled' (đơn đã kết thúc, theo dõi vận chuyển không còn ý nghĩa). */}
                        {!['renting', 'overdue', 'delivered', 'completed', 'cancelled'].includes(currentStatus) && detailedOrder.shippingAddress.addressDetail !== "Nhận tại cửa hàng" && (
                            <button
                                onClick={() => setIsTrackingOpen(true)}
                                className="flex items-center gap-2 rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
                            >
                                <FontAwesomeIcon icon={faLocationDot} className="h-4 w-4" />
                                Theo dõi
                            </button>
                        )}

                        {/* Hủy đơn hàng */}
                        {currentStatus === "pending" && onCancelOrder && (
                            <button
                                onClick={() => onCancelOrder(order)}
                                className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700 transition-colors hover:bg-red-100"
                            >
                                <FontAwesomeIcon icon={faCircleXmark} className="h-4 w-4" />
                                Hủy đơn hàng
                            </button>
                        )}

                        {/* Đơn đã giao — CHỈ còn 1 việc khách cần làm: xác nhận đã nhận hàng. Không cho
                            "Hoàn trả hàng"/"Trả hàng" ở bước này nữa (chưa xác nhận nhận hàng thì
                            chưa có gì để trả) — khách xác nhận xong, đơn mới sang 'renting' và lúc
                            đó mới thấy nút Trả hàng. Không thể trả — sau 5 tiếng đơn tự động sang
                            'renting' (autoUpdateDeliveredStatus), nút Trả hàng tự xuất hiện lúc đó. */}
                        {currentStatus === "delivered" && (
                            <button
                                onClick={() => onConfirmReceipt && onConfirmReceipt(order)}
                                className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-green-700"
                            >
                                <FontAwesomeIcon icon={faBox} className="h-4 w-4" />
                                Đã nhận hàng
                            </button>
                        )}

                        {/* Trả hàng sau khi sử dụng (renting, overdue) */}
                        {['renting', 'overdue'].includes(currentStatus) && onRequestReturn && (
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

                        {/* "Xem đơn hoàn trả" chỉ còn ý nghĩa khi khiếu nại CHƯA xử lý xong hoàn toàn —
                            đơn đã 'completed' nghĩa là staff đã kiểm tra hàng trả xong, không còn gì
                            để "xem" nữa, chỉ cần nút Thuê lại ở dưới. */}
                        {((currentStatus === 'renting' && isWithin3HoursRenting && detailedOrder?.shippingAddress?.addressDetail !== "Nhận tại cửa hàng") || (detailedOrder?.hasIssue && currentStatus !== 'completed')) && (
                            <button
                                onClick={() => onRequestIssue?.()}
                                className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-colors ${detailedOrder?.hasIssue
                                    ? "bg-slate-700 hover:bg-slate-800"
                                    : "bg-red-500 hover:bg-red-600"
                                    }`}
                            >
                                <FontAwesomeIcon icon={faExclamationCircle} className="h-4 w-4" />
                                {detailedOrder?.hasIssue ? "Xem đơn hoàn trả" : "Trả hàng & Hoàn tiền"}
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
                order={detailedOrder || order}
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
        </div>
    )
}
