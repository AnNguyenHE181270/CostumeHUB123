import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faSave, faChevronRight, faLock } from "@fortawesome/free-solid-svg-icons";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:9999";

/**
 * Compute per-variant derived values from live product data + current edit value.
 *
 * rentedCount  = items currently checked out (cannot be reduced)
 * minStock     = minimum totalStock allowed = rentedCount
 * newTotal     = what the user typed (clamped ≥ minStock on save, warned in UI)
 * newAvail     = how many will be available after save  = newTotal - rentedCount
 * delta        = newTotal - oldTotal  (+positive = adding stock)
 */
function deriveVariant(v, editValue) {
  const oldTotal   = v.totalStock    || 0;
  const oldAvail   = v.availableStock || 0;
  const rentedCount = Math.max(0, oldTotal - oldAvail); // locked by active rentals
  const minStock   = rentedCount;

  const rawNew  = Number(editValue ?? oldTotal) || 0;
  const newTotal = Math.max(0, rawNew);              // frontend allows typing below min (shows warning)
  const newAvail = Math.max(0, newTotal - rentedCount);
  const delta    = newTotal - oldTotal;
  const belowMin = newTotal < minStock;              // invalid: would orphan rented items

  return { oldTotal, oldAvail, rentedCount, minStock, newTotal, newAvail, delta, belowMin };
}

