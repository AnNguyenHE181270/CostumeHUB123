import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faCloudUploadAlt, faTrash, faCircleCheck } from "@fortawesome/free-solid-svg-icons";
import rentalService from "../../services/rental.service";
import Toast from "../../components/ui/Toast";
import ConfirmModal from "../../components/ui/ConfirmModal";
import { formatDate } from "../../utils/formatters";

const DAMAGE_TIERS = [
  { value: "none", title: "Bình thường hoặc bẩn nhẹ", desc: "Có thể giặt sạch sẽ dễ dàng, không bị khấu trừ tiền cọc.", min: 0, max: 0 },
  { value: "heavy_stain", title: "Bẩn nặng, ố khó tẩy", desc: "Khấu trừ phí để xử lý vệ sinh chuyên sâu.", min: 20, max: 20 },
  { value: "minor_damage", title: "Hư nhẹ, sửa được", note: "Bung chỉ, đứt khuy, rách nhỏ...", desc: "Khấu trừ tuỳ mức độ sửa chữa thực tế.", min: 30, max: 50 },
  { value: "major_damage", title: "Hư nặng, không phục hồi", note: "Rách lớn, cháy, biến dạng...", desc: "Trang phục hư hỏng nghiêm trọng, không thể cho thuê lại.", min: 70, max: 100 },
  { value: "total_loss", title: "Mất trang phục hoặc hư hỏng toàn bộ", desc: "Khấu trừ toàn bộ cọc và bồi thường phần giá trị vượt cọc (nếu có).", min: 100, max: 100 },
];

