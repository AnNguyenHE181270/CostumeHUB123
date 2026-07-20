import React, { useEffect, useState, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faScrewdriverWrench, faCircleCheck, faSpinner, faBoxOpen, faBox } from "@fortawesome/free-solid-svg-icons";
import costumeService from "../../services/costume.service";
import Modal from "../../components/Modal";
import Toast from "../../components/ui/Toast";
import DataTable from "../../components/ui/DataTable";

const formatPrice = (price) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price || 0);

const formatDate = (date) =>
  date ? new Date(date).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }) : "";

export default function MaintenancePage() {
  const [costumes, setCostumes] = useState([]);
  const [loading, setLoading] = useState(true);
  // confirmAction: { costume, size, unitCode } — unitCode set = hoàn tất đúng 1 unit;
  // unitCode rỗng = hoàn tất tất cả unit đang bảo trì của cả trang phục (bulk).
  const [confirmAction, setConfirmAction] = useState(null);
  const [processing, setProcessing] = useState(false);
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
    if (!confirmAction) return;
    const { costume, size, unitCode } = confirmAction;
    setProcessing(true);
    try {
      await costumeService.completeMaintenance(costume._id, size, unitCode);
      await fetchMaintenanceList(); // tải lại để phản ánh đúng những unit còn lại (nếu có)
      showToast(
        unitCode
          ? `Đã hoàn tất bảo trì unit ${unitCode} ("${costume.name}") — sẵn sàng cho thuê lại.`
          : `Đã hoàn tất bảo trì "${costume.name}" — sản phẩm đã lên web cho thuê lại.`
      );
    } catch (err) {
      showToast(err.message || "Cập nhật trạng thái thất bại", "error");
    } finally {
      setProcessing(false);
      setConfirmAction(null);
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
        <DataTable isLoading={false} isEmpty={false}>
          <thead>
            <tr className="border-border border-[#f0f0f0] bg-gray-50/50">
              <th className="py-4 px-6 text-xs font-semibold text-[#999] uppercase tracking-wider text-left w-[35%]">Trang phục</th>
              <th className="py-4 px-6 text-xs font-semibold text-[#999] uppercase tracking-wider text-left w-[30%]">Unit đang bảo trì</th>
              <th className="py-4 px-6 text-xs font-semibold text-[#999] uppercase tracking-wider text-left w-[13%]">Ngày cập nhật</th>
              <th className="py-4 px-6 text-xs font-semibold text-[#999] uppercase tracking-wider text-left w-[12%]">Giá thuê/ngày</th>
              <th className="py-4 px-6 text-xs font-semibold text-[#999] uppercase tracking-wider text-center w-[10%]">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {costumes.map((costume) => {
              // Liệt kê từng unit vật lý cụ thể đang bảo trì (nếu dữ liệu đã có instances[]),
              // fallback về hiển thị theo size cho dữ liệu cũ chưa từng chạm tới hệ thống instance.
              const unitChips = (costume.variants || []).flatMap((v) => {
                const maintenanceInstances = (v.instances || []).filter((i) => i.status === "maintenance");
                if (maintenanceInstances.length > 0) {
                  return maintenanceInstances.map((inst) => ({
                    key: inst.unitCode,
                    label: inst.unitCode,
                    title: inst.note ? `${inst.unitCode} — ${inst.note}` : inst.unitCode,
                    onClick: () => setConfirmAction({ costume, size: v.size, unitCode: inst.unitCode }),
                  }));
                }
                if (v.status === "maintenance") {
                  return [{
                    key: `size-${v.size}`,
                    label: `Size ${v.size}`,
                    title: "Dữ liệu chưa tách unit — hoàn tất theo cả size",
                    onClick: () => setConfirmAction({ costume, size: v.size, unitCode: null }),
                  }];
                }
                return [];
              });
              const hasAnyChip = unitChips.length > 0;

              return (
                <tr
                  key={costume._id}
                  className="border-b border-[#eaeaea] hover:bg-[#faf9f7] transition-colors"
                >
                  {/* Trang phục (Ảnh + Tên + Danh mục) */}
                  <td className="py-4 px-6 text-sm text-[#555] text-left">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-16 rounded bg-[#f5f5f5] overflow-hidden flex-shrink-0 border border-[#eaeaea]">
                        {costume.images?.[0] ? (
                          <img
                            src={costume.images[0]}
                            alt={costume.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[#ccc]">
                            <FontAwesomeIcon icon={faBox} />
                          </div>
                        )}
                      </div>
                      <div>
                        {costume.categoryId?.name && (
                          <p className="text-[10px] uppercase tracking-[0.1em] text-[#999] font-medium mb-1">
                            {costume.categoryId.name}
                          </p>
                        )}
                        <h3 className="font-semibold text-[#1a1a1a] line-clamp-2 leading-tight" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "16px" }}>
                          {costume.name}
                        </h3>
                        <p className="text-xs text-[#999] mt-1">{costume.sku || "N/A"}</p>
                      </div>
                    </div>
                  </td>

                  {/* Unit đang bảo trì — mỗi chip bấm được để hoàn tất đúng 1 unit */}
                  <td className="py-4 px-6 text-sm text-[#555] text-left">
                    <div className="flex flex-wrap gap-1.5">
                      {hasAnyChip ? (
                        unitChips.map((chip) => (
                          <button
                            key={chip.key}
                            type="button"
                            title={chip.title}
                            onClick={chip.onClick}
                            className="px-2 py-0.5 bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-bold rounded-md hover:bg-amber-200 transition-colors inline-flex items-center gap-1"
                          >
                            {chip.label}
                            <FontAwesomeIcon icon={faCircleCheck} className="text-[9px]" />
                          </button>
                        ))
                      ) : (
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-bold rounded-md">
                          Toàn bộ sản phẩm
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Ngày cập nhật */}
                  <td className="py-4 px-6 text-sm text-[#555] text-left">
                    {formatDate(costume.updatedAt)}
                  </td>

                  {/* Giá thuê/ngày */}
                  <td className="py-4 px-6 text-sm text-[#555] text-left">
                    <span className="font-semibold text-[#1a1a1a]">
                      {formatPrice(costume.pricePerDay || costume.price)}
                    </span>
                  </td>

                  {/* Thao tác — hoàn tất TẤT CẢ unit đang bảo trì của trang phục này cùng lúc */}
                  <td className="py-4 px-6 text-sm text-center">
                    <button
                      onClick={() => setConfirmAction({ costume, size: null, unitCode: null })}
                      className="py-1.5 px-3 border border-transparent bg-emerald-100 text-emerald-700 font-semibold rounded-lg hover:bg-emerald-200 transition-colors text-[11px] whitespace-nowrap text-center shadow-sm inline-flex items-center gap-1"
                    >
                      <FontAwesomeIcon icon={faCircleCheck} />
                      Hoàn tất tất cả
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </DataTable>
      )}

      <Modal
        isOpen={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        title="Xác nhận hoàn tất bảo trì"
        size="sm"
        footer={
          <>
            <button
              onClick={() => setConfirmAction(null)}
              disabled={processing}
              className="px-4 py-2 rounded-lg text-sm font-medium text-[#666] hover:bg-[#f0ece8] transition-colors disabled:opacity-60"
            >
              Hủy
            </button>
            <button
              onClick={handleConfirmDone}
              disabled={processing}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors disabled:opacity-60"
            >
              {processing ? "Đang xử lý..." : "Xác nhận hoàn tất"}
            </button>
          </>
        }
      >
        <p className="text-[#555] text-sm leading-relaxed">
          {confirmAction?.unitCode ? (
            <>
              Xác nhận unit <b className="text-[#1a1a1a]">{confirmAction.unitCode}</b> của{" "}
              <b className="text-[#1a1a1a]">"{confirmAction.costume?.name}"</b> đã được xử lý (sửa chữa/giặt là)
              xong và sẵn sàng cho thuê lại? Các unit khác của sản phẩm này không bị ảnh hưởng.
            </>
          ) : (
            <>
              Xác nhận <b className="text-[#1a1a1a]">tất cả</b> unit đang bảo trì của{" "}
              <b className="text-[#1a1a1a]">"{confirmAction?.costume?.name}"</b>
              {confirmAction?.size ? <> (size {confirmAction.size})</> : null} đã xử lý xong và sẵn sàng cho thuê
              lại? Sản phẩm sẽ ngay lập tức hiển thị trở lại trên website.
            </>
          )}
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
