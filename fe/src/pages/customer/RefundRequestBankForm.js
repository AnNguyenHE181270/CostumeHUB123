import { useState, useEffect } from "react";
import rentalService from "../../services/rental.service";

// Form nhập thông tin ngân hàng để nhận hoàn tiền — nhân bản từ CancelRentalModal.js (không sửa/
// dùng chung với file đó, để không ảnh hưởng luồng huỷ đơn hiện có).
export default function RefundRequestBankForm({ orderId, onSubmitted }) {
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [banks, setBanks] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("https://api.vietqr.io/v2/banks")
      .then((res) => res.json())
      .then((data) => {
        if (data.code === "00") setBanks(data.data);
      })
      .catch((err) => console.error("Failed to fetch banks", err));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!bankName || !accountNumber || !accountName) {
      setError("Vui lòng nhập đầy đủ ngân hàng, số tài khoản và tên chủ tài khoản.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await rentalService.submitRefundInfo(orderId, { bankName, accountNumber, accountName });
      if (onSubmitted) onSubmitted({ bankName, accountNumber, accountName });
    } catch (err) {
      setError(err.message || "Gửi thông tin thất bại. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-4 border-t border-gray-100 pt-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Ngân hàng</label>
        <select
          value={bankName}
          onChange={(e) => setBankName(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
        >
          <option value="">-- Chọn ngân hàng --</option>
          {banks.map((bank) => (
            <option key={bank.bin} value={bank.shortName}>
              {bank.shortName} - {bank.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Số tài khoản</label>
        <input
          type="text"
          value={accountNumber}
          onChange={(e) => setAccountNumber(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
          placeholder="Nhập số tài khoản"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Tên chủ tài khoản</label>
        <input
          type="text"
          value={accountName}
          onChange={(e) => setAccountName(e.target.value.toUpperCase())}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm uppercase focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
          placeholder="NGUYEN VAN A"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-full py-3 bg-[#1a1a1a] text-white rounded-lg text-sm font-semibold hover:bg-black disabled:opacity-50 transition-colors"
      >
        {submitting ? "Đang gửi..." : "Gửi thông tin nhận hoàn tiền"}
      </button>
    </form>
  );
}
