import React, { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faWallet,
  faSpinner,
  faCircleCheck,
  faTriangleExclamation,
  faArrowUpRightFromSquare,
} from "@fortawesome/free-solid-svg-icons";
import Modal from "../Modal";
import Button from "../ui/Button";
import Input from "../ui/Input";
import { formatPrice } from "../../utils/formatters";
import { useAuth } from "../../context/AuthContext";
import paymentService from "../../services/payment.service";

const MIN_TOPUP = 10000;
const POLL_INTERVAL_MS = 4000;

// Nạp ví nhanh ngay tại Checkout: mở VNPAY ở tab mới (giữ nguyên trang Checkout, không mất dữ liệu
// đã nhập), rồi tự động theo dõi số dư và báo thành công khi VNPAY xử lý xong — không cần khách quay
// lại thao tác từ đầu.
export default function QuickTopUpModal({ isOpen, onClose, requiredAmount = 0, onSuccess }) {
  const { user, refreshProfile } = useAuth();
  const [amount, setAmount] = useState(requiredAmount);
  const [stage, setStage] = useState("form"); // form | submitting | waiting | success
  const [errorMsg, setErrorMsg] = useState("");
  const [fallbackUrl, setFallbackUrl] = useState(null);

  const popupRef = useRef(null);
  const balanceBeforeRef = useRef(0);

  useEffect(() => {
    if (isOpen) {
      setAmount(Math.max(requiredAmount, MIN_TOPUP));
      setStage("form");
      setErrorMsg("");
      setFallbackUrl(null);
    }
  }, [isOpen, requiredAmount]);

  // Theo dõi số dư khi đang chờ khách thanh toán ở tab VNPAY.
  useEffect(() => {
    if (stage !== "waiting") return undefined;
    const timer = setInterval(() => {
      refreshProfile();
    }, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  // Phát hiện nạp tiền thành công dựa trên số dư tăng đúng bằng khoản đã yêu cầu.
  useEffect(() => {
    if (stage !== "waiting") return;
    if (user?.balance != null && user.balance >= balanceBeforeRef.current + Number(amount)) {
      if (popupRef.current && !popupRef.current.closed) popupRef.current.close();
      setStage("success");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.balance, stage]);

  useEffect(() => {
    if (!isOpen && popupRef.current && !popupRef.current.closed) {
      popupRef.current.close();
      popupRef.current = null;
    }
  }, [isOpen]);

  const handleStartPayment = async () => {
    const amt = Number(amount);
    if (!amt || isNaN(amt) || amt < MIN_TOPUP) {
      setErrorMsg(`Số tiền nạp tối thiểu là ${formatPrice(MIN_TOPUP)}.`);
      return;
    }
    setErrorMsg("");
    setFallbackUrl(null);
    setStage("submitting");

    // Mở tab trắng NGAY trong sự kiện click (trước khi await) để trình duyệt không chặn popup.
    const popup = window.open("", "_blank");

    try {
      const data = await paymentService.createPaymentUrl(amt);
      if (!data?.success || !data?.paymentUrl) {
        throw new Error(data?.message || "Không thể tạo liên kết thanh toán VNPAY.");
      }

      if (popup) {
        popup.location.href = data.paymentUrl;
        popupRef.current = popup;
      } else {
        // Popup bị trình duyệt chặn — cho khách bấm mở thủ công thay vì kẹt luồng.
        setFallbackUrl(data.paymentUrl);
      }

      balanceBeforeRef.current = user?.balance || 0;
      setStage("waiting");
    } catch (err) {
      if (popup) popup.close();
      setErrorMsg(err.message || "Có lỗi xảy ra khi tạo thanh toán VNPAY.");
      setStage("form");
    }
  };

  const handleManualCheck = async () => {
    await refreshProfile();
  };

  const handleContinue = () => {
    onSuccess?.();
    onClose?.();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Nạp Nhanh Vào Ví"
      size="sm"
      closeOnOverlay={stage !== "waiting"}
    >
      {stage === "form" || stage === "submitting" ? (
        <div className="space-y-5">
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
            <FontAwesomeIcon icon={faTriangleExclamation} className="text-amber-500 mt-0.5 shrink-0" />
            <p className="text-[13px] text-amber-800 leading-relaxed">
              Số dư ví hiện không đủ để thanh toán đơn này. Nạp thêm để tiếp tục đặt thuê ngay tại đây,
              không cần rời khỏi trang.
            </p>
          </div>

          <Input
            label="Số tiền muốn nạp (VNĐ)"
            name="topUpAmount"
            type="number"
            min={MIN_TOPUP}
            step={1000}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Nhập số tiền"
          />

          {errorMsg && <p className="text-[12px] text-rose-600 font-medium">{errorMsg}</p>}

          <Button
            icon={faWallet}
            loading={stage === "submitting"}
            onClick={handleStartPayment}
            className="rounded-xl"
          >
            Nạp Qua VNPAY
          </Button>
        </div>
      ) : stage === "waiting" ? (
        <div className="space-y-5 text-center py-2">
          <FontAwesomeIcon icon={faSpinner} spin className="text-3xl text-[#b8935a]" />
          <div>
            <p className="text-[14px] font-semibold text-[#1a1a1a] mb-1">
              Đang chờ xác nhận thanh toán...
            </p>
            <p className="text-[12px] text-[#8a7d63] leading-relaxed">
              Vui lòng hoàn tất thanh toán {formatPrice(Number(amount))} trên tab VNPAY vừa mở. Trang này
              sẽ tự động cập nhật khi nạp tiền thành công.
            </p>
          </div>

          {fallbackUrl && (
            <a
              href={fallbackUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-[12px] font-semibold text-[#b8935a] hover:underline"
            >
              <FontAwesomeIcon icon={faArrowUpRightFromSquare} />
              Trình duyệt đã chặn tab mới — bấm để mở trang thanh toán VNPAY
            </a>
          )}

          <div className="flex flex-col gap-2 pt-2">
            <Button variant="secondary" onClick={handleManualCheck} className="rounded-xl">
              Tôi Đã Thanh Toán Xong — Kiểm Tra Lại
            </Button>
            <button
              type="button"
              onClick={() => setStage("form")}
              className="text-[12px] text-[#8a7d63] hover:text-[#1a1a1a] transition-colors"
            >
              Huỷ, quay lại
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-5 text-center py-2">
          <FontAwesomeIcon icon={faCircleCheck} className="text-4xl text-emerald-500" />
          <div>
            <p className="text-[14px] font-semibold text-[#1a1a1a] mb-1">Nạp tiền thành công!</p>
            <p className="text-[12px] text-[#8a7d63]">
              Số dư ví đã được cập nhật. Bạn có thể tiếp tục đặt thuê ngay.
            </p>
          </div>
          <Button onClick={handleContinue} className="rounded-xl">
            Tiếp Tục Đặt Hàng
          </Button>
        </div>
      )}
    </Modal>
  );
}
