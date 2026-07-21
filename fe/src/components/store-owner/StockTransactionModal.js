import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowDown, faArrowUp, faExclamationTriangle } from "@fortawesome/free-solid-svg-icons";
import Modal from "../Modal";
import stockTransactionService from "../../services/stockTransaction.service";
import { computeVariantBreakdown } from "../../utils/inventoryReport";

const REASONS = {
  in: [
    { value: "purchase_new", label: "Nhập mới mua về" },
    { value: "stock_correction_in", label: "Điều chỉnh kiểm kê (tăng)" },
  ],
  out: [
    { value: "damaged_writeoff", label: "Thanh lý do hư hỏng" },
    { value: "lost", label: "Mất hàng" },
    { value: "stock_correction_out", label: "Điều chỉnh kiểm kê (giảm)" },
  ],
};

export default function StockTransactionModal({ open, type, costume, variant, onClose, onSuccess, showToast }) {
  const [quantity, setQuantity] = useState("1");
  const [reason, setReason] = useState(REASONS[type]?.[0]?.value || "");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setQuantity("1");
      setReason(REASONS[type]?.[0]?.value || "");
      setNote("");
    }
  }, [open, type]);

  if (!open || !variant) return null;

  const isIn = type === "in";
  const totalStock = variant.totalStock || 0;
  const availableStock = variant.availableStock || 0;
  // Tách riêng "đang thuê" khỏi "đang bảo trì" từ instances[] — trước đây gộp chung bằng
  // totalStock - availableStock nên nhãn "Đang thuê" hiển thị sai khi có unit đang bảo trì.
  const { rented: rentedCount, maintenance: maintenanceCount } = computeVariantBreakdown(variant);
  const maxOut = availableStock;

  const qtyNum = Number(quantity) || 0;
  const invalidQty = !Number.isInteger(qtyNum) || qtyNum <= 0 || (!isIn && qtyNum > maxOut);
  const afterStock = isIn ? totalStock + qtyNum : totalStock - qtyNum;
  const afterAvailable = isIn ? availableStock + qtyNum : Math.max(0, availableStock - qtyNum);
  const lowStockThreshold = variant.lowStockThreshold ?? 3;
  const showLowStockWarning = !isIn && !invalidQty && qtyNum > 0 && afterAvailable <= lowStockThreshold;

  const handleSubmit = async () => {
    if (invalidQty) return;
    setSaving(true);
    try {
      await stockTransactionService.create({
        costumeId: costume._id,
        size: variant.size,
        type,
        reason,
        quantity: qtyNum,
        note,
      });
      showToast(isIn ? "Nhập kho thành công!" : "Xuất kho thành công!");
      onSuccess?.();
      onClose();
    } catch (err) {
      showToast(err.message || "Giao dịch thất bại", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title={isIn ? "Nhập kho" : "Xuất kho"}
      size="sm"
      footer={
        <>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-[#666] hover:bg-[#f0ece8] transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            disabled={invalidQty || saving}
            className={`px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
              isIn ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700"
            }`}
          >
            {saving ? "Đang lưu..." : isIn ? "Xác nhận nhập kho" : "Xác nhận xuất kho"}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
          <div
            className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
              isIn ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"
            }`}
          >
            <FontAwesomeIcon icon={isIn ? faArrowDown : faArrowUp} className="text-sm" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-[#1a1a1a] text-sm truncate">{costume?.name}</p>
            <p className="text-xs text-gray-500">
              Size {variant.size} · Tồn hiện tại: <b>{totalStock}</b> · Sẵn sàng: <b>{availableStock}</b>
              {rentedCount > 0 && <> · Đang thuê: <b>{rentedCount}</b></>}
              {maintenanceCount > 0 && <> · Đang bảo trì: <b>{maintenanceCount}</b></>}
            </p>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
            Số lượng {isIn ? "nhập" : "xuất"}
          </label>
          <input
            type="number"
            min={1}
            max={isIn ? undefined : maxOut}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className={`w-full px-3 py-2.5 border rounded-lg outline-none text-sm ${
              invalidQty ? "border-red-400 bg-red-50" : "border-gray-300 focus:ring-2 focus:ring-[#1a1a1a]"
            }`}
          />
          {!isIn && (
            <p className="text-xs text-gray-400 mt-1">
              Tối đa {maxOut} chiếc (không được xuất phần đang cho khách thuê)
            </p>
          )}
          {invalidQty && qtyNum > 0 && !isIn && qtyNum > maxOut && (
            <p className="text-xs text-red-500 mt-1">Vượt quá số lượng có thể xuất ({maxOut})</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Lý do</label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg outline-none text-sm focus:ring-2 focus:ring-[#1a1a1a] bg-white"
          >
            {REASONS[type].map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
            Ghi chú (không bắt buộc)
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg outline-none text-sm focus:ring-2 focus:ring-[#1a1a1a] resize-none"
            placeholder="Ví dụ: nhập từ nhà cung cấp X, hư hỏng do..."
          />
        </div>

        {!invalidQty && (
          <div className="text-xs text-center text-gray-500 bg-gray-50 rounded-lg py-2 px-2">
            Sau giao dịch: <span className="font-semibold text-[#1a1a1a]">Tổng {afterStock}</span>
            {" · "}
            <span className="font-semibold text-emerald-600">
              Sẵn {afterAvailable}
            </span>
          </div>
        )}

        {showLowStockWarning && (
          <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
            <FontAwesomeIcon icon={faExclamationTriangle} className="text-amber-500 mt-0.5 flex-shrink-0" />
            <span>
              Sau khi xuất, size {variant.size} chỉ còn <b>{afterAvailable}</b> chiếc sẵn sàng
              — đã chạm hoặc dưới ngưỡng cảnh báo (<b>{lowStockThreshold}</b>). Cân nhắc nhập thêm hàng sớm.
            </span>
          </div>
        )}
      </div>
    </Modal>
  );
}