export default function InspectReturnModal({ order, onClose, onSuccess }) {
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  const [damageTier, setDamageTier] = useState("none");
  const [damagePercent, setDamagePercent] = useState(0);
  const [missingNotes, setMissingNotes] = useState("");
  const [actualReturnDate, setActualReturnDate] = useState(new Date().toISOString().slice(0, 10));
  const [evidenceFiles, setEvidenceFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const selectedTier = DAMAGE_TIERS.find((t) => t.value === damageTier);

  useEffect(() => {
    if (selectedTier) setDamagePercent(selectedTier.min);
  }, [damageTier, selectedTier]);

  const handleFilesChange = (e) => {
    const newFiles = Array.from(e.target.files || []);
    setEvidenceFiles((prev) => {
      const combined = [...prev, ...newFiles];
      if (combined.length > 5) {
        setToast({ show: true, message: "Tối đa 5 tệp ảnh/video làm bằng chứng.", type: "error" });
        return combined.slice(0, 5);
      }
      return combined;
    });
    e.target.value = "";
  };

  const removeFile = (idx) => {
    setEvidenceFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    if (!order) return;
    setConfirmOpen(false);
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("damageTier", damageTier);
      formData.append("damagePercent", damagePercent);
      formData.append("missingNotes", missingNotes);
      formData.append("actualReturnDate", actualReturnDate);
      evidenceFiles.forEach((file) => formData.append("evidence", file));

      const res = await rentalService.inspectReturn(order._id, formData);
      setResult(res.data);
      const netRefund = Math.max(0, (res.data?.refundAmount || 0) - (res.data?.replacementFee || 0));
      setToast({
        show: true,
        message: netRefund > 0
          ? `Đã chốt đơn và hoàn ${netRefund.toLocaleString("vi-VN")}đ vào ví khách hàng!`
          : "Đã chốt đơn thành công!",
        type: "success",
      });
      if (onSuccess) onSuccess();
    } catch (error) {
      setToast({ show: true, message: error.response?.data?.message || error.message || "Lỗi khi kiểm tra đồ trả", type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  if (!order) return null;

  const deposit = order.totalDeposit || 0;
  const estimatedDamageFee = deposit * (damagePercent / 100);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-[1100px] h-[90vh] max-h-[850px] flex flex-col md:flex-row overflow-hidden shadow-2xl relative">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-black flex items-center justify-center transition-colors"
        >
          <FontAwesomeIcon icon={faTimes} />
        </button>

        {/* LEFT SIDE: Order Details Summary */}
        <div className="w-full md:w-[40%] bg-[#faf9f7] border-r border-[#eaeaea] p-6 overflow-y-auto hidden md:block scrollbar-thin scrollbar-thumb-gray-300">
          <h2 className="text-xl font-bold text-[#1a1a1a] mb-6" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            Chi Tiết Đơn Hàng #{order._id?.slice(-6).toUpperCase()}
          </h2>
          
          <div className="space-y-6">
            <div className="bg-white p-4 rounded-xl border border-[#eaeaea] shadow-sm">
              <h3 className="font-bold text-[#1a1a1a] mb-3 text-sm uppercase tracking-wider">Thông tin khách hàng</h3>
              <p className="text-sm mb-1"><span className="text-gray-500 w-20 inline-block">Tên:</span> <strong>{order.shippingAddress?.receiverName || order.customerId?.fullName || "Khách vãng lai"}</strong></p>
              <p className="text-sm mb-1"><span className="text-gray-500 w-20 inline-block">SĐT:</span> <strong>{order.shippingAddress?.receiverPhone || order.customerId?.phone || ""}</strong></p>
              <p className="text-sm flex"><span className="text-gray-500 w-20 shrink-0">Địa chỉ:</span> <span className="flex-1">{[order.shippingAddress?.addressDetail, order.shippingAddress?.ward, order.shippingAddress?.district, order.shippingAddress?.province].filter(Boolean).join(', ') || "Nhận tại cửa hàng"}</span></p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-[#eaeaea] shadow-sm">
              <h3 className="font-bold text-[#1a1a1a] mb-3 text-sm uppercase tracking-wider">Sản phẩm thuê</h3>
              <div className="space-y-3">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex gap-3 pb-3 border-b border-gray-100 last:border-0 last:pb-0">
                    <img src={item.costume?.images?.[0] || 'https://via.placeholder.com/60'} alt={item.costume?.name} className="w-16 h-16 object-cover rounded-lg border border-gray-200" />
                    <div className="flex-1">
                      <p className="font-semibold text-sm text-[#1a1a1a] line-clamp-1">{item.costume?.name}</p>
                      <p className="text-xs text-gray-500 mb-1">Size: {item.size} x{item.quantity}</p>
                      <p className="text-xs font-medium">Cọc: <span className="text-[#b8935a]">{(item.costume?.deposit || item.deposit || 0).toLocaleString('vi-VN')} đ</span></p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-[#eaeaea] shadow-sm">
              <h3 className="font-bold text-[#1a1a1a] mb-3 text-sm uppercase tracking-wider">Lịch trình & Thanh toán</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Ngày thuê:</span> <strong>{formatDate(order.startDate)}</strong></div>
                <div className="flex justify-between"><span className="text-gray-500">Ngày trả:</span> <strong>{formatDate(order.endDate)}</strong></div>
                <div className="border-t border-dashed border-gray-200 my-2 pt-2"></div>
                <div className="flex justify-between"><span className="text-gray-500">Tiền thuê:</span> <strong>{(order.totalRentalPrice || 0).toLocaleString('vi-VN')} đ</strong></div>
                <div className="flex justify-between"><span className="text-gray-500">Tiền cọc đã thu:</span> <strong className="text-[#b8935a]">{(order.totalDeposit || 0).toLocaleString('vi-VN')} đ</strong></div>
                <div className="flex justify-between text-base mt-1"><span className="text-gray-800 font-bold">Tổng thanh toán:</span> <strong className="text-red-500">{(order.totalAmount || 0).toLocaleString('vi-VN')} đ</strong></div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE: Inspection Form */}
        <div className="w-full md:w-[60%] p-6 md:p-8 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 bg-white flex flex-col relative">
          <h1 className="text-2xl font-bold text-[#1a1a1a] mb-1" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            Kiểm Tra Đồ Trả
          </h1>
          <p className="text-sm text-gray-500 mb-6">
            Kiểm tra tình trạng trang phục, đánh giá hư hỏng (nếu có) và xác nhận hoàn cọc.
          </p>

          {result ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-8 text-center my-auto shadow-sm">
              <FontAwesomeIcon icon={faCircleCheck} className="text-emerald-500 text-6xl mb-4" />
              <h2 className="text-xl font-bold text-[#1a1a1a] mb-3">Đã hoàn tất kiểm tra & chốt đơn</h2>
              <div className="text-base text-gray-700 space-y-2 mb-8 bg-white p-5 rounded-lg border border-emerald-100 inline-block min-w-[320px] text-left mx-auto shadow-sm">
                <div className="flex justify-between border-b border-gray-100 pb-3 mb-2"><span>Phí phạt trễ + hư hỏng:</span> <strong>{(result.totalFine || 0).toLocaleString("vi-VN")} đ</strong></div>
                {result.replacementFee > 0 && (
                  <div className="flex justify-between border-b border-gray-100 pb-3 mb-2"><span>Phí bồi thường vượt cọc:</span> <strong>{result.replacementFee.toLocaleString("vi-VN")} đ</strong></div>
                )}
                <div className="flex justify-between pt-1"><span>Số tiền hoàn cọc cho khách:</span> <strong className="text-emerald-600 text-xl font-extrabold">{(result.refundAmount || 0).toLocaleString("vi-VN")} đ</strong></div>
              </div>
              {Math.max(0, (result.refundAmount || 0) - (result.replacementFee || 0)) > 0 && (
                <p className="text-emerald-600 font-medium text-sm -mt-4 mb-6">
                  Đã cộng tiền vào ví khách hàng và gửi thông báo hoàn tất cho khách.
                </p>
              )}
              <div>
                <button
                  onClick={onClose}
                  className="px-8 py-3 bg-[#1a1a1a] text-white rounded-lg text-sm font-semibold hover:bg-black transition-colors shadow"
                >
                  Đóng và quay lại
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col">
              <div className="grid grid-cols-1 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-[#555] mb-1.5">Ngày trả thực tế</label>
                  <input
                    type="date"
                    value={actualReturnDate}
                    onChange={(e) => setActualReturnDate(e.target.value)}
                    className="w-full px-4 py-2.5 border border-[#eaeaea] rounded-lg text-sm outline-none focus:border-[#1a1a1a] bg-gray-50"
                  />
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-[#555] mb-2">Mức độ hư hỏng (đối chiếu bảng đền bù)</label>
                <div className="space-y-2.5">
                  {DAMAGE_TIERS.map((tier) => (
                    <label
                      key={tier.value}
                      className={`flex items-start gap-3 p-3.5 border rounded-lg cursor-pointer transition-colors ${damageTier === tier.value ? "border-[#1a1a1a] bg-[#faf9f7] ring-1 ring-[#1a1a1a]/10" : "border-[#eaeaea] hover:bg-gray-50"
                        }`}
                    >
                      <input
                        type="radio"
                        name="damageTier"
                        value={tier.value}
                        checked={damageTier === tier.value}
                        onChange={() => setDamageTier(tier.value)}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-bold text-[#1a1a1a]">{tier.title}</span>
                          <span className="text-xs font-bold text-[#b8935a] whitespace-nowrap bg-[#f9f3e6] px-2 py-0.5 rounded">
                            {tier.min === tier.max ? (tier.min === 0 ? "Không trừ cọc" : `${tier.min}% cọc`) : `${tier.min}% - ${tier.max}% cọc`}
                          </span>
                        </div>
                        {tier.note && <p className="text-[11px] text-gray-500 italic mt-1 font-medium">{tier.note}</p>}
                        <p className="text-xs text-gray-500 mt-1">{tier.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {selectedTier && selectedTier.min !== selectedTier.max && (
                <div className="mb-6 bg-[#faf9f7] p-5 rounded-lg border border-[#eaeaea]">
                  <label className="block text-sm font-medium text-[#555] mb-3 flex justify-between items-center">
                    Mức khấu trừ cụ thể: <span className="font-bold text-[#1a1a1a] text-lg bg-white px-3 py-1 rounded shadow-sm border border-gray-100">{damagePercent}%</span>
                  </label>
                  <input
                    type="range"
                    min={selectedTier.min}
                    max={selectedTier.max}
                    step={5}
                    value={damagePercent}
                    onChange={(e) => setDamagePercent(Number(e.target.value))}
                    className="w-full accent-[#1a1a1a] h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-[11px] text-gray-500 mt-2 font-bold tracking-wider">
                    <span>MIN: {selectedTier.min}%</span>
                    <span>MAX: {selectedTier.max}%</span>
                  </div>
                </div>
              )}

              <div className="mb-6 bg-[#fffcf5] border border-[#f5e6ca] rounded-lg p-4 text-sm flex items-center justify-between shadow-sm">
                <span className="text-[#8a7d63] font-semibold">Phí hư hỏng ước tính <span className="text-[11px] font-normal text-[#a69c87] block sm:inline sm:ml-1">(chưa gồm phí trễ hạn)</span></span>
                <span className="font-extrabold text-[#b8935a] text-xl">{estimatedDamageFee.toLocaleString("vi-VN")} đ</span>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-[#555] mb-2 flex items-center justify-between">
                  <span>Ảnh/video bằng chứng (Tối đa 5)</span>
                  <span className="text-[11px] font-normal text-gray-400">jpg, png, mp4...</span>
                </label>
                
                <div className="flex flex-wrap gap-3">
                  {evidenceFiles.map((file, idx) => (
                    <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden border border-[#eaeaea] bg-gray-50 shadow-sm group">
                      {file.type.startsWith("video/") ? (
                        <video src={URL.createObjectURL(file)} className="w-full h-full object-cover" />
                      ) : (
                        <img src={URL.createObjectURL(file)} alt={`evidence-${idx}`} className="w-full h-full object-cover" />
                      )}
                      <button
                        type="button"
                        onClick={() => removeFile(idx)}
                        className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-600 transition-all shadow-sm"
                      >
                        <FontAwesomeIcon icon={faTrash} className="text-[10px]" />
                      </button>
                    </div>
                  ))}

                  {evidenceFiles.length < 5 && (
                    <label className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-1 text-gray-400 hover:border-[#1a1a1a] hover:text-[#1a1a1a] hover:bg-gray-50 cursor-pointer transition-all">
                      <FontAwesomeIcon icon={faCloudUploadAlt} className="text-lg" />
                      <span className="text-[10px] font-semibold">Tải lên</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/jpg,video/mp4,video/quicktime,video/x-matroska"
                        multiple
                        onChange={handleFilesChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              <div className="mb-8">
                <label className="block text-sm font-medium text-[#555] mb-1.5">Ghi chú thêm</label>
                <textarea
                  rows={3}
                  value={missingNotes}
                  onChange={(e) => setMissingNotes(e.target.value)}
                  className="w-full px-4 py-3 border border-[#eaeaea] bg-gray-50 rounded-lg text-sm outline-none focus:border-[#1a1a1a] resize-none"
                  placeholder="Ghi chú về tình trạng thiếu đồ, hư hỏng chi tiết..."
                />
              </div>

              <div className="flex gap-3 mt-auto pt-4 border-t border-gray-100">
                <button
                  onClick={onClose}
                  disabled={submitting}
                  className="flex-1 px-4 py-3.5 border border-[#eaeaea] rounded-xl text-sm font-bold text-[#555] hover:bg-[#faf9f7] hover:text-black disabled:opacity-50 transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={() => setConfirmOpen(true)}
                  disabled={submitting}
                  className="flex-[2] px-4 py-3.5 bg-gradient-to-r from-[#1a1a1a] to-[#333] text-white rounded-xl text-sm font-bold hover:brightness-110 disabled:opacity-50 transition-all shadow flex items-center justify-center gap-2"
                >
                  {submitting ? "Đang xử lý..." : "Xác nhận & Hoàn cọc"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <ConfirmModal
        isOpen={confirmOpen}
        zIndex="z-[70]"
        title="Xác nhận kiểm tra đồ trả"
        message={
          <div className="space-y-1.5 text-left">
            <p>Mức độ hư hỏng đã chọn: <strong>{selectedTier?.title}</strong> ({damagePercent}% cọc)</p>
            <p>Phí hư hỏng ước tính: <strong>{estimatedDamageFee.toLocaleString("vi-VN")} đ</strong> (chưa gồm phí trễ hạn nếu có)</p>
            <p className="text-red-600 font-medium pt-1">
              Sau khi xác nhận, đơn sẽ được chốt hoàn tất và số tiền cọc còn lại sẽ được cộng ngay vào ví khách hàng — không thể hoàn tác.
            </p>
          </div>
        }
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleSubmit}
      />

      {toast.show && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />
      )}
    </div>
  );
}
