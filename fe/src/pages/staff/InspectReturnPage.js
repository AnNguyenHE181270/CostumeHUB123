import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faCloudUploadAlt, faTrash, faCircleCheck } from "@fortawesome/free-solid-svg-icons";
import rentalService from "../../services/rental.service";
import Toast from "../../components/ui/Toast";

const DAMAGE_TIERS = [
  {
    value: "none",
    title: "Bình thường hoặc bẩn nhẹ",
    desc: "Có thể giặt sạch sẽ dễ dàng, không bị khấu trừ tiền cọc.",
    min: 0,
    max: 0,
  },
  {
    value: "heavy_stain",
    title: "Bẩn nặng, ố khó tẩy",
    desc: "Khấu trừ phí để xử lý vệ sinh chuyên sâu.",
    min: 20,
    max: 20,
  },
  {
    value: "minor_damage",
    title: "Hư nhẹ, sửa được",
    note: "Bung chỉ, đứt khuy, rách nhỏ...",
    desc: "Khấu trừ tuỳ mức độ sửa chữa thực tế.",
    min: 30,
    max: 50,
  },
  {
    value: "major_damage",
    title: "Hư nặng, không phục hồi",
    note: "Rách lớn, cháy, biến dạng...",
    desc: "Trang phục hư hỏng nghiêm trọng, không thể cho thuê lại.",
    min: 70,
    max: 100,
  },
  {
    value: "total_loss",
    title: "Mất trang phục hoặc hư hỏng toàn bộ",
    desc: "Khấu trừ toàn bộ cọc và bồi thường phần giá trị vượt cọc (nếu có).",
    min: 100,
    max: 100,
  },
];

