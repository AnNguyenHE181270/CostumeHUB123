"use client"

import { useState } from "react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faXmark, faTriangleExclamation } from "@fortawesome/free-solid-svg-icons"

const cancelReasons = [
    "Đổi ý, không muốn thuê nữa",
    "Tìm được trang phục khác phù hợp hơn",
    "Thay đổi kế hoạch sự kiện",
    "Giá thuê quá cao",
    "Thời gian giao hàng không phù hợp",
    "Khác"
]

export function CancelOrderModal({ open, onOpenChange, orderId, onConfirm }) {
    const [selectedReason, setSelectedReason] = useState("")
    const [otherReason, setOtherReason] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleSubmit = () => {
        if (!selectedReason) return

        setIsSubmitting(true)
        const reason = selectedReason === "Khác" ? otherReason : selectedReason

        // Simulate API call
        setTimeout(() => {
            onConfirm(reason)
            setIsSubmitting(false)
            setSelectedReason("")
            setOtherReason("")
            onOpenChange(false)
        }, 1000)
    }

    const handleClose = () => {
        setSelectedReason("")
        setOtherReason("")
        onOpenChange(false)
    }

    if (!open) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={handleClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-md mx-4 rounded-xl bg-card shadow-xl animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-border p-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50">
                            <FontAwesomeIcon icon={faTriangleExclamation} className="h-5 w-5 text-red-600" />
                        </div>
                        <div>
                            <h2 className="font-serif text-lg font-medium text-foreground">Hủy đơn hàng</h2>
                            <p className="text-xs text-muted-foreground">{orderId}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                        <FontAwesomeIcon icon={faXmark} className="h-5 w-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4">
                    <p className="text-sm text-muted-foreground mb-4">
                        Vui lòng cho chúng tôi biết lý do bạn muốn hủy đơn hàng này:
                    </p>

                    <div className="space-y-2">
                        {cancelReasons.map((reason) => (
                            <label
                                key={reason}
                                className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-all ${selectedReason === reason
                                    ? "border-primary bg-primary/5"
                                    : "border-border hover:border-muted-foreground/30"
                                    }`}
                            >
                                <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center transition-colors ${selectedReason === reason
                                    ? "border-primary"
                                    : "border-muted-foreground/40"
                                    }`}>
                                    {selectedReason === reason && (
                                        <div className="h-2 w-2 rounded-full bg-primary" />
                                    )}
                                </div>
                                <span className="text-sm text-foreground">{reason}</span>
                            </label>
                        ))}
                    </div>

                    {/* Other reason input */}
                    {selectedReason === "Khác" && (
                        <div className="mt-3 animate-in fade-in slide-in-from-top-2 duration-200">
                            <textarea
                                value={otherReason}
                                onChange={(e) => setOtherReason(e.target.value)}
                                placeholder="Nhập lý do của bạn..."
                                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                                rows={3}
                            />
                        </div>
                    )}

                    {/* Warning */}
                    <div className="mt-4 rounded-lg bg-amber-50 p-3">
                        <p className="text-xs text-amber-800">
                            <strong>Lưu ý:</strong> Sau khi hủy đơn, bạn sẽ không thể khôi phục lại.
                            Nếu đã thanh toán, tiền sẽ được hoàn lại trong vòng 3-5 ngày làm việc.
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex gap-3 border-t border-border p-4">
                    <button
                        onClick={handleClose}
                        className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                    >
                        Quay lại
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!selectedReason || (selectedReason === "Khác" && !otherReason.trim()) || isSubmitting}
                        className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${selectedReason && (selectedReason !== "Khác" || otherReason.trim()) && !isSubmitting
                            ? "bg-red-600 text-white hover:bg-red-700"
                            : "bg-muted text-muted-foreground cursor-not-allowed"
                            }`}
                    >
                        {isSubmitting ? "Đang xử lý..." : "Xác nhận hủy"}
                    </button>
                </div>
            </div>
        </div>
    )
}
