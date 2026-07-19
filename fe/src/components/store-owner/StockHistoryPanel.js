import React, { useState, useEffect, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowDown, faArrowUp, faSpinner } from "@fortawesome/free-solid-svg-icons";
import DataTable from "../ui/DataTable";
import Pagination from "../ui/Pagination";
import stockTransactionService from "../../services/stockTransaction.service";

const PAGE_SIZE = 15;

const REASON_LABEL = {
  purchase_new: "Nhập mới mua về",
  stock_correction_in: "Điều chỉnh kiểm kê (tăng)",
  damaged_writeoff: "Thanh lý do hư hỏng",
  lost: "Mất hàng",
  stock_correction_out: "Điều chỉnh kiểm kê (giảm)",
};

const formatDateTime = (d) =>
  d ? new Date(d).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "";

export default function StockHistoryPanel({ refreshKey }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: currentPage, limit: PAGE_SIZE };
      if (typeFilter !== "all") params.type = typeFilter;
      const data = await stockTransactionService.getHistory(params);
      setTransactions(data.transactions || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalItems(data.pagination?.totalItems || 0);
    } catch {
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, typeFilter]);

  useEffect(() => { fetchHistory(); }, [fetchHistory, refreshKey]);
  useEffect(() => { setCurrentPage(1); }, [typeFilter]);

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl p-5 border border-[#f0f0f0] shadow-sm flex items-center gap-4">
        <span className="text-xs font-semibold text-[#999] uppercase tracking-wider">Lọc:</span>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-4 py-2 border border-[#eaeaea] rounded-xl outline-none focus:ring-2 focus:ring-[#1a1a1a] text-sm bg-white text-[#555]"
        >
          <option value="all">Tất cả giao dịch</option>
          <option value="in">Chỉ nhập kho</option>
          <option value="out">Chỉ xuất kho</option>
        </select>
        <span className="text-xs text-gray-400 ml-auto">{totalItems} giao dịch</span>
      </div>

      <DataTable
        isLoading={loading}
        isEmpty={!loading && transactions.length === 0}
        emptyMessage="Chưa có giao dịch nhập/xuất kho nào"
        footer={
          <div className="p-4 border-t border-[#f0f0f0]">
            <Pagination
              displayCount={transactions.length}
              totalCount={totalItems}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        }
      >
        <thead>
          <tr className="border-b border-[#f0f0f0] bg-gray-50/50">
            <th className="py-4 px-6 text-xs font-semibold text-[#999] uppercase tracking-wider">Thời gian</th>
            <th className="py-4 px-6 text-xs font-semibold text-[#999] uppercase tracking-wider w-[26%]">Sản phẩm</th>
            <th className="py-4 px-6 text-xs font-semibold text-[#999] uppercase tracking-wider text-center">Loại</th>
            <th className="py-4 px-6 text-xs font-semibold text-[#999] uppercase tracking-wider">Lý do</th>
            <th className="py-4 px-6 text-xs font-semibold text-[#999] uppercase tracking-wider text-center">SL</th>
            <th className="py-4 px-6 text-xs font-semibold text-[#999] uppercase tracking-wider text-center">Trước → Sau</th>
            <th className="py-4 px-6 text-xs font-semibold text-[#999] uppercase tracking-wider">Người thực hiện</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#f0f0f0]">
          {loading ? (
            <tr>
              <td colSpan={7} className="py-10 text-center text-gray-400">
                <FontAwesomeIcon icon={faSpinner} spin />
              </td>
            </tr>
          ) : transactions.map((tx) => (
            <tr key={tx._id} className="hover:bg-[#faf9f7] transition-colors">
              <td className="py-3.5 px-6 text-[13px] text-[#555] whitespace-nowrap">{formatDateTime(tx.createdAt)}</td>
              <td className="py-3.5 px-6">
                <div className="flex items-center gap-2.5 min-w-0">
                  <img
                    src={tx.costumeId?.images?.[0] || "https://placehold.co/32x32"}
                    alt=""
                    className="w-8 h-8 rounded-md object-cover bg-[#f5f5f5] border border-[#eaeaea] flex-shrink-0"
                    onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/32x32"; }}
                  />
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-[#1a1a1a] truncate">{tx.costumeId?.name || "—"}</p>
                    <p className="text-[11px] text-gray-400">Size {tx.size}</p>
                  </div>
                </div>
              </td>
              <td className="py-3.5 px-6 text-center">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                  tx.type === "in" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"
                }`}>
                  <FontAwesomeIcon icon={tx.type === "in" ? faArrowDown : faArrowUp} className="text-[9px]" />
                  {tx.type === "in" ? "Nhập" : "Xuất"}
                </span>
              </td>
              <td className="py-3.5 px-6 text-[13px] text-[#555]">{REASON_LABEL[tx.reason] || tx.reason}</td>
              <td className="py-3.5 px-6 text-center">
                <span className={`font-bold text-sm ${tx.type === "in" ? "text-emerald-600" : "text-red-600"}`}>
                  {tx.type === "in" ? "+" : "-"}{tx.quantity}
                </span>
              </td>
              <td className="py-3.5 px-6 text-center text-[13px] text-gray-500 whitespace-nowrap">
                {tx.beforeStock} → <span className="font-semibold text-[#1a1a1a]">{tx.afterStock}</span>
              </td>
              <td className="py-3.5 px-6 text-[13px] text-[#555]">{tx.performedBy?.fullName || "—"}</td>
            </tr>
          ))}
        </tbody>
      </DataTable>
    </div>
  );
}