export default function InspectReturnPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [order, setOrder] = useState(location.state?.order || null);
  const [loadingOrder, setLoadingOrder] = useState(!location.state?.order);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  const [damageTier, setDamageTier] = useState("none");
  const [damagePercent, setDamagePercent] = useState(0);
  const [missingNotes, setMissingNotes] = useState("");
  const [actualReturnDate, setActualReturnDate] = useState(new Date().toISOString().slice(0, 10));
  const [evidenceFiles, setEvidenceFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const selectedTier = DAMAGE_TIERS.find((t) => t.value === damageTier);

  const fetchOrder = useCallback(async () => {
    try {
      const data = await rentalService.getAllOrders();
      const list = Array.isArray(data) ? data : (data.rentals || data.data || []);
      const found = list.find((o) => o._id === orderId);
      if (found) setOrder(found);
      else setToast({ show: true, message: "Không tìm thấy đơn hàng.", type: "error" });
    } catch (err) {
      setToast({ show: true, message: "Lỗi khi tải đơn hàng.", type: "error" });
    } finally {
      setLoadingOrder(false);
    }
  }, [orderId]);

  useEffect(() => {
    if (!order) fetchOrder();
  }, [order, fetchOrder]);

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
      setToast({ show: true, message: "Đã hoàn tất kiểm tra đồ trả!", type: "success" });
    } catch (error) {
      setToast({ show: true, message: error.response?.data?.message || error.message || "Lỗi khi kiểm tra đồ trả", type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingOrder) {
    return <div className="p-10 text-center text-gray-400">Đang tải đơn hàng...</div>;
  }

  if (!order) {
    return (
      <div className="p-10 text-center text-gray-400">
        Không tìm thấy đơn hàng.
        <button onClick={() => navigate("/staff/orders")} className="block mx-auto mt-4 text-[#1a1a1a] underline">
          Quay lại danh sách đơn hàng
        </button>
      </div>
    );
  }

  const deposit = order.totalDeposit || 0;
  const estimatedDamageFee = deposit * (damagePercent / 100);

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm border border-[#eaeaea] p-6 sm:p-8">
      <button
        onClick={() => navigate("/staff/orders")}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-black mb-6 transition-colors"
      >
        <FontAwesomeIcon icon={faArrowLeft} /> Quay lại danh sách đơn hàng
      </button>

      <h1 className="text-xl font-bold text-[#1a1a1a] mb-1" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
        Kiểm tra đồ trả — Đơn #{order._id?.slice(-6).toUpperCase()}
      </h1>
      <p className="text-sm text-gray-500 mb-6">
        Khách hàng: {order.shippingAddress?.receiverName || order.customerId?.fullName || "Khách vãng lai"} · Tiền cọc đã nhận: {deposit.toLocaleString("vi-VN")} đ
      </p>

      {result ? (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-center">
          <FontAwesomeIcon icon={faCircleCheck} className="text-emerald-500 text-4xl mb-3" />
          <h2 className="text-lg font-bold text-[#1a1a1a] mb-2">Đã hoàn tất kiểm tra & chốt đơn</h2>
          <div className="text-sm text-gray-600 space-y-1">
            <p>Phí phạt trễ hạn + hư hỏng: <strong>{(result.totalFine || 0).toLocaleString("vi-VN")} đ</strong></p>
            {result.replacementFee > 0 && (
              <p>Phí bồi thường vượt cọc: <strong>{result.replacementFee.toLocaleString("vi-VN")} đ</strong></p>
            )}
            <p>Số tiền hoàn cọc cho khách: <strong>{(result.refundAmount || 0).toLocaleString("vi-VN")} đ</strong></p>
          </div>
          <button
            onClick={() => navigate("/staff/orders")}
            className="mt-6 px-6 py-2.5 bg-[#1a1a1a] text-white rounded-lg text-sm font-semibold hover:bg-black transition-colors"
          >
            Quay lại danh sách đơn hàng
          </button>
        </div>
      ) : (
        <>
          {/* Ngày trả thực tế */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-[#555] mb-1.5">Ngày trả thực tế</label>
            <input
              type="date"
              value={actualReturnDate}
              onChange={(e) => setActualReturnDate(e.target.value)}
              className="w-full sm:w-60 px-3 py-2 border border-[#eaeaea] rounded-lg text-sm outline-none focus:border-[#1a1a1a]"
            />
          </div>

          {/* Mức độ hư hỏng */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-[#555] mb-2">Mức độ hư hỏng (đối chiếu bảng đền bù)</label>
            <div className="space-y-2">
              {DAMAGE_TIERS.map((tier) => (
                <label
                  key={tier.value}
                  className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${damageTier === tier.value ? "border-[#1a1a1a] bg-[#faf9f7]" : "border-[#eaeaea] hover:bg-gray-50"
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
                      <span className="text-sm font-semibold text-[#1a1a1a]">{tier.title}</span>
                      <span className="text-xs font-bold text-[#b8935a] whitespace-nowrap">
                        {tier.min === tier.max ? (tier.min === 0 ? "Không trừ cọc" : `${tier.min}% cọc`) : `${tier.min}% - ${tier.max}% cọc`}
                      </span>
                    </div>
                    {tier.note && <p className="text-xs text-gray-400 italic mt-0.5">{tier.note}</p>}
                    <p className="text-xs text-gray-500 mt-0.5">{tier.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Chọn % cụ thể trong khoảng nếu tier có range */}
          {selectedTier && selectedTier.min !== selectedTier.max && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-[#555] mb-1.5">
                Mức khấu trừ cụ thể: <span className="font-bold text-[#1a1a1a]">{damagePercent}%</span>
              </label>
              <input
                type="range"
                min={selectedTier.min}
                max={selectedTier.max}
                step={5}
                value={damagePercent}
                onChange={(e) => setDamagePercent(Number(e.target.value))}
                className="w-full accent-[#1a1a1a]"
              />
              <div className="flex justify-between text-[11px] text-gray-400 mt-1">
                <span>{selectedTier.min}%</span>
                <span>{selectedTier.max}%</span>
              </div>
            </div>
          )}

          {/* Ước tính phí hư hỏng */}
          <div className="mb-6 bg-[#faf9f7] border border-[#eaeaea] rounded-lg p-4 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Phí hư hỏng ước tính (chưa gồm phí trễ hạn)</span>
              <span className="font-semibold text-[#1a1a1a]">{estimatedDamageFee.toLocaleString("vi-VN")} đ</span>
            </div>
          </div>

          {/* Ảnh/video bằng chứng */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-[#555] mb-1.5">
              Ảnh/video bằng chứng tình trạng trang phục khi nhận lại
            </label>
            <p className="text-xs text-gray-400 mb-2">Tối đa 5 tệp (ảnh: jpg/png/webp, video: mp4/mov/mkv) — dùng làm bằng chứng đơn đã kiểm tra đúng thực tế.</p>

            <div className="flex flex-wrap gap-3 mb-2">
              {evidenceFiles.map((file, idx) => (
                <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden border border-[#eaeaea] bg-gray-50">
                  {file.type.startsWith("video/") ? (
                    <video src={URL.createObjectURL(file)} className="w-full h-full object-cover" />
                  ) : (
                    <img src={URL.createObjectURL(file)} alt={`evidence-${idx}`} className="w-full h-full object-cover" />
                  )}
                  <button
                    type="button"
                    onClick={() => removeFile(idx)}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
                  >
                    <FontAwesomeIcon icon={faTrash} className="text-[9px]" />
                  </button>
                </div>
              ))}

              {evidenceFiles.length < 5 && (
                <label className="w-20 h-20 rounded-lg border border-dashed border-[#ccc] flex flex-col items-center justify-center gap-1 text-gray-400 hover:border-[#1a1a1a] hover:text-[#1a1a1a] cursor-pointer transition-colors">
                  <FontAwesomeIcon icon={faCloudUploadAlt} />
                  <span className="text-[10px]">Thêm</span>
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

          {/* Ghi chú */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-[#555] mb-1.5">Ghi chú (thiếu đồ, tình trạng chi tiết...)</label>
            <textarea
              rows={3}
              value={missingNotes}
              onChange={(e) => setMissingNotes(e.target.value)}
              className="w-full px-3 py-2 border border-[#eaeaea] rounded-lg text-sm outline-none focus:border-[#1a1a1a] resize-none"
              placeholder="Không bắt buộc"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => navigate("/staff/orders")}
              disabled={submitting}
              className="flex-1 px-4 py-3 border border-[#eaeaea] rounded-lg text-sm font-medium text-[#555] hover:bg-[#faf9f7] disabled:opacity-50 transition-colors"
            >
              Hủy
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 px-4 py-3 bg-[#1a1a1a] text-white rounded-lg text-sm font-semibold hover:bg-black disabled:opacity-50 transition-colors"
            >
              {submitting ? "Đang xử lý..." : "Xác nhận & Hoàn cọc"}
            </button>
          </div>
        </>
      )}

      {toast.show && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />
      )}
    </div>
  );
}
