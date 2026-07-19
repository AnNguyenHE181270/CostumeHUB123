import React, { useState, useEffect } from "react";
import Modal from "../../components/Modal";
import { formatPrice } from "../../utils/formatters";
import Toast from "../../components/ui/Toast";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBox, faTriangleExclamation, faCircleInfo, faCalendarDay } from "@fortawesome/free-solid-svg-icons";
import { statusOrder } from "../../constants/statusOrder";
import rentalService from "../../services/rental.service";
import { getRentalPriceFactor } from "../../utils/formatters";

export function ExtendRentalModal({ open, onOpenChange, order, onConfirm }) {
  const navigate = useNavigate();
  const [newEndDate, setNewEndDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState({ isVisible: false, message: "", type: "success" });

  const statusInfo = typeof order?.status === "object" ? order?.status : (statusOrder[order?.status] || null);
  const items = order?.items || [];

  // Tính số ngày thuê hiện tại của đơn hàng
  // Danh sách đơn hàng (RentalHistoryPage) trả startDate/endDate đã format "dd/mm/yyyy" (không parse được),
  // giá trị gốc nằm ở rawStartDate/rawEndDate; trang chi tiết đơn thì startDate/endDate đã là giá trị gốc.
  const rawStart = order?.rawStartDate || order?.startDate;
  const rawEnd = order?.rawEndDate || order?.endDate;
  const startDateObj = rawStart ? new Date(rawStart) : null;
  const endDateObj = rawEnd ? new Date(rawEnd) : null;
  const startZero = startDateObj ? new Date(startDateObj.getFullYear(), startDateObj.getMonth(), startDateObj.getDate()) : null;
  const endZero = endDateObj ? new Date(endDateObj.getFullYear(), endDateObj.getMonth(), endDateObj.getDate()) : null;

  const currentRentalDays = (startZero && endZero)
    ? Math.max(1, Math.ceil((endZero.getTime() - startZero.getTime()) / (1000 * 60 * 60 * 24)))
    : 1;

  // Lấy hạn mức maxRentalDays nhỏ nhất của các sản phẩm trong đơn (mặc định 7 nếu không có)
  const itemMaxLimits = items.map((item) => Number(item.maxRentalDays) || 7);
  const maxAllowedTotalDays = itemMaxLimits.length > 0 ? Math.min(...itemMaxLimits) : 7;

  // Số ngày tối đa còn có thể gia hạn THÊM
  const maxExtendableDays = Math.max(0, maxAllowedTotalDays - currentRentalDays);
  const isExtendable = maxExtendableDays > 0;

  // Ngày trả tối thiểu (ngày trả hiện tại + 1 ngày)
  const minDateString = endZero
    ? (() => {
        const nextDay = new Date(endZero);
        nextDay.setDate(nextDay.getDate() + 1);
        return nextDay.toISOString().split("T")[0];
      })()
    : "";

  // Ngày trả tối đa cho phép gia hạn (ngày trả hiện tại + maxExtendableDays)
  const maxEndDateObj = endZero && isExtendable
    ? new Date(endZero.getTime() + maxExtendableDays * 24 * 60 * 60 * 1000)
    : null;
  const maxDateString = maxEndDateObj ? maxEndDateObj.toISOString().split("T")[0] : minDateString;

  useEffect(() => {
    if (open && isExtendable && minDateString) {
      setNewEndDate(minDateString);
    } else {
      setNewEndDate("");
    }
  }, [open, order, isExtendable, minDateString]);

  if (!order) return null;

  const getExtendDays = () => {
    if (!newEndDate || !endZero) return 0;
    const end = new Date(newEndDate);
    const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    const diff = endDay.getTime() - endZero.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const extendDays = getExtendDays();
  const totalDaysAfterExtend = currentRentalDays + extendDays;

  // Giá thuê là mức phí trọn gói cho 1-3 ngày đầu; gia hạn chỉ tính thêm phần phụ phí phát sinh
  // khi tổng số ngày vượt qua mốc đã tính trước đó (chênh lệch hệ số giá) — phải khớp công thức backend.
  const oldPriceFactor = getRentalPriceFactor(currentRentalDays);
  const newPriceFactor = getRentalPriceFactor(totalDaysAfterExtend);
  const totalExtendCost = items.reduce((sum, item) => {
    const rate = item.rentalPerDay || 0;
    return sum + rate * (newPriceFactor - oldPriceFactor) * (item.quantity || 1);
  }, 0);

  // Validate nếu người dùng cố chọn ngày vượt hạn mức max
  const isOverMaxLimit = extendDays > maxExtendableDays;

  const handleClose = () => {
    onOpenChange(false);
  };

  const handleConfirmExtend = async () => {
    if (!isExtendable || extendDays <= 0 || isOverMaxLimit) return;

    setIsSubmitting(true);
    try {
      const orderId = order.orderId || order.id || order._id;
      const data = await rentalService.extendRental(orderId, newEndDate);

      if (data.success) {
        setToast({ isVisible: true, message: "Gia hạn thời gian thuê thành công!", type: "success" });
        setTimeout(() => {
          if (onConfirm) onConfirm();
          handleClose();
        }, 1500);
      } else if (data.insufficientBalance) {
        setToast({ isVisible: true, message: "Số dư trong ví không đủ. Đang chuyển sang trang cá nhân...", type: "error" });
        setTimeout(() => {
          navigate("/user/my-profile");
          handleClose();
        }, 2500);
      } else {
        setToast({ isVisible: true, message: data.message || "Gia hạn thuê thất bại.", type: "error" });
      }
    } catch (err) {
      const msg = err.message || "";
      if (msg.includes("Số dư") || msg.includes("không đủ")) {
        setToast({ isVisible: true, message: "Số dư trong ví không đủ. Đang chuyển sang trang cá nhân...", type: "error" });
        setTimeout(() => {
          navigate("/user/my-profile");
          handleClose();
        }, 2500);
      } else {
        setToast({ isVisible: true, message: msg || "Lỗi kết nối đến máy chủ.", type: "error" });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={open} onClose={handleClose} title="Gia Hạn Thời Gian Thuê">
      <Toast
        isVisible={toast.isVisible}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, isVisible: false })}
      />

      {/* Thông tin trang phục trong đơn */}
      {order?.items?.map((item, index) => (
        <div key={index} className="rounded-xl border border-slate-200 p-3 mb-3 bg-white shadow-sm">
          <div className="flex gap-3 items-center">
            <div className="h-16 w-14 shrink-0 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200">
              {item.image ? (
                <img src={item.image} alt={item.costumeName} className="h-full w-full object-cover" />
              ) : (
                <FontAwesomeIcon icon={faBox} className="h-6 w-6 text-slate-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-base font-bold text-slate-800 truncate" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                  {item.costumeName}
                </h3>
                {index === 0 && statusInfo && (
                  <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold shrink-0 ${statusInfo.className || ""}`}>
                    {statusInfo.label}
                  </span>
                )}
              </div>
              <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-slate-500 font-medium">
                {item.size && <span>Size: <strong>{item.size}</strong></span>}
                <span>Số lượng: <strong>{item.quantity}</strong></span>
                <span>Tối đa: <strong className="text-amber-700">{item.maxRentalDays || 7} ngày thuê</strong></span>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Cảnh báo / Hạn mức gia hạn */}
      <div className="space-y-4 my-4">
        {!isExtendable ? (
          <div className="rounded-xl bg-rose-50 p-4 border border-rose-200 text-rose-800 text-xs space-y-1.5 shadow-sm">
            <div className="font-bold flex items-center gap-2 text-sm text-rose-900">
              <FontAwesomeIcon icon={faTriangleExclamation} className="text-rose-600 text-base" />
              Không Thể Gia Hạn Thêm
            </div>
            <p className="leading-relaxed">
              Sản phẩm trong đơn hàng này chỉ giới hạn thuê tối đa <strong>{maxAllowedTotalDays} ngày</strong>.
              Đơn hàng của bạn hiện đã thuê đủ <strong>{currentRentalDays}/{maxAllowedTotalDays} ngày</strong> giới hạn cho phép nên không thể kéo dài thêm thời gian thuê.
            </p>
          </div>
        ) : (
          <div className="rounded-xl bg-amber-50/80 p-3.5 border border-amber-200/80 text-amber-900 text-xs space-y-1 shadow-sm">
            <div className="font-bold flex items-center gap-2 text-amber-950 text-xs uppercase tracking-wider">
              <FontAwesomeIcon icon={faCircleInfo} className="text-amber-600 text-sm" />
              Hạn Mức Thuê Trang Phục
            </div>
            <p className="leading-relaxed">
              Đơn hàng đang thuê <strong>{currentRentalDays} ngày</strong> (Tối đa <strong>{maxAllowedTotalDays} ngày</strong>). Bạn có thể chọn gia hạn thêm tối đa <strong>{maxExtendableDays} ngày</strong> (Ngày trả mới muộn nhất là <strong>{maxEndDateObj ? maxEndDateObj.toLocaleDateString("vi-VN") : ""}</strong>).
            </p>
          </div>
        )}

        {/* Khung chọn ngày */}
        {isExtendable && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                Ngày trả hiện tại:
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={endZero ? endZero.toISOString().split("T")[0] : ""}
                  disabled
                  className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-500 font-semibold outline-none cursor-not-allowed"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center justify-between">
                <span>Chọn ngày trả mới:</span>
                <span className="text-[10px] text-amber-700 font-bold lowercase">
                  (Muộn nhất: {maxEndDateObj ? maxEndDateObj.toLocaleDateString("vi-VN") : ""})
                </span>
              </label>
              <input
                type="date"
                min={minDateString}
                max={maxDateString}
                value={newEndDate}
                onChange={(e) => setNewEndDate(e.target.value)}
                className={`w-full bg-slate-50 border rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 outline-none transition-all ${
                  isOverMaxLimit
                    ? "border-rose-500 focus:ring-1 focus:ring-rose-500"
                    : "border-slate-300 focus:border-black focus:ring-1 focus:ring-black"
                }`}
              />
            </div>
          </div>
        )}

        {isOverMaxLimit && (
          <p className="text-xs text-rose-600 font-semibold flex items-center gap-1">
            <FontAwesomeIcon icon={faTriangleExclamation} />
            Ngày bạn chọn vượt quá hạn mức tối đa cho phép ({maxAllowedTotalDays} ngày). Vui lòng chọn lại.
          </p>
        )}

        {isExtendable && extendDays > 0 && !isOverMaxLimit && (
          <div className="bg-gradient-to-r from-amber-50 to-amber-100/60 p-4 rounded-xl border border-amber-200/80 space-y-2 shadow-sm">
            <div className="flex justify-between text-xs text-amber-900 font-medium">
              <span>Số ngày gia hạn thêm:</span>
              <span className="font-bold text-sm">{extendDays} ngày</span>
            </div>
            <div className="flex justify-between text-xs text-amber-900 border-t border-amber-200/60 pt-2 items-baseline">
              <span>Cước phí gia hạn phát sinh:</span>
              <span className="font-extrabold text-lg text-amber-950">{formatPrice(totalExtendCost)}</span>
            </div>
          </div>
        )}

        {isExtendable && (
          <div className="rounded-xl bg-blue-50/70 p-3 text-[11px] text-blue-900 border border-blue-100 leading-relaxed">
            <strong>Lưu ý:</strong> Tiền gia hạn sẽ được trừ trực tiếp từ ví cá nhân của bạn.
            Nếu số dư ví không đủ, hệ thống sẽ tự động thông báo và hướng dẫn nạp thêm.
          </div>
        )}
      </div>

      <div className="flex gap-3 border-t border-slate-200 pt-4 mt-4">
        <button
          onClick={handleClose}
          className="flex-1 rounded-xl border border-slate-300 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-700 transition-colors hover:bg-slate-100"
        >
          Hủy Bỏ
        </button>
        <button
          onClick={handleConfirmExtend}
          disabled={!isExtendable || extendDays <= 0 || isOverMaxLimit || isSubmitting}
          className={`flex-1 rounded-xl px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-all shadow-md ${
            isExtendable && extendDays > 0 && !isOverMaxLimit && !isSubmitting
              ? "bg-[#1a1a1a] text-[#f5e6ca] hover:bg-amber-600 hover:text-white"
              : "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
          }`}
        >
          {isSubmitting ? "Đang xử lý..." : "Xác Nhận & Thanh Toán"}
        </button>
      </div>
    </Modal>
  );
}
