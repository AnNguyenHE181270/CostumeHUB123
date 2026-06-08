"use client"

import { useState } from "react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faXmark, faTriangleExclamation } from "@fortawesome/free-solid-svg-icons"
import Modal from "../../components/Modal"
import Radio from "../../components/ui/Radio"
import { formatOrderId } from "../../utils/formatters"
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:9999"

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

    const handleSubmit = async () => {
        if (!selectedReason) return

        setIsSubmitting(true)
        const reason = selectedReason === "Khác" ? otherReason : selectedReason

        try {
            const token = localStorage.getItem("token") || sessionStorage.getItem("token")

            const res = await fetch(`${API_URL}/api/rentals/${orderId}/cancel`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ cancelReason: reason })
            })

            if (res.ok) {
                if (onConfirm) onConfirm()
                handleClose()
            } else {
                const errorData = await res.json()
                console.error("Lỗi khi hủy đơn hàng:", errorData.message)
                alert(errorData.message || "Không thể hủy đơn hàng lúc này.")
            }
        } catch (err) {
            console.error("Lỗi kết nối khi hủy đơn:", err)
            alert("Lỗi kết nối đến máy chủ.")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleClose = () => {
        setSelectedReason("")
        setOtherReason("")
        onOpenChange(false)
    }

    return (
        <Modal isOpen={open} onClose={handleClose} title={`Hủy đơn hàng ${formatOrderId(orderId)}`}>
            <div className="p-4">
                <p className="text-sm text-gray-500 mb-4">
                    Vui lòng cho chúng tôi biết lý do bạn muốn hủy đơn hàng này:
                </p>

                <div className="space-y-2">
                    {cancelReasons.map((reason) => (
                        <label
                            key={reason}
                            className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-all ${selectedReason === reason
                                ? "border-black bg-gray-50"
                                : "border-gray-200 hover:border-gray-300"
                                }`}
                        >
                            <Radio
                                name="cancelReason"
                                value={reason}
                                checked={selectedReason === reason}
                                onChange={() => setSelectedReason(reason)}
                            />
                            <span className="text-sm text-gray-900">{reason}</span>
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
                            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-black focus:outline-none focus:ring-1 focus:ring-black resize-none"
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

            <div className="flex gap-3 border-t border-gray-200 p-4">
                <button
                    onClick={handleClose}
                    className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-900 transition-colors hover:bg-gray-100"
                >
                    Quay lại
                </button>
                <button
                    onClick={handleSubmit}
                    disabled={!selectedReason || (selectedReason === "Khác" && !otherReason.trim()) || isSubmitting}
                    className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${selectedReason && (selectedReason !== "Khác" || otherReason.trim()) && !isSubmitting
                        ? "bg-red-600 text-white hover:bg-red-700"
                        : "bg-gray-100 text-gray-400 cursor-not-allowed"
                        }`}
                >
                    {isSubmitting ? "Đang xử lý..." : "Xác nhận hủy"}
                </button>
            </div>
        </Modal >
    )
}
