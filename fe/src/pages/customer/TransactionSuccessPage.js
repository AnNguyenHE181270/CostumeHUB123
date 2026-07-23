import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheckCircle, faClock, faTimesCircle, faFileInvoiceDollar } from "@fortawesome/free-solid-svg-icons";
import axiosClient from "../../api/axiosClient";

export default function TransactionSuccessPage() {
  const [countdown, setCountdown] = useState(5);
  const [status, setStatus] = useState("loading"); // "loading", "success", "failed"
  const [message, setMessage] = useState("Đang xác thực giao dịch...");
  const navigate = useNavigate();
  const location = useLocation();
  const verifyAttempted = useRef(false);

  useEffect(() => {
    let timer;
    const verifyTransaction = async () => {
      if (verifyAttempted.current) return;
      verifyAttempted.current = true;
      
      try {
        if (!location.search) {
            setStatus("failed");
            setMessage("Không tìm thấy thông tin giao dịch.");
            return;
        }
        
        const res = await axiosClient.get(`/api/vnpay/vnpay-return${location.search}`);
        if (res.success) {
          setStatus("success");
          setMessage(res.message || "Thanh toán thành công! Đơn hàng của bạn đã được ghi nhận.");
        } else {
          setStatus("failed");
          setMessage(res.message || "Giao dịch thanh toán thất bại hoặc có lỗi xảy ra.");
        }
      } catch (err) {
        setStatus("failed");
        setMessage(err.response?.data?.message || err.message || "Lỗi xác thực giao dịch.");
      } finally {
        timer = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              navigate("/rental-history");
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    };

    verifyTransaction();

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [location.search, navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] bg-white p-6 rounded-lg shadow-sm border border-gray-100 text-center">
      {status === "loading" && (
        <div className="w-20 h-20 text-blue-500 rounded-full flex items-center justify-center mb-6 shadow-sm">
          <FontAwesomeIcon icon={faClock} className="text-4xl animate-pulse" />
        </div>
      )}
      {status === "success" && (
        <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mb-6 shadow-sm">
          <FontAwesomeIcon icon={faCheckCircle} className="text-4xl" />
        </div>
      )}
      {status === "failed" && (
        <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6 shadow-sm">
          <FontAwesomeIcon icon={faTimesCircle} className="text-4xl" />
        </div>
      )}
      
      <h2 className="text-3xl font-bold text-gray-800 mb-4" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
        {status === "loading" ? "Đang xử lý..." : status === "success" ? "Thanh toán thành công!" : "Thanh toán thất bại!"}
      </h2>
      
      <p className="text-gray-600 mb-8 max-w-md">
        {message}
      </p>

      {status !== "loading" && (
        <div className="bg-gray-50 text-gray-500 px-6 py-3 rounded-full text-sm font-medium border border-gray-100 flex items-center gap-3">
          <FontAwesomeIcon icon={faClock} />
          <span>Sẽ tự động chuyển đến Đơn hàng của bạn sau <strong className="text-black">{countdown}s</strong>...</span>
        </div>
      )}

      {status !== "loading" && (
        <button 
          onClick={() => navigate("/rental-history")}
          className="mt-8 text-sm font-bold tracking-widest uppercase text-white bg-black px-8 py-3 rounded hover:bg-gray-800 transition-colors flex items-center gap-2"
        >
          <FontAwesomeIcon icon={faFileInvoiceDollar} />
          Xem đơn hàng ngay
        </button>
      )}
    </div>
  );
}
