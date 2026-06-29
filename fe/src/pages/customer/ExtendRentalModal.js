import React, { useState, useEffect } from "react";
import Modal from "../../components/Modal";
import { formatPrice } from "../../utils/formatters";
import Toast from "../../components/ui/Toast";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBox } from "@fortawesome/free-solid-svg-icons"
import { statusOrder } from "../../constants/statusOrder";
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:9999";

export function ExtendRentalModal({ open, onOpenChange, order, onConfirm }) {
    const navigate = useNavigate();
    const [newEndDate, setNewEndDate] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [toast, setToast] = useState({ isVisible: false, message: "", type: "success" });

    useEffect(() => {
        if (open && order?.endDate) {
            const nextDay = new Date(order.endDate);
            nextDay.setDate(nextDay.getDate() + 1);
            setNewEndDate(nextDay.toISOString().split("T")[0]);
        }
    }, [open, order]);

    if (!order) return null;
    const statusInfo = typeof order?.status === "object" ? order.status : (statusOrder[order?.status] || null);

    const items = order.items || [];
    const dailyPriceSum = items.reduce((sum, item) => {
        const rate = item.rentalPerDay || 0;
        return sum + (rate * (item.quantity || 1));
    }, 0);

    const getExtendDays = () => {
        if (!newEndDate || !order?.endDate) return 0;
        const start = new Date(order.endDate);
        const end = new Date(newEndDate);
        const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());
        const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());
        const diff = endDay.getTime() - startDay.getTime();
        return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    };

    const extendDays = getExtendDays();
    const totalExtendCost = dailyPriceSum * extendDays;

    const handleClose = () => {
        onOpenChange(false);
    };

    const handleConfirmExtend = async () => {
        if (extendDays <= 0) return;

        setIsSubmitting(true);
        try {
            const token = localStorage.getItem("token") || sessionStorage.getItem("token");

            const res = await fetch(`${API_URL}/api/rentals/${order.orderId || order.id || order._id}/extend`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ newEndDate })
            });

            const data = await res.json();

            if (res.ok) {
                if (data.success) {
                    setToast({
                        isVisible: true,
                        message: "Gia hạn thời gian thuê thành công!",
                        type: "success"
                    });
                    setTimeout(() => {
                        if (onConfirm) onConfirm();
                        handleClose();
                    }, 1500);
                } else if (data.insufficientBalance) {
                    setToast({
                        isVisible: true,
                        message: "Số dư trong ví không đủ. Đang chuyển sang trang nạp tiền...",
                        type: "error"
                    });
                    setTimeout(() => {
                        navigate("/user/my-profile");
                        handleClose();
                    }, 2500);
                } else {
                    setToast({
                        isVisible: true,
                        message: data.message || "Gia hạn thuê thất bại.",
                        type: "error"
                    });
                }
            } else {
                if (data.message && (data.message.includes("Số dư") || data.message.includes("không đủ"))) {
                    setToast({
                        isVisible: true,
                        message: "Số dư trong ví không đủ. Đang chuyển sang trang nạp tiền...",
                        type: "error"
                    });
                    setTimeout(() => {
                        navigate("/user/my-profile");
                        handleClose();
                    }, 2500);
                } else {
                    setToast({
                        isVisible: true,
                        message: data.message || "Có lỗi xảy ra khi gia hạn.",
                        type: "error"
                    });
                }
            }
        } catch (err) {
            console.error(err);
            setToast({
                isVisible: true,
                message: "Lỗi kết nối đến máy chủ.",
                type: "error"
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const minDateString = order.endDate
        ? (() => {
            const nextDay = new Date(order.endDate);
            nextDay.setDate(nextDay.getDate() + 1);
            return nextDay.toISOString().split("T")[0];
        })()
        : "";

    return (
        <Modal isOpen={open} onClose={handleClose} title="Gia hạn thời gian thuê">
            <Toast
                isVisible={toast.isVisible}
                message={toast.message}
                type={toast.type}
                onClose={() => setToast({ ...toast, isVisible: false })}
            />
            {order?.items?.map((item, index) => (
                <div key={index} className="rounded-lg border border-border p-2 mb-4">
                    <div className="flex gap-4">
                        <div className="h-24 w-20 shrink-0 rounded-lg bg-[oklch(0.92_0.03_130)] flex items-center justify-center overflow-hidden border border-border">
                            {item.image ? (
                                <img src={item.image} alt={item.costumeName} className="h-full w-full object-cover" />
                            ) : (
                                <FontAwesomeIcon icon={faBox} className="h-8 w-8 text-[oklch(0.7_0.04_130)]" />
                            )}
                        </div>
                        <div className="flex-1">
                            <div className="flex items-start justify-between pb-2 gap-2">
                                <h3 className="text-lg font-bold" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                                    {item.costumeName}
                                </h3>
                                {index === 0 && statusInfo && (
                                    <span className={
                                        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium " +
                                        (statusInfo.className || "")
                                    }>
                                        {statusInfo.label}
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
            <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-slate-500">
                            Ngày nhận (Bắt đầu):
                        </label>
                        <input
                            type="date"
                            value={order.startDate ? new Date(order.startDate).toISOString().split("T")[0] : ""}
                            disabled
                            className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-400 outline-none cursor-not-allowed"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-slate-700">
                            Chọn ngày trả mới:
                        </label>
                        <input
                            type="date"
                            min={minDateString}
                            value={newEndDate}
                            onChange={(e) => setNewEndDate(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
                        />
                    </div>
                </div>

                {extendDays > 0 && (
                    <div className="bg-amber-50 p-4 rounded-xl border border-amber-200/50 space-y-2">
                        <div className="flex justify-between text-sm text-amber-800">
                            <span>Số ngày gia hạn thêm:</span>
                            <span className="font-bold">{extendDays} ngày</span>
                        </div>
                        <div className="flex justify-between text-sm text-amber-800 border-t border-amber-200/50 pt-2">
                            <span>Tiền thanh toán thêm:</span>
                            <span className="font-extrabold text-base">{formatPrice(totalExtendCost)}</span>
                        </div>
                    </div>
                )}

                <div className="rounded-lg bg-blue-50 p-3 text-xs text-blue-800 border border-blue-100">
                    <strong>Lưu ý:</strong> Tiền gia hạn sẽ được trừ trực tiếp từ ví cá nhân của bạn.
                    Nếu số dư ví không đủ, hệ thống sẽ chuyển hướng bạn tới trang nạp tiền.
                </div>
            </div>

            <div className="flex gap-3 border-t border-slate-200 p-4 mt-6">
                <button
                    onClick={handleClose}
                    className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                >
                    Hủy bỏ
                </button>
                <button
                    onClick={handleConfirmExtend}
                    disabled={extendDays <= 0 || isSubmitting}
                    className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${extendDays > 0 && !isSubmitting
                        ? "bg-yellow-500 text-white hover:bg-yellow-600"
                        : "bg-slate-100 text-slate-400 cursor-not-allowed"
                        }`}
                >
                    {isSubmitting ? "Đang xử lý..." : "Xác nhận & Thanh toán"}
                </button>
            </div>
        </Modal>
    );
}
