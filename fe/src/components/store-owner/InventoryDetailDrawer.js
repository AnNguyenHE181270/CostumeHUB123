import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faChevronRight, faLock, faArrowDown, faArrowUp } from "@fortawesome/free-solid-svg-icons";
import StockTransactionModal from "./StockTransactionModal";
import { computeVariantBreakdown } from "../../utils/inventoryReport";

const InventoryDetailDrawer = ({ product, onClose, onSaved, showToast }) => {
  const [txModal, setTxModal] = useState({ open: false, type: "in", variant: null });

  if (!product) return null;

  const variants = product.variants || [];
  // Tách riêng "đang thuê" và "đang bảo trì" từ instances[] — trước đây gộp chung bằng
  // totalStock - availableStock nên unit đang bảo trì bị hiển thị nhầm là "đang thuê".
  const breakdowns = variants.map((v) => computeVariantBreakdown(v));
  const totalStock = breakdowns.reduce((s, b) => s + b.total, 0);
  const totalAvail = breakdowns.reduce((s, b) => s + b.available, 0);
  const totalRented = breakdowns.reduce((s, b) => s + b.rented, 0);
  const totalMaintenance = breakdowns.reduce((s, b) => s + b.maintenance, 0);

  const openTx = (type, variant) => setTxModal({ open: true, type, variant });
  const closeTx = () => setTxModal((prev) => ({ ...prev, open: false }));
  const handleTxSuccess = () => onSaved();

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

        {/* ── Aggregate stat bar ── */}
        <div className="grid grid-cols-4 border-b border-gray-100 flex-shrink-0">
          <div className="text-center py-3 border-r border-gray-100">
            <p className="text-xl font-bold text-[#1a1a1a]">{totalStock}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">Tổng kho</p>
          </div>
          <div className="text-center py-3 border-r border-gray-100">
            <p className="text-xl font-bold text-emerald-600">{totalAvail}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">Sẵn sàng</p>
          </div>
          <div className="text-center py-3 border-r border-gray-100">
            <p className={`text-xl font-bold ${totalRented > 0 ? "text-orange-500" : "text-gray-300"}`}>
              {totalRented}
            </p>
            <p className="text-[11px] text-gray-400 mt-0.5">Đang thuê</p>
          </div>
          <div className="text-center py-3">
            <p className={`text-xl font-bold ${totalMaintenance > 0 ? "text-amber-600" : "text-gray-300"}`}>
              {totalMaintenance}
            </p>
            <p className="text-[11px] text-gray-400 mt-0.5">Bảo trì</p>
          </div>
        </div>

        {/* ── Per-variant cards ── */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
            Nhập / Xuất kho theo từng size
          </p>

          {variants.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm">
              Sản phẩm này chưa có biến thể nào
            </div>
          ) : (
            variants.map((v, idx) => {
              const vid = v._id?.toString();
              const { total: vTotal, available: vAvail, rented: vRented, maintenance: vMaintenance } = breakdowns[idx];

              return (
                <div key={vid} className="border border-gray-200 rounded-xl p-4 bg-white">
                  {/* Card header: size badge */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-bold text-sm bg-gray-100 text-[#1a1a1a] px-3 py-1 rounded-lg">
                      Size {v.size || "?"}
                    </span>
                  </div>

                  {/* 4 micro-stats */}
                  <div className="grid grid-cols-4 gap-2 mb-3 text-center text-xs">
                    <div className="bg-gray-50 rounded-lg py-2 px-1">
                      <p className="font-bold text-[#1a1a1a] text-sm">{vTotal}</p>
                      <p className="text-gray-400 mt-0.5 leading-tight">Tổng kho</p>
                    </div>
                    <div className="bg-emerald-50 rounded-lg py-2 px-1">
                      <p className="font-bold text-emerald-600 text-sm">{vAvail}</p>
                      <p className="text-gray-400 mt-0.5 leading-tight">Sẵn sàng</p>
                    </div>
                    <div className={`rounded-lg py-2 px-1 ${vRented > 0 ? "bg-orange-50" : "bg-gray-50"}`}>
                      <p className={`font-bold text-sm ${vRented > 0 ? "text-orange-500" : "text-gray-300"}`}>
                        {vRented}
                      </p>
                      <p className="text-gray-400 mt-0.5 leading-tight">Đang thuê</p>
                    </div>
                    <div className={`rounded-lg py-2 px-1 ${vMaintenance > 0 ? "bg-amber-50" : "bg-gray-50"}`}>
                      <p className={`font-bold text-sm ${vMaintenance > 0 ? "text-amber-600" : "text-gray-300"}`}>
                        {vMaintenance}
                      </p>
                      <p className="text-gray-400 mt-0.5 leading-tight">Bảo trì</p>
                    </div>
                  </div>

                  {/* Rented/maintenance lock notice — cả 2 loại đều không thể xuất qua thao tác này */}
                  {(vRented > 0 || vMaintenance > 0) && (
                    <div className="flex items-center gap-1.5 mb-3 text-[11px] text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5">
                      <FontAwesomeIcon icon={faLock} className="text-[10px] flex-shrink-0" />
                      <span>
                        {vRented > 0 && <><strong>{vRented}</strong> chiếc đang được khách thuê</>}
                        {vRented > 0 && vMaintenance > 0 && ', '}
                        {vMaintenance > 0 && <><strong>{vMaintenance}</strong> chiếc đang bảo trì</>}
                        {' '}— chỉ có thể xuất tối đa <strong>{vAvail}</strong> chiếc
                      </span>
                    </div>
                  )}

                  {/* Nhập / Xuất actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => openTx("in", v)}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition-colors"
                    >
                      <FontAwesomeIcon icon={faArrowDown} className="text-[10px]" />
                      Nhập kho
                    </button>
                    <button
                      onClick={() => openTx("out", v)}
                      disabled={vAvail === 0}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-red-700 bg-red-50 border border-red-200 hover:bg-red-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      title={vAvail === 0 ? "Không còn hàng để xuất" : ""}
                    >
                      <FontAwesomeIcon icon={faArrowUp} className="text-[10px]" />
                      Xuất kho
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ── Footer ── */}
        <div className="px-5 py-4 border-t border-gray-100 flex-shrink-0 bg-gray-50/60">
          <button
            onClick={onClose}
            className="w-full px-4 py-2.5 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-100 transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>

      <StockTransactionModal
        open={txModal.open}
        type={txModal.type}
        costume={product}
        variant={txModal.variant}
        onClose={closeTx}
        onSuccess={handleTxSuccess}
        showToast={showToast}
      />
    </>
  );
};

export default InventoryDetailDrawer;
