import React, { useEffect, useState, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faScrewdriverWrench, faCircleCheck, faSpinner, faBoxOpen } from "@fortawesome/free-solid-svg-icons";
import costumeService from "../../services/costume.service";
import Modal from "../../components/Modal";
import Toast from "../../components/ui/Toast";

const formatPrice = (price) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price || 0);

const formatDate = (date) =>
  date ? new Date(date).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }) : "";

export default function MaintenancePage() {
  const [costumes, setCostumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [processingId, setProcessingId] = useState(null);
  const [toast, setToast] = useState({ isVisible: false, message: "", type: "success" });

  const showToast = (message, type = "success") => setToast({ isVisible: true, message, type });

  const fetchMaintenanceList = useCallback(async () => {
    setLoading(true);
    try {
      const data = await costumeService.getMaintenanceList();
      setCostumes(data.costumes || []);
    } catch (err) {
      showToast(err.message || "Không thể tải danh sách trang phục bảo trì", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMaintenanceList();
  }, [fetchMaintenanceList]);

  const handleConfirmDone = async () => {
    if (!confirmTarget) return;
    setProcessingId(confirmTarget._id);
    try {
      await costumeService.completeMaintenance(confirmTarget._id);
      setCostumes((prev) => prev.filter((c) => c._id !== confirmTarget._id));
      showToast(`Đã hoàn tất bảo trì "${confirmTarget.name}" — sản phẩm đã lên web cho thuê lại.`);
    } catch (err) {
      showToast(err.message || "Cập nhật trạng thái thất bại", "error");
    } finally {
      setProcessingId(null);
      setConfirmTarget(null);
    }
  };

  return (
    <div className="bg-[#faf9f7] min-h-screen -m-6 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 text-sm text-[#666]">
          <FontAwesomeIcon icon={faScrewdriverWrench} className="text-amber-500" />
          <span>
            Đang có <b className="text-[#1a1a1a]">{costumes.length}</b> trang phục cần xử lý bảo trì / giặt là
          </span>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24 text-[#999]">
          <FontAwesomeIcon icon={faSpinner} spin className="text-2xl" />
        </div>
      ) : costumes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center bg-white rounded-2xl border border-[#eaeaea]">
          <FontAwesomeIcon icon={faBoxOpen} className="text-4xl text-[#ddd] mb-3" />
          <p className="text-[#666] font-medium">Không có trang phục nào đang bảo trì</p>
          <p className="text-[#999] text-sm mt-1">Mọi sản phẩm đều đã sẵn sàng cho thuê.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
          {costumes.map((costume) => (
            <div
              key={costume._id}
              className="bg-white rounded-2xl overflow-hidden border border-[#f0ece8] hover:shadow-[0_12px_30px_rgba(0,0,0,0.06)] transition-shadow duration-300 flex flex-col"
            >
              <div className="relative aspect-[3/4] bg-[#f5f3f0]">
                {costume.images?.[0] ? (
                  <img src={costume.images[0]} alt={costume.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#ccc]">
                    <FontAwesomeIcon icon={faBoxOpen} className="text-3xl" />
                  </div>
                )}
                <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold text-white bg-amber-500 shadow-sm">
                  <FontAwesomeIcon icon={faScrewdriverWrench} className="text-[9px]" />
                  Đang Bảo Trì
                </span>
              </div>

              <div className="p-3.5 flex flex-col flex-1">
                {costume.categoryId?.name && (
                  <p className="text-[10px] uppercase tracking-[0.1em] text-[#999] font-medium mb-1">
                    {costume.categoryId.name}
                  </p>
                )}
                <h3 className="text-[13px] font-semibold text-[#1a1a1a] mb-1 line-clamp-2 min-h-[32px]">
                  {costume.name}
                </h3>
                <p className="text-[12px] text-[#999] mb-3">
                  Cập nhật: {formatDate(costume.updatedAt)} · {formatPrice(costume.pricePerDay || costume.price)}/ngày
                </p>

                <button
                  onClick={() => setConfirmTarget(costume)}
                  disabled={processingId === costume._id}
                  className="mt-auto w-full py-2 bg-[#1a1a1a] text-white text-[11px] uppercase tracking-wider font-semibold rounded-lg hover:bg-emerald-600 active:scale-[0.97] transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  <FontAwesomeIcon icon={faCircleCheck} />
                  Hoàn tất bảo trì
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={!!confirmTarget}
        onClose={() => setConfirmTarget(null)}
        title="Xác nhận hoàn tất bảo trì"
        size="sm"
        footer={
          <>
            <button
              onClick={() => setConfirmTarget(null)}
              className="px-4 py-2 rounded-lg text-sm font-medium text-[#666] hover:bg-[#f0ece8] transition-colors"
            >
              Hủy
            </button>
            <button
              onClick={handleConfirmDone}
              disabled={processingId === confirmTarget?._id}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors disabled:opacity-60"
            >
              {processingId === confirmTarget?._id ? "Đang xử lý..." : "Xác nhận hoàn tất"}
            </button>
          </>
        }
      >
        <p className="text-[#555] text-sm leading-relaxed">
          Xác nhận trang phục{" "}
          <b className="text-[#1a1a1a]">"{confirmTarget?.name}"</b> đã được xử lý (sửa chữa/giặt là) xong và sẵn sàng
          cho thuê lại? Sản phẩm sẽ ngay lập tức hiển thị trở lại trên website.
        </p>
      </Modal>

      <Toast
        isVisible={toast.isVisible}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast((prev) => ({ ...prev, isVisible: false }))}
      />
    </div>
  );
}