const InventoryDetailDrawer = ({ product, onClose, onSaved, showToast }) => {
  const [edits, setEdits]   = useState({}); // { variantId: string }
  const [saving, setSaving] = useState(false);

  // Reset edits whenever the product data refreshes
  useEffect(() => {
    if (!product) return;
    const init = {};
    (product.variants || []).forEach(v => {
      init[v._id?.toString()] = String(v.totalStock ?? 0);
    });
    setEdits(init);
  }, [product]);

  if (!product) return null;

  const variants    = product.variants || [];
  const totalStock  = variants.reduce((s, v) => s + (v.totalStock    || 0), 0);
  const totalAvail  = variants.reduce((s, v) => s + (v.availableStock || 0), 0);
  const totalRented = totalStock - totalAvail;

  // Derive state for every variant so we can check validity
  const derivedList = variants.map(v => ({
    v,
    vid: v._id?.toString(),
    ...deriveVariant(v, edits[v._id?.toString()]),
  }));

  const hasChanges  = derivedList.some(({ delta }) => delta !== 0);
  const hasInvalid  = derivedList.some(({ belowMin }) => belowMin);

  // Update a single variant's edit value
  const setVal = (vid, raw) => {
    setEdits(prev => ({ ...prev, [vid]: String(Math.max(0, Number(raw) || 0)) }));
  };

  const handleSave = async () => {
    if (hasInvalid) {
      showToast("Không thể lưu: số lượng tổng kho không được thấp hơn số đang thuê", "error");
      return;
    }

    const payload = derivedList.map(({ v, newTotal }) => ({
      _id:        v._id,
      size:       v.size,
      totalStock: newTotal,
      // backend preserves all other fields (sku, bustSize, etc.) via existing.toObject() merge
    }));

    setSaving(true);
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/costumes/${product._id}`, {
        method:  "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ variants: payload }),
      });

      if (res.ok) {
        showToast("Cập nhật kho thành công!");
        onSaved(); // triggers re-fetch → edits auto-reset via useEffect
      } else {
        const err = await res.json();
        showToast(err.message || "Lỗi cập nhật kho", "error");
      }
    } catch {
      showToast("Lỗi kết nối máy chủ", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/25 backdrop-blur-[1px]" onClick={onClose} />

      {/* Drawer panel */}
      <div className="fixed right-0 top-0 bottom-0 z-50 w-[480px] bg-white shadow-2xl flex flex-col">

        {/* ── Breadcrumb header ── */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-1.5 text-sm min-w-0">
            <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition-colors flex-shrink-0">
              Kho hàng
            </button>
            <FontAwesomeIcon icon={faChevronRight} className="text-[9px] text-gray-300 flex-shrink-0" />
            <span className="text-[#1a1a1a] font-semibold truncate">{product.name}</span>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0 ml-2"
          >
            <FontAwesomeIcon icon={faTimes} className="text-sm" />
          </button>
        </div>

        {/* ── Product thumbnail ── */}
        <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-100 flex-shrink-0 bg-gray-50/60">
          <img
            src={product.images?.[0] || "https://placehold.co/48x48"}
            alt={product.name}
            className="w-11 h-11 rounded-lg object-cover border border-gray-200 flex-shrink-0"
            onError={e => { e.target.onerror = null; e.target.src = "https://placehold.co/48x48"; }}
          />
          <div className="min-w-0">
            <p className="font-semibold text-[#1a1a1a] text-sm truncate">{product.name}</p>
            <p className="text-xs text-gray-400">{product.categoryId?.name || "Chưa phân loại"}</p>
          </div>
        </div>

        {/* ── Aggregate 3-stat bar ── */}
        <div className="grid grid-cols-3 border-b border-gray-100 flex-shrink-0">
          <div className="text-center py-3 border-r border-gray-100">
            <p className="text-xl font-bold text-[#1a1a1a]">{totalStock}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">Tổng kho</p>
          </div>
          <div className="text-center py-3 border-r border-gray-100">
            <p className="text-xl font-bold text-emerald-600">{totalAvail}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">Sẵn sàng</p>
          </div>
          <div className="text-center py-3">
            <p className={`text-xl font-bold ${totalRented > 0 ? "text-orange-500" : "text-gray-300"}`}>
              {totalRented}
            </p>
            <p className="text-[11px] text-gray-400 mt-0.5">Đang thuê</p>
          </div>
        </div>

        {/* ── Per-variant cards ── */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
            Cập nhật tồn kho từng size
          </p>

          {variants.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm">
              Sản phẩm này chưa có biến thể nào
            </div>
          ) : (
            derivedList.map(({ v, vid, oldTotal, oldAvail, rentedCount, minStock, newTotal, newAvail, delta, belowMin }) => {
              const changed    = delta !== 0;
              const atMin      = newTotal <= minStock && minStock > 0;

              return (
                <div
                  key={vid}
                  className={`border rounded-xl p-4 transition-all ${
                    belowMin  ? "border-red-300 bg-red-50/40"    :
                    changed   ? "border-[#f94a00]/30 bg-orange-50/30" :
                                "border-gray-200 bg-white"
                  }`}
                >
                  {/* Card header: size badge + delta badge */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-bold text-sm bg-gray-100 text-[#1a1a1a] px-3 py-1 rounded-lg">
                      Size {v.size || "?"}
                    </span>
                    {changed && !belowMin && (
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        delta > 0 ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"
                      }`}>
                        {delta > 0 ? `+${delta}` : delta} chiếc
                      </span>
                    )}
                    {belowMin && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-600">
                        Không hợp lệ
                      </span>
                    )}
                  </div>

                  {/* 3 micro-stats: current state (always from DB, not affected by edits) */}
                  <div className="grid grid-cols-3 gap-2 mb-3 text-center text-xs">
                    <div className="bg-gray-50 rounded-lg py-2 px-1">
                      <p className="font-bold text-[#1a1a1a] text-sm">{oldTotal}</p>
                      <p className="text-gray-400 mt-0.5 leading-tight">Tổng hiện tại</p>
                    </div>
                    <div className="bg-emerald-50 rounded-lg py-2 px-1">
                      <p className="font-bold text-emerald-600 text-sm">{oldAvail}</p>
                      <p className="text-gray-400 mt-0.5 leading-tight">Sẵn sàng</p>
                    </div>
                    <div className={`rounded-lg py-2 px-1 ${rentedCount > 0 ? "bg-orange-50" : "bg-gray-50"}`}>
                      <p className={`font-bold text-sm ${rentedCount > 0 ? "text-orange-500" : "text-gray-300"}`}>
                        {rentedCount}
                      </p>
                      <p className="text-gray-400 mt-0.5 leading-tight">Đang thuê</p>
                    </div>
                  </div>

                  {/* Rented lock notice */}
                  {rentedCount > 0 && (
                    <div className="flex items-center gap-1.5 mb-2.5 text-[11px] text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5">
                      <FontAwesomeIcon icon={faLock} className="text-[10px] flex-shrink-0" />
                      <span>
                        <strong>{rentedCount}</strong> chiếc đang được khách thuê — tổng kho tối thiểu là <strong>{minStock}</strong>
                      </span>
                    </div>
                  )}

                  {/* Adjustment control */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 whitespace-nowrap flex-shrink-0">Tổng kho mới:</span>
                    <div className={`flex items-stretch border rounded-lg overflow-hidden flex-1 ${
                      belowMin ? "border-red-400" : "border-gray-300"
                    }`}>
                      <button
                        type="button"
                        onClick={() => setVal(vid, newTotal - 1)}
                        disabled={newTotal <= minStock}
                        className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 font-bold text-base border-r border-gray-300 transition-colors leading-none disabled:opacity-30 disabled:cursor-not-allowed"
                        title={newTotal <= minStock ? `Không thể giảm thêm — ${rentedCount} chiếc đang thuê` : "Giảm 1"}
                      >
                        −
                      </button>
                      <input
                        type="number"
                        min={minStock}
                        value={edits[vid] ?? oldTotal}
                        onChange={e => setVal(vid, e.target.value)}
                        className={`flex-1 text-center text-sm font-bold py-1.5 outline-none min-w-0 ${
                          belowMin ? "text-red-600 bg-red-50" : ""
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setVal(vid, newTotal + 1)}
                        className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 font-bold text-base border-l border-gray-300 transition-colors leading-none"
                        title="Thêm 1"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Preview after save / error message */}
                  {belowMin ? (
                    <p className="text-xs text-red-500 mt-2 text-center">
                      Nhập tối thiểu <strong>{minStock}</strong> (số chiếc đang được thuê)
                    </p>
                  ) : changed ? (
                    <div className="mt-2.5 text-xs text-center text-gray-500 bg-gray-50 rounded-lg py-1.5 px-2">
                      Sau lưu:&nbsp;
                      <span className="font-semibold text-[#1a1a1a]">Tổng {newTotal}</span>
                      &nbsp;·&nbsp;
                      <span className="font-semibold text-emerald-600">Sẵn {newAvail}</span>
                      &nbsp;·&nbsp;
                      <span className={`font-semibold ${rentedCount > 0 ? "text-orange-500" : "text-gray-400"}`}>
                        Thuê {rentedCount}
                      </span>
                    </div>
                  ) : null}
                </div>
              );
            })
          )}
        </div>

        {/* ── Footer ── */}
        <div className="px-5 py-4 border-t border-gray-100 flex-shrink-0 bg-gray-50/60 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-100 transition-colors"
          >
            Đóng
          </button>
          <button
            onClick={handleSave}
            disabled={!hasChanges || saving || hasInvalid}
            className="flex-1 px-4 py-2.5 bg-[#f94a00] text-white text-sm font-semibold rounded-xl hover:bg-[#e04200] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            title={hasInvalid ? "Có giá trị không hợp lệ, kiểm tra lại" : ""}
          >
            <FontAwesomeIcon icon={faSave} className="text-xs" />
            {saving ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
        </div>
      </div>
    </>
  );
};

export default InventoryDetailDrawer;
