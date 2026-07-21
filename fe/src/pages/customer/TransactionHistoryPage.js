import React, { useEffect, useState } from "react";
import axiosClient from "../../api/axiosClient";
import { formatPrice } from "../../utils/formatters";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faWallet, faMoneyBillWave, faArrowRightArrowLeft, faClock, faCheckCircle, faTimesCircle } from "@fortawesome/free-solid-svg-icons";

export default function TransactionHistoryPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [rentals, setRentals] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true);
      try {
        const [transactionRes, rentalRes] = await Promise.all([
          axiosClient.get(`/api/vnpays/transaction-history`).catch(() => ({ data: [] })),
          axiosClient.get(`/api/rentals/rental-history`).catch(() => [])
        ]);

        // Chỉ lấy những giao dịch nạp tiền thành công
        const transactionData = (transactionRes.data || []).filter(t => t.status === "success" || t.status === "completed");
        const rentalData = Array.isArray(rentalRes) ? rentalRes : [];

        setTransactions(transactionData);
        setRentals(rentalData);
      } catch (error) {
        console.error("Failed to fetch transactions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  const getStatusBadge = (status) => {
    switch (status) {
      case "success":
      case "completed":
        return <span className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded text-xs font-semibold"><FontAwesomeIcon icon={faCheckCircle} /> Thành công</span>;
      case "pending":
        return <span className="flex items-center gap-1 text-yellow-600 bg-yellow-50 px-2 py-1 rounded text-xs font-semibold"><FontAwesomeIcon icon={faClock} /> Đang xử lý</span>;
      case "failed":
      case "cancelled":
        return <span className="flex items-center gap-1 text-red-600 bg-red-50 px-2 py-1 rounded text-xs font-semibold"><FontAwesomeIcon icon={faTimesCircle} /> Thất bại/Hủy</span>;
      default:
        return <span className="flex items-center gap-1 text-blue-600 bg-blue-50 px-2 py-1 rounded text-xs font-semibold"> Đang diễn ra</span>;
    }
  };

  const allActivities = [
    ...transactions.map(t => ({
      id: t._id,
      type: "transaction",
      title: "Nạp tiền vào ví (VNPay)",
      amount: t.amount,
      status: t.status,
      date: t.createdAt,
      ref: t.txnRef ? t.txnRef.replace(/[a-f0-9]{24}/i, '***') : ''
    })),
    ...rentals.map(r => {
      const rentalId = (r.id || r._id).toString();
      const shortId = rentalId.slice(-6).toUpperCase();
      return {
        id: rentalId,
        type: "rental",
        title: `Thanh toán đơn thuê #${shortId}`,
        amount: -(r.totalPrice || r.totalAmount || 0), // Âm vì là trừ tiền
        status: r.status,
        date: r.createdAt || r.startDate || new Date(),
        ref: r.trackingCode || `...${shortId}`
      };
    })
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  const filteredActivities = allActivities.filter(a => {
    if (activeTab !== "all" && a.type !== activeTab) return false;

    if (startDate) {
      const aDate = new Date(a.date).setHours(0, 0, 0, 0);
      const sDate = new Date(startDate).setHours(0, 0, 0, 0);
      if (aDate < sDate) return false;
    }

    if (endDate) {
      const aDate = new Date(a.date).setHours(0, 0, 0, 0);
      const eDate = new Date(endDate).setHours(0, 0, 0, 0);
      if (aDate > eDate) return false;
    }

    return true;
  });

  return (
    <div className="bg-white p-6 md:p-10 shadow-sm border border-gray-100 rounded-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
        <FontAwesomeIcon icon={faWallet} className="text-gray-400" />
        Lịch Sử Giao Dịch
      </h2>

      {/* Controls Container */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-4 mb-8 border-b border-gray-100 pb-4">
        {/* Tabs */}
        <div className="flex flex-wrap gap-2 w-full lg:w-auto">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-5 py-2.5 text-[13px] font-bold tracking-widest uppercase transition-colors rounded-t-md ${
              activeTab === "all" ? "bg-black text-white" : "bg-gray-50 text-gray-600 hover:bg-gray-100"
            }`}
          >
            <FontAwesomeIcon icon={faArrowRightArrowLeft} className="mr-2" />
            Tất cả
          </button>
          <button
            onClick={() => setActiveTab("transaction")}
            className={`px-5 py-2.5 text-[13px] font-bold tracking-widest uppercase transition-colors rounded-t-md ${
              activeTab === "transaction" ? "bg-black text-white" : "bg-gray-50 text-gray-600 hover:bg-gray-100"
            }`}
          >
            <FontAwesomeIcon icon={faMoneyBillWave} className="mr-2" />
            Nạp tiền
          </button>
          <button
            onClick={() => setActiveTab("rental")}
            className={`px-5 py-2.5 text-[13px] font-bold tracking-widest uppercase transition-colors rounded-t-md ${
              activeTab === "rental" ? "bg-black text-white" : "bg-gray-50 text-gray-600 hover:bg-gray-100"
            }`}
          >
            <FontAwesomeIcon icon={faWallet} className="mr-2" />
            Thuê đồ
          </button>
        </div>

        {/* Date Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded border border-gray-200">
            <span className="text-sm font-medium text-gray-500">Từ:</span>
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent text-sm border-none outline-none text-gray-700 cursor-pointer"
            />
          </div>
          <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded border border-gray-200">
            <span className="text-sm font-medium text-gray-500">Đến:</span>
            <input 
              type="date" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent text-sm border-none outline-none text-gray-700 cursor-pointer"
            />
          </div>
          {(startDate || endDate) && (
            <button 
              onClick={() => { setStartDate(""); setEndDate(""); }}
              className="text-xs text-red-500 hover:text-red-700 font-medium underline"
            >
              Xóa lọc
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto"></div>
        </div>
      ) : filteredActivities.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-lg border border-dashed border-gray-200">
          <FontAwesomeIcon icon={faWallet} className="text-4xl text-gray-300 mb-4" />
          <p className="text-gray-500 font-medium">Chưa có giao dịch nào.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredActivities.map((activity) => (
            <div key={activity.id} className="flex items-center justify-between p-4 sm:p-5 border border-gray-100 rounded-lg hover:shadow-md transition-shadow bg-white group">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${activity.type === 'transaction' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                  <FontAwesomeIcon icon={activity.type === 'transaction' ? faMoneyBillWave : faArrowRightArrowLeft} className="text-lg" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 text-sm sm:text-base group-hover:text-black transition-colors">{activity.title}</h3>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                    <span>{new Date(activity.date).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                </div>
              </div>
              
              <div className="text-right shrink-0">
                <div className={`font-bold text-sm sm:text-lg mb-1 ${activity.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {activity.amount > 0 ? '+' : ''}{formatPrice(activity.amount)}
                </div>
                <div className="flex justify-end">
                  {getStatusBadge(activity.status)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
