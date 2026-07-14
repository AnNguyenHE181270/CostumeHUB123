import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheckCircle, faWallet } from "@fortawesome/free-solid-svg-icons";

export default function TopupSuccessPage() {
  const [countdown, setCountdown] = useState(5);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate("/user/transactions");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] bg-white p-6 rounded-lg shadow-sm border border-gray-100 text-center">
      <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mb-6 shadow-sm">
        <FontAwesomeIcon icon={faCheckCircle} className="text-4xl" />
      </div>
      
      <h2 className="text-3xl font-bold text-gray-800 mb-4" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
        Nạp tiền thành công!
      </h2>
      
      <p className="text-gray-600 mb-8 max-w-md">
        Giao dịch nạp tiền của bạn đã được xử lý thành công. Số dư đã được cập nhật vào ví của bạn.
      </p>

      <div className="bg-gray-50 text-gray-500 px-6 py-3 rounded-full text-sm font-medium border border-gray-100 flex items-center gap-3">
        <FontAwesomeIcon icon={faWallet} />
        <span>Sẽ tự động chuyển đến Lịch sử giao dịch sau <strong className="text-black">{countdown}s</strong>...</span>
      </div>

      <button 
        onClick={() => navigate("/user/transactions")}
        className="mt-8 text-sm font-bold tracking-widest uppercase text-white bg-black px-8 py-3 rounded hover:bg-gray-800 transition-colors"
      >
        Xem lịch sử ngay
      </button>
    </div>
  );
}
