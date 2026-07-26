import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFileLines, faCircleCheck, faClock, faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import rentalService from "../../services/rental.service";
import { formatPrice, formatOrderId } from "../../utils/formatters";
import RefundRequestBankForm from "./RefundRequestBankForm";

// Trang riêng khách bấm vào từ link trong email sau khi staff kiểm tra đồ trả xong (hoặc khiếu nại
// được chấp nhận) — xem chi tiết hư hỏng/trừ tiền/còn lại bao nhiêu, và xác nhận + gửi thông tin
// ngân hàng để nhận hoàn tiền.
export default function RefundRequestPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showBankForm, setShowBankForm] = useState(false);

  const fetchOrder = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await rentalService.getDetail(orderId);
      setOrder(data);
    } catch (err) {
      setError(err.message || "Không tìm thấy đơn hàng hoặc bạn không có quyền xem đơn này.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  if (loading) {
    return <div className="max-w-2xl mx-auto py-20 text-center text-gray-400">Đang tải thông tin đơn hàng...</div>;
  }

  if (error || !order) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center">
        <p className="text-gray-500 mb-4">{error || "Không tìm thấy đơn hàng."}</p>
        <button onClick={() => navigate("/rental-history")} className="text-[#1a1a1a] underline text-sm">
          Về trang đơn hàng của tôi
        </button>
      </div>
    );
  }

  const refundDetails = order.refundDetails;
  const netRefund = Math.max(0, (order.refundAmount || 0) - (order.replacementFee || 0));
  const isRefundCompleted = refundDetails?.status === "completed";
  const isCustomerConfirmed = refundDetails?.confirmedByCustomer === true;

  return (
    <div className="max-w-2xl mx-auto my-10 px-4">
      <button
        onClick={() => navigate("/rental-history")}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-black mb-6 transition-colors"
      >
        <FontAwesomeIcon icon={faArrowLeft} /> Về trang đơn hàng của tôi
      </button>

      <div className="bg-white border border-[#eaeaea] rounded-xl shadow-sm p-6 sm:p-8">
        <h1 className="text-xl font-bold text-[#1a1a1a] mb-1" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
          Chi tiết hoàn tiền — Đơn {formatOrderId(orderId)}
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          Cửa hàng đã kiểm tra xong trang phục bạn trả lại. Dưới đây là chi tiết số tiền bị trừ (nếu có) và số tiền sẽ được hoàn lại.
        </p>

        {/* Breakdown hư hỏng/trừ tiền/còn lại — mirror "Phí phát sinh & Hoàn tiền" ở RentalDetail.js */}
        <div className="rounded-lg border border-[#eaeaea] p-4 mb-6">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-500 mb-3">
            <FontAwesomeIcon icon={faFileLines} />
            <span>Phí phát sinh & Hoàn tiền</span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Tiền cọc đã thu</span>
              <span className="font-medium text-[#1a1a1a]">{formatPrice(order.payment?.deposit || 0)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Phí trễ hạn</span>
              <span className={order.lateFee > 0 ? "font-medium text-red-600" : "text-[#1a1a1a]"}>
                {order.lateFee > 0 ? "-" : ""}{formatPrice(order.lateFee || 0)}
              </span>
            </div>
            {order.damageFee > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Phí hư hỏng ({order.damagePercent}% cọc)</span>
                <span className="font-medium text-red-600">-{formatPrice(order.damageFee)}</span>
              </div>
            )}
            {order.replacementFee > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Phí bồi thường vượt cọc</span>
                <span className="font-medium text-red-600">-{formatPrice(order.replacementFee)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-[#eaeaea] pt-2">
              <span className="font-semibold text-[#1a1a1a]">Số tiền được hoàn lại</span>
              <span className="text-lg font-bold text-emerald-600">{formatPrice(netRefund)}</span>
            </div>
          </div>
        </div>

        {isRefundCompleted ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-center">
            <FontAwesomeIcon icon={faCircleCheck} className="text-emerald-500 text-3xl mb-2" />
            <p className="font-semibold text-emerald-700">Cửa hàng đã hoàn tất chuyển khoản</p>
            <p className="text-sm text-emerald-600 mt-1">Vui lòng kiểm tra tài khoản ngân hàng của bạn.</p>
          </div>
        ) : isCustomerConfirmed ? (
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-5">
            <div className="flex items-center gap-2 text-blue-700 font-semibold mb-2">
              <FontAwesomeIcon icon={faClock} />
              Đã xác nhận — đang chờ cửa hàng chuyển khoản
            </div>
            <p className="text-sm text-blue-700">
              Bạn đã gửi thông tin nhận hoàn tiền. Cửa hàng sẽ chuyển khoản trong thời gian sớm nhất.
            </p>
            <div className="mt-3 text-sm text-blue-800 bg-white/60 border border-blue-100 rounded-lg px-3 py-2 space-y-0.5">
              <p>Ngân hàng: <strong>{refundDetails.bankName}</strong></p>
              <p>Số tài khoản: <strong>{refundDetails.accountNumber}</strong></p>
              <p>Chủ tài khoản: <strong>{refundDetails.accountName}</strong></p>
            </div>
          </div>
        ) : netRefund <= 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">Đơn hàng này không có khoản tiền nào cần hoàn lại.</p>
        ) : !showBankForm ? (
          <button
            onClick={() => setShowBankForm(true)}
            className="w-full py-3 bg-[#1a1a1a] text-white rounded-lg text-sm font-semibold hover:bg-black transition-colors"
          >
            Chấp nhận
          </button>
        ) : (
          <RefundRequestBankForm orderId={orderId} onSubmitted={() => fetchOrder()} />
        )}
      </div>
    </div>
  );
}
