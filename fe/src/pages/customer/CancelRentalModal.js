import { useState, useEffect } from "react"
import Modal from "../../components/Modal"
import Radio from "../../components/ui/Radio"
import { formatOrderId } from "../../utils/formatters"
import { useAuth } from "../../context/AuthContext"
import rentalService from "../../services/rental.service"

const cancelReasons = [
    "Đổi ý, không muốn thuê nữa",
    "Tìm được trang phục khác phù hợp hơn",
    "Thay đổi kế hoạch sự kiện",
    "Giá thuê quá cao",
    "Thời gian giao hàng không phù hợp",
    "Khác"
]

export function CancelOrderModal({ open, onOpenChange, order, onConfirm }) {
    const { refreshProfile } = useAuth()
    const [step, setStep] = useState(1)
    const [selectedReason, setSelectedReason] = useState("")
    const [otherReason, setOtherReason] = useState("")
    
    // OTP and Bank fields
    const [password, setPassword] = useState("")
    const [otp, setOtp] = useState("")
    const [bankName, setBankName] = useState("")
    const [accountNumber, setAccountNumber] = useState("")
    const [accountName, setAccountName] = useState("")
    const [banks, setBanks] = useState([])
    const [timeLeft, setTimeLeft] = useState(0)
    
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [errorMsg, setErrorMsg] = useState("")
    const [successMsg, setSuccessMsg] = useState("")

    useEffect(() => {
        if (timeLeft > 0) {
            const timer = setInterval(() => {
                setTimeLeft(prev => prev - 1)
            }, 1000)
            return () => clearInterval(timer)
        }
    }, [timeLeft])

    useEffect(() => {
        if (open) {
            setStep(1)
            setSelectedReason("")
            setOtherReason("")
            setPassword("")
            setOtp("")
            setBankName("")
            setAccountNumber("")
            setAccountName("")
            setErrorMsg("")
            setSuccessMsg("")
            setTimeLeft(0)
            
            // Fetch banks if order is paid
            if (order?.paymentStatus === 'paid') {
                fetch('https://api.vietqr.io/v2/banks')
                    .then(res => res.json())
                    .then(data => {
                        if (data.code === '00') {
                            setBanks(data.data)
                        }
                    })
                    .catch(err => console.error("Failed to fetch banks", err))
            }
        }
    }, [open, order])

    const handleNext = async () => {
        setErrorMsg("")
        setSuccessMsg("")
        if (step === 1) {
            if (order?.paymentStatus === 'paid') {
                setStep(2)
            } else {
                await submitCancel()
            }
        } else if (step === 2) {
            // Request OTP
            if (!password) {
                setErrorMsg("Vui lòng nhập mật khẩu")
                return
            }
            setIsSubmitting(true)
            try {
                await rentalService.sendCancelOtp(password, order.id || order._id)
                setStep(3)
                setTimeLeft(60)
            } catch (err) {
                setErrorMsg(err.message || "Mật khẩu không chính xác hoặc lỗi hệ thống.")
            } finally {
                setIsSubmitting(false)
            }
        } else if (step === 3) {
            // Submit cancel with refund data
            if (!otp || !bankName || !accountNumber || !accountName) {
                setErrorMsg("Vui lòng nhập đầy đủ thông tin")
                return
            }
            await submitCancel()
        }
    }

    const submitCancel = async () => {
        setIsSubmitting(true)
        setErrorMsg("")
        setSuccessMsg("")
        const reason = selectedReason === "Khác" ? otherReason : selectedReason

        let refundData = null;
        if (order?.paymentStatus === 'paid') {
            refundData = {
                otp,
                bankName,
                accountNumber,
                accountName
            }
        }

        try {
            await rentalService.cancelOrder(order.id || order._id, reason, refundData)
            await refreshProfile()
            if (onConfirm) onConfirm()
            handleClose()
        } catch (err) {
            setErrorMsg(err.message || "Không thể hủy đơn hàng lúc này.")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleClose = () => {
        onOpenChange(false)
    }

    const handleResendOtp = async () => {
        setIsSubmitting(true)
        setErrorMsg("")
        setSuccessMsg("")
        try {
            await rentalService.sendCancelOtp(password, order.id || order._id)
            setTimeLeft(60)
            setSuccessMsg("Mã OTP mới đã được gửi thành công!")
        } catch (err) {
            setErrorMsg(err.message || "Không thể gửi lại OTP lúc này.")
        } finally {
            setIsSubmitting(false)
        }
    }

    if (!order) return null;

    const orderId = order.id || order._id;

    return (
        <Modal isOpen={open} onClose={handleClose} title={`Hủy đơn hàng ${formatOrderId(orderId)}`}>
            <div className="p-4">
                {errorMsg && (
                    <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
                        {errorMsg}
                    </div>
                )}
                {successMsg && (
                    <div className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-600">
                        {successMsg}
                    </div>
                )}

                {step === 1 && (
                    <div className="animate-in fade-in duration-300">
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
                        
                        {order?.paymentStatus === 'paid' && (
                            <div className="mt-4 rounded-lg bg-blue-50 p-3">
                                <p className="text-xs text-blue-800">
                                    <strong>Thông báo:</strong> Đơn hàng đã được thanh toán. Bạn sẽ cần nhập mật khẩu và mã OTP để xác nhận hoàn tiền.
                                </p>
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
                )}

                {step === 2 && (
                    <div className="animate-in slide-in-from-right-4 fade-in duration-300 space-y-4">
                        <p className="text-sm text-gray-600">
                            Để đảm bảo an toàn, vui lòng nhập mật khẩu tài khoản của bạn để nhận mã OTP xác nhận hủy đơn và hoàn tiền.
                        </p>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Mật khẩu
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                                placeholder="Nhập mật khẩu của bạn"
                            />
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="animate-in slide-in-from-right-4 fade-in duration-300 space-y-4">
                        <p className="text-sm text-gray-600">
                            Mã OTP đã được gửi đến email của bạn. Vui lòng nhập mã OTP và thông tin tài khoản ngân hàng để nhận hoàn tiền.
                        </p>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Mã OTP
                            </label>
                            <input
                                type="text"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                                placeholder="Nhập mã OTP (6 số)"
                                maxLength={6}
                            />
                            <div className="flex justify-between items-center mt-2">
                                <span className="text-sm text-gray-500">
                                    Mã có hiệu lực trong 5 phút.
                                </span>
                                <button 
                                    type="button"
                                    onClick={handleResendOtp} 
                                    disabled={timeLeft > 0 || isSubmitting}
                                    className={`text-sm font-medium ${timeLeft > 0 ? 'text-gray-400 cursor-not-allowed' : 'text-blue-600 hover:text-blue-800'}`}
                                >
                                    {timeLeft > 0 ? `Gửi lại mã OTP (${timeLeft}s)` : 'Gửi lại mã OTP'}
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Ngân hàng
                            </label>
                            <select
                                value={bankName}
                                onChange={(e) => setBankName(e.target.value)}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                            >
                                <option value="">-- Chọn ngân hàng --</option>
                                {banks.map(bank => (
                                    <option key={bank.bin} value={bank.shortName}>
                                        {bank.shortName} - {bank.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Số tài khoản
                            </label>
                            <input
                                type="text"
                                value={accountNumber}
                                onChange={(e) => setAccountNumber(e.target.value)}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                                placeholder="Nhập số tài khoản"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Tên chủ tài khoản
                            </label>
                            <input
                                type="text"
                                value={accountName}
                                onChange={(e) => setAccountName(e.target.value.toUpperCase())}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm uppercase focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                                placeholder="NGUYEN VAN A"
                            />
                        </div>
                    </div>
                )}
            </div>

            <div className="flex gap-3 border-t border-gray-200 p-4">
                <button
                    onClick={() => {
                        if (step > 1) {
                            setStep(step - 1)
                            setErrorMsg("")
                            setSuccessMsg("")
                        } else {
                            handleClose()
                        }
                    }}
                    disabled={isSubmitting}
                    className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-900 transition-colors hover:bg-gray-100 disabled:opacity-50"
                >
                    {step > 1 ? "Quay lại" : "Thoát"}
                </button>
                <button
                    onClick={handleNext}
                    disabled={
                        (step === 1 && (!selectedReason || (selectedReason === "Khác" && !otherReason.trim()))) ||
                        (step === 2 && !password) ||
                        (step === 3 && (!otp || !bankName || !accountNumber || !accountName)) ||
                        isSubmitting
                    }
                    className="flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors bg-red-600 text-white hover:bg-red-700 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                >
                    {isSubmitting ? "Đang xử lý..." : (step === 1 && order?.paymentStatus === 'paid' ? "Tiếp tục" : "Xác nhận hủy")}
                </button>
            </div>
        </Modal >
    )
}
