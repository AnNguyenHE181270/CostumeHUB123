import React, { useState, useEffect } from "react";
import Modal from "../Modal";
import Input from "../ui/Input";
import Button from "../ui/Button";
import paymentService from "../../services/payment.service";
import { formatPrice } from "../../utils/formatters";
import axios from "axios";

export default function WithdrawModal({ isOpen, onClose, user, onWithdrawSuccess }) {
  const [amount, setAmount] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState(1);
  const [countdown, setCountdown] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  
  const [banks, setBanks] = useState([]);
  const [loadingBanks, setLoadingBanks] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setAmount("");
      setBankName("");
      setAccountNumber("");
      setAccountName("");
      setPassword("");
      setOtp("");
      setStep(1);
      setCountdown(0);
      setError("");
      
      // Fetch banks if not already fetched
      if (banks.length === 0) {
        setLoadingBanks(true);
        axios.get("https://api.vietqr.io/v2/banks")
          .then(res => {
            if (res.data && res.data.data) {
              setBanks(res.data.data);
            }
          })
          .catch(err => console.error("Failed to fetch banks", err))
          .finally(() => setLoadingBanks(false));
      }
    }
  }, [isOpen, banks.length]);

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError("");

    if (!amount || Number(amount) < 10000) {
      setError("Số tiền rút tối thiểu là 10.000đ");
      return;
    }
    if (Number(amount) > user?.balance) {
      setError("Số tiền rút vượt quá số dư khả dụng");
      return;
    }
    if (!bankName || !accountNumber || !accountName) {
      setError("Vui lòng điền đầy đủ thông tin ngân hàng");
      return;
    }
    if (!password) {
      setError("Vui lòng nhập mật khẩu để xác thực");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await paymentService.sendWithdrawOtp(password);
      if (res.success) {
        setStep(2);
        setCountdown(60);
      } else {
        setError(res.message || "Không thể gửi OTP.");
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Lỗi kết nối máy chủ");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmWithdraw = async (e) => {
    e.preventDefault();
    setError("");

    if (!otp) {
        setError("Vui lòng nhập mã OTP");
        return;
    }

    try {
      setIsSubmitting(true);
      const res = await paymentService.requestWithdraw({
        amount: Number(amount),
        bankName,
        accountNumber,
        accountName,
        otp
      });
      if (res.success) {
        onWithdrawSuccess(res.message || "Tạo yêu cầu rút tiền thành công.");
      } else {
        setError(res.message || "Không thể tạo yêu cầu rút tiền.");
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Lỗi kết nối máy chủ");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Yêu Cầu Rút Tiền"
      size="sm"
    >
      <form onSubmit={step === 1 ? handleRequestOtp : handleConfirmWithdraw} className="flex flex-col gap-5">
        {error && (
          <div className="bg-rose-50 text-rose-600 p-3 rounded-lg text-sm border border-rose-100">
            {error}
          </div>
        )}

        <div className="bg-yellow-50 text-yellow-800 p-3 rounded-lg text-[13px] border border-yellow-200">
          <strong>Lưu ý:</strong> Vui lòng nhập đúng địa chỉ và thông tin giao dịch. Chúng tôi sẽ không chịu trách nhiệm nếu thông tin bị sai sót.
        </div>

        {step === 1 ? (
          <>
            <div className="bg-[#fcfaf5] p-4 border border-[#f0e6d3] rounded-xl mb-2 text-center">
              <p className="text-[12px] text-[#858585] uppercase tracking-wider mb-1">Số dư khả dụng</p>
              <p className="text-2xl font-bold text-[#1a1a1a]">{formatPrice(user?.balance || 0)}</p>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-[#555] uppercase tracking-[0.1em] mb-2">
                Số tiền cần rút
              </label>
              <Input
                type="number"
                placeholder="Nhập số tiền (Tối thiểu 10,000đ)"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="!rounded-lg"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-[#555] uppercase tracking-[0.1em] mb-2">
                Ngân Hàng
              </label>
              <div className="relative">
                <select
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  required
                  className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-sm text-[#1a1a1a] outline-none transition-all duration-200 focus:border-black focus:ring-1 focus:ring-black appearance-none"
                >
                  <option value="" disabled>
                    {loadingBanks ? "Đang tải danh sách ngân hàng..." : "Chọn ngân hàng"}
                  </option>
                  {banks.map((bank) => (
                    <option key={bank.id} value={bank.shortName}>
                      {bank.shortName} - {bank.name}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-[#999]">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-[#555] uppercase tracking-[0.1em] mb-2">
                Số Tài Khoản
              </label>
              <Input
                type="text"
                placeholder="Nhập số tài khoản"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                required
                className="!rounded-lg"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-[#555] uppercase tracking-[0.1em] mb-2">
                Tên Chủ Tài Khoản
              </label>
              <Input
                type="text"
                placeholder="VD: NGUYEN VAN A"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                required
                className="!rounded-lg uppercase"
              />
            </div>

            <div className="border-t border-[#eaeaea] my-2"></div>

            <div>
              <label className="block text-[10px] font-bold text-[#555] uppercase tracking-[0.1em] mb-2">
                Mật Khẩu Xác Thực
              </label>
              <Input
                type="password"
                placeholder="Nhập mật khẩu tài khoản của bạn"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="!rounded-lg"
              />
            </div>
          </>
        ) : (
          <div className="text-center py-4">
            <h3 className="text-lg font-bold mb-2">Xác Thực OTP</h3>
            <p className="text-sm text-gray-500 mb-6">Mã xác thực đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư đến.</p>
            
            <div className="text-left mb-6">
              <label className="block text-[10px] font-bold text-[#555] uppercase tracking-[0.1em] mb-2">
                Nhập mã OTP
              </label>
              <Input
                type="text"
                placeholder="Nhập mã 6 chữ số"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
                className="!rounded-lg text-center tracking-[0.5em] text-lg font-bold"
                maxLength={6}
              />
            </div>

            <div className="text-center">
              <button
                type="button"
                disabled={countdown > 0 || isSubmitting}
                onClick={handleRequestOtp}
                className="text-[12px] font-semibold text-[#1a1a1a] hover:text-black disabled:text-gray-400 disabled:cursor-not-allowed underline transition-colors"
              >
                {countdown > 0 ? `Gửi lại mã sau (${countdown}s)` : "Gửi lại mã"}
              </button>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 mt-2 pt-4 border-t border-[#eaeaea]">
          <Button
            type="button"
            onClick={step === 2 ? () => {setStep(1); setOtp("");} : onClose}
            className="!bg-gray-100 !text-gray-700 hover:!bg-gray-200 !rounded-lg py-2.5 px-6 font-semibold tracking-wider text-[11px]"
          >
            {step === 2 ? "QUAY LẠI" : "HỦY"}
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="!rounded-lg bg-[#1a1a1a] hover:bg-black text-white py-2.5 px-6 font-semibold tracking-wider text-[11px]"
          >
            {isSubmitting ? "ĐANG XỬ LÝ..." : (step === 1 ? "TIẾP TỤC" : "XÁC NHẬN RÚT")}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
