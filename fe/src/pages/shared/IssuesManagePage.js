import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import issueService from "../../services/issue.service";
import DataTable from "../../components/ui/DataTable";
import Pagination from "../../components/ui/Pagination";
import SearchInput from "../../components/ui/SearchInput";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheck,
  faTimes,
  faArrowUp,
  faImage,
  faVideo,
  faSpinner,
  faChevronLeft,
  faChevronRight,
  faInfoCircle,
  faGavel,
  faCircleExclamation,
} from "@fortawesome/free-solid-svg-icons";

const STATUS_LABELS = {
  pending: "Chờ xử lý",
  escalated: "Chờ duyệt",
  accepted: "Đã chấp nhận",
  rejected: "Đã từ chối",
  cancelled: "Đã hủy",
};

const STATUS_STYLES = {
  pending: "bg-amber-50 text-amber-700 border border-amber-200",
  escalated: "bg-violet-50 text-violet-700 border border-violet-200",
  accepted: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  rejected: "bg-red-50 text-red-700 border border-red-200",
  cancelled: "bg-gray-50 text-gray-500 border border-gray-200",
};

const RESOLUTION_LABELS = {
  return_refund: "Hoàn tiền",
  exchange: "Đổi hàng",
};

function formatCurrency(amount) {
  return (amount || 0).toLocaleString("vi-VN") + " đ";
}

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/* ─── Media Viewer ─────────────────────────────────────────────────────────── */
function MediaViewer({ urls = [], title = "Bằng chứng" }) {
  const [activeIdx, setActiveIdx] = useState(0);
  if (!urls.length)
    return (
      <span className="text-[#aaa] text-sm italic">Không có tệp đính kèm</span>
    );

  const isVideo = (url) => /\.(mp4|mov|webm|avi)(\?|$)/i.test(url);

  return (
    <div>
      <div className="rounded-xl overflow-hidden bg-[#18181b] h-[340px] relative flex items-center justify-center border border-[#eaeaea]">
        {isVideo(urls[activeIdx]) ? (
          <video
            key={urls[activeIdx]}
            src={urls[activeIdx]}
            controls
            className="max-h-full max-w-full"
          />
        ) : (
          <img
            src={urls[activeIdx]}
            alt={`${title} ${activeIdx + 1}`}
            className="max-h-full max-w-full object-contain cursor-zoom-in"
            onClick={() => window.open(urls[activeIdx], "_blank")}
          />
        )}
        {urls.length > 1 && (
          <>
            <button
              onClick={() =>
                setActiveIdx((i) => (i - 1 + urls.length) % urls.length)
              }
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
            >
              <FontAwesomeIcon icon={faChevronLeft} size="xs" />
            </button>
            <button
              onClick={() => setActiveIdx((i) => (i + 1) % urls.length)}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
            >
              <FontAwesomeIcon icon={faChevronRight} size="xs" />
            </button>
          </>
        )}
      </div>
      {urls.length > 1 && (
        <div className="flex gap-2 mt-2 flex-wrap">
          {urls.map((url, i) => (
            <button
              key={i}
              onClick={() => setActiveIdx(i)}
              className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${i === activeIdx
                ? "border-[#1a1a1a]"
                : "border-transparent opacity-60 hover:opacity-100"
                }`}
            >
              {isVideo(url) ? (
                <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                  <FontAwesomeIcon
                    icon={faVideo}
                    className="text-white text-xs"
                  />
                </div>
              ) : (
                <img
                  src={url}
                  alt={`thumb-${i}`}
                  className="w-full h-full object-cover"
                />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Handle Modal ──────────────────────────────────────────────────────────── */
function HandleModal({ issue, role, onClose, onSuccess }) {
  const rental = issue.rentalId;
  const isHighValue = (rental?.totalAmount || 0) >= 1000000;
  const isEscalated = issue.status === "escalated";

  const canAcceptReject = !isHighValue || (role === "owner" && isEscalated);
  const canEscalate = role === "staff" && isHighValue && !isEscalated;

  const [action, setAction] = useState(() => {
    return role === "staff" && isHighValue && !isEscalated ? "escalate" : "";
  });
  const [rejectReason, setRejectReason] = useState("");
  const [files, setFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef();

  const filesRef = useRef(files);
  useEffect(() => {
    filesRef.current = files;
  }, [files]);

  useEffect(() => {
    return () => {
      filesRef.current.forEach((f) => {
        if (f.preview) URL.revokeObjectURL(f.preview);
      });
    };
  }, []);

  const handleFileChange = (e) => {
    setError("");
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) return;

    let newFiles = [...files];
    let imageCount = newFiles.filter(f => f.type === "image").length;
    let videoCount = newFiles.filter(f => f.type === "video").length;

    for (const file of selectedFiles) {
      const isImage = file.type.startsWith("image/");
      const isVideo = file.type.startsWith("video/");

      if (!isImage && !isVideo) {
        setError(`Tệp "${file.name}" không hợp lệ. Chỉ chấp nhận tệp ảnh hoặc video.`);
        continue;
      }

      if (isImage) {
        if (imageCount >= 4) {
          setError("Chỉ được tải lên tối đa 4 ảnh.");
          continue;
        }
        imageCount++;
        newFiles.push({
          file,
          type: "image",
          preview: URL.createObjectURL(file)
        });
      } else if (isVideo) {
        if (videoCount >= 1) {
          setError("Chỉ được tải lên tối đa 1 video.");
          continue;
        }
        videoCount++;
        newFiles.push({
          file,
          type: "video",
          preview: URL.createObjectURL(file)
        });
      }
    }
    setFiles(newFiles);
    e.target.value = "";
  };

  const handleRemoveFile = (index) => {
    const newFiles = [...files];
    const removed = newFiles.splice(index, 1)[0];
    if (removed && removed.preview) {
      URL.revokeObjectURL(removed.preview);
    }
    setFiles(newFiles);
  };

  const handleSubmit = async () => {
    if (!action) {
      setError("Vui lòng chọn hành động xử lý.");
      return;
    }
    if (action === "reject" && !rejectReason.trim()) {
      setError("Vui lòng nhập lý do từ chối.");
      return;
    }
    if (action !== "accept" && role !== "owner" && files.length === 0) {
      setError("Vui lòng tải lên ít nhất 1 ảnh/video bằng chứng.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("action", action);
      if (rejectReason) formData.append("rejectReason", rejectReason);
      files.forEach((f) => formData.append("evidence", f.file));
      await issueService.handle(issue._id, formData);
      onSuccess();
    } catch (err) {
      setError(
        err?.message || "Xử lý thất bại. Vui lòng thử lại."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-[#eaeaea] px-6 py-4 rounded-t-2xl flex items-center justify-between z-10">
          <div>
            <h2 className="text-[15px] font-bold text-[#1a1a1a]">
              Xử lý khiếu nại
            </h2>
            <p className="text-xs text-[#888] mt-0.5">
              Đơn #{rental?._id?.slice(-6).toUpperCase()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-[#f5f5f5] flex items-center justify-center transition-colors"
          >
            <FontAwesomeIcon icon={faTimes} className="text-[#888]" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Order summary */}
          <div className="bg-[#fafafa] rounded-xl p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[#888]">Khách hàng</span>
              <span className="font-semibold text-[#1a1a1a]">
                {rental?.customerId?.fullName || "—"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#888]">Tổng tiền</span>
              <span
                className={`font-bold ${isHighValue ? "text-red-600" : "text-[#1a1a1a]"
                  }`}
              >
                {formatCurrency(rental?.totalAmount)}
              </span>
            </div>
            {isHighValue && role === "staff" && !isEscalated && (
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-2">
                ⚠️ Đơn hàng có giá trị cao (từ 1 triệu VNĐ). Nhân viên chỉ
                được phép đẩy lên Chủ cửa hàng xử lý.
              </p>
            )}
          </div>

          {canAcceptReject && (
            <div>
              <label className="block text-xs font-semibold text-[#555] uppercase tracking-wider mb-2">
                Hành động
              </label>
              {!action ? (
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setAction("accept")}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                  >
                    <FontAwesomeIcon icon={faCheck} /> Đồng ý — yêu cầu trả hàng
                  </button>
                  <button
                    onClick={() => setAction("reject")}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                  >
                    <FontAwesomeIcon icon={faTimes} /> Từ chối
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    {action === "accept" ? (
                      <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700">
                        <FontAwesomeIcon icon={faCheck} /> Đồng ý — yêu cầu trả hàng
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-red-700">
                        <FontAwesomeIcon icon={faTimes} /> Từ chối
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setAction("");
                      setRejectReason("");
                      setFiles([]);
                    }}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    Thay đổi
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Reject reason */}
          {action === "reject" && (
            <div>
              <label className="block text-xs font-semibold text-[#555] uppercase tracking-wider mb-2">
                Lý do từ chối *
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                className="w-full border border-[#e0e0e0] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1a1a1a] resize-none"
                placeholder="Mô tả lý do từ chối khiếu nại..."
              />
            </div>
          )}

          {/* Evidence upload */}
          {action && action !== "accept" && role !== "owner" && (
            <div>
              <label className="block text-xs font-semibold text-[#555] uppercase tracking-wider mb-2">
                {action === "escalate"
                  ? "Ảnh/Video sản phẩm nhận lại từ khách *"
                  : "Ảnh/Video bằng chứng từ cửa hàng *"}
              </label>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="w-full border-2 border-dashed border-[#d0d0d0] rounded-xl py-4 text-sm text-[#888] hover:border-[#1a1a1a] hover:text-[#1a1a1a] transition-colors"
              >
                <FontAwesomeIcon icon={faImage} className="mr-2" />
                Nhấn để chọn ảnh/video (tối đa 4 ảnh + 1 video)
              </button>
              <input
                ref={fileRef}
                type="file"
                multiple
                accept="image/*,video/mp4,video/quicktime"
                className="hidden"
                onChange={handleFileChange}
              />
              {files.length > 0 && (
                <div className="flex gap-2 mt-3 flex-wrap">
                  {files.map((f, i) => (
                    <div
                      key={i}
                      className="w-16 h-16 rounded-lg overflow-hidden border border-[#eaeaea] relative group bg-black flex items-center justify-center shrink-0"
                    >
                      {f.type === "video" ? (
                        <div className="w-full h-full flex items-center justify-center">
                          <FontAwesomeIcon
                            icon={faVideo}
                            className="text-white"
                          />
                        </div>
                      ) : (
                        <img
                          src={f.preview}
                          alt={`preview-${i}`}
                          className="max-h-full max-w-full object-contain"
                        />
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(i)}
                        className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
                      >
                        <FontAwesomeIcon icon={faTimes} className="text-[8px]" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-[#eaeaea] px-6 py-4 rounded-b-2xl flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-[#e0e0e0] text-sm font-medium text-[#555] hover:bg-[#f5f5f5] transition-colors"
          >
            Hủy bỏ
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !action}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 ${action === "escalate"
              ? "bg-violet-600 hover:bg-violet-700 text-white"
              : "bg-[#1a1a1a] hover:bg-[#333] text-white"
              }`}
          >
            {submitting && (
              <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
            )}
            {action === "escalate" ? "Đẩy lên Chủ cửa hàng" : "Xác nhận"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Detail Drawer ─────────────────────────────────────────────────────────── */
function DetailDrawer({ issue, role, onClose, onAction }) {
  const rental = issue.rentalId;
  const customer = rental?.customerId;
  const isHighValue = (rental?.totalAmount || 0) >= 1000000;
  const isEscalated = issue.status === "escalated";
  const canHandle =
    issue.status === "pending" || (issue.status === "escalated" && role === "owner");

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col z-10">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-[#eaeaea] px-6 py-4 flex items-center justify-between z-10 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div>
              <h2 className="text-[15px] font-bold text-[#1a1a1a]">
                Chi tiết khiếu nại
              </h2>
              <p className="text-xs text-[#888] mt-0.5">
                #{issue._id?.slice(-8).toUpperCase()}
              </p>
            </div>
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_STYLES[issue.status]}`}
            >
              {STATUS_LABELS[issue.status] || issue.status}
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-[#f5f5f5] flex items-center justify-center transition-colors"
          >
            <FontAwesomeIcon icon={faTimes} className="text-[#888]" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 px-6 py-5 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Cột trái: Thông tin khách hàng, đơn hàng & Sản phẩm */}
            <div className="space-y-6">
              {/* Customer info */}
              <div>
                <p className="text-xs font-bold text-[#555] uppercase tracking-wider mb-2.5">
                  Thông tin khách hàng
                </p>
                <div className="bg-[#fafafa] rounded-xl p-4 space-y-2.5 text-sm border border-[#eaeaea]">
                  <div className="flex justify-between">
                    <span className="text-[#888]">Họ tên</span>
                    <span className="font-semibold text-[#1a1a1a]">{customer?.fullName || "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#888]">Email</span>
                    <span className="text-[#555]">{customer?.email || "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#888]">SĐT</span>
                    <span className="text-[#555]">{customer?.phone || "—"}</span>
                  </div>
                </div>
              </div>

              {/* Order info */}
              <div>
                <p className="text-xs font-bold text-[#555] uppercase tracking-wider mb-2.5">
                  Thông tin đơn hàng & Sản phẩm
                </p>
                <div className="bg-[#fafafa] rounded-xl p-4 space-y-3.5 text-sm border border-[#eaeaea]">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-[#888]">Mã đơn</span>
                      <span className="font-mono font-semibold text-[#1a1a1a]">
                        {rental?._id?.slice(-8).toUpperCase() || "—"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#888]">Tổng tiền</span>
                      <span
                        className={`font-bold ${isHighValue ? "text-red-600" : "text-[#1a1a1a]"
                          }`}
                      >
                        {formatCurrency(rental?.totalAmount)}
                        {isHighValue && " ⚠️"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#888]">Ngày thuê</span>
                      <span className="text-[#555]">{formatDate(rental?.startDate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#888]">Ngày trả</span>
                      <span className="text-[#555]">{formatDate(rental?.endDate)}</span>
                    </div>
                  </div>

                  {/* Products List */}
                  <div className="border-t border-[#eaeaea] pt-3.5">
                    <p className="text-xs font-bold text-[#888] uppercase tracking-wider mb-2.5">
                      Sản phẩm thuê
                    </p>
                    <div className="space-y-3">
                      {rental?.items?.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-start text-xs border-b border-[#f5f5f5] pb-2.5 last:border-0 last:pb-0">
                          <div className="flex-1 pr-2">
                            <p className="font-semibold text-[#1a1a1a] leading-tight">
                              {item.costume?.name || "Sản phẩm không tên"}
                            </p>
                            <p className="text-[10px] text-[#888] mt-1">
                              Size: <span className="font-semibold text-[#333]">{item.size}</span> | Số lượng: <span className="font-semibold text-[#333]">{item.quantity}</span>
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="font-medium text-[#1a1a1a]">{formatCurrency(item.rentalPricePerDay)}/ngày</p>
                            <p className="text-[10px] text-[#888]">Cọc: {formatCurrency(item.depositPrice)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Cột phải: Thông tin khiếu nại & Bằng chứng */}
            <div className="space-y-6">
              {/* Issue content */}
              <div>
                <p className="text-xs font-bold text-[#555] uppercase tracking-wider mb-2.5">
                  Chi tiết khiếu nại
                </p>
                <div className="bg-[#fafafa] rounded-xl p-4 space-y-3.5 text-sm border border-[#eaeaea]">
                  <div className="bg-amber-50/70 border border-amber-100 rounded-xl p-3">
                    <p className="text-xs text-amber-700 font-semibold mb-1">
                      Yêu cầu giải quyết
                    </p>
                    <p className="text-sm font-semibold text-amber-900">
                      {RESOLUTION_LABELS[issue.resolution] || issue.resolution}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#888] font-semibold mb-1">
                      Lý do khiếu nại
                    </p>
                    <p className="text-sm text-[#333] leading-relaxed bg-white border border-[#eaeaea] p-3 rounded-lg">
                      {issue.reason}
                    </p>
                  </div>
                  {issue.note && (
                    <div>
                      <p className="text-xs text-[#888] font-semibold mb-1">
                        Ghi chú thêm
                      </p>
                      <p className="text-sm text-[#555] bg-white border border-[#eaeaea] p-3 rounded-lg">{issue.note}</p>
                    </div>
                  )}
                  <div className="text-xs text-[#999] italic pt-1">
                    Gửi lúc: {formatDate(issue.createdAt)}
                  </div>
                </div>
              </div>

              {/* Customer evidence */}
              <div>
                <p className="text-xs font-bold text-[#555] uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <FontAwesomeIcon icon={faImage} />
                  Bằng chứng từ khách hàng
                </p>
                <MediaViewer urls={issue.evidence || []} title="Bằng chứng khách" />
              </div>

              {/* Store evidence */}
              {issue.rejectEvidence?.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-[#555] uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                    <FontAwesomeIcon icon={faImage} />
                    {isEscalated
                      ? "Bằng chứng từ nhân viên (lúc nhận hàng)"
                      : "Bằng chứng từ cửa hàng (từ chối)"}
                  </p>
                  <MediaViewer
                    urls={issue.rejectEvidence}
                    title="Bằng chứng cửa hàng"
                  />
                </div>
              )}

              {/* Reject reason */}
              {issue.rejectReason && (
                <div className="bg-red-50/70 border border-red-100 rounded-xl p-4">
                  <p className="text-xs text-red-600 font-semibold mb-1">
                    Lý do từ chối
                  </p>
                  <p className="text-sm text-red-800 font-medium">{issue.rejectReason}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer actions */}
        {canHandle && (
          <div className="sticky bottom-0 bg-white border-t border-[#eaeaea] px-6 py-4 rounded-b-2xl">
            <button
              onClick={() => onAction(issue)}
              className="w-full py-3 bg-[#1a1a1a] text-white rounded-xl font-semibold text-sm hover:bg-[#333] transition-colors flex items-center justify-center gap-2"
            >
              <FontAwesomeIcon icon={faGavel} />
              Xử lý khiếu nại này
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function IssuesManagePage() {
  const { role } = useAuth();
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [handleTarget, setHandleTarget] = useState(null);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((t) => ({ ...t, show: false })), 3000);
  };

  const fetchIssues = useCallback(async () => {
    setLoading(true);
    try {
      const params = statusFilter !== "all" ? { status: statusFilter } : {};
      const res = await issueService.getAll(params);
      // axiosClient interceptor đã unwrap response.data, nên res = { success, issues }
      setIssues(Array.isArray(res.issues) ? res.issues : []);
    } catch {
      showToast("Không thể tải danh sách khiếu nại.", "error");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchIssues();
    setCurrentPage(1);
  }, [fetchIssues]);

  const filtered = issues.filter((iss) => {
    const name = (iss.rentalId?.customerId?.fullName || "").toLowerCase();
    const orderId = (iss.rentalId?._id || "").toLowerCase();
    const term = searchTerm.toLowerCase().trim();
    return !term || name.includes(term) || orderId.includes(term);
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const paginated = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const FILTER_TABS = [
    { key: "all", label: "Tất cả" },
    { key: "pending", label: "Chờ xử lý" },
    { key: "escalated", label: "Chờ Owner" },
    { key: "accepted", label: "Đã chấp nhận" },
    { key: "rejected", label: "Đã từ chối" },
    { key: "cancelled", label: "Đã hủy" },
  ];

  return (
    <div className="flex flex-col min-h-full">
      {/* Toast */}
      {toast.show && (
        <div
          className={`fixed top-5 right-5 z-[100] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-lg border text-sm font-medium transition-all ${toast.type === "success"
            ? "bg-white text-emerald-700 border-emerald-200"
            : "bg-white text-red-700 border-red-200"
            }`}
        >
          <FontAwesomeIcon
            icon={
              toast.type === "success" ? faCheck : faCircleExclamation
            }
          />
          {toast.message}
        </div>
      )}


      {/* Search */}
      <SearchInput
        value={searchTerm}
        onChange={(e) => {
          setSearchTerm(e.target.value);
          setCurrentPage(1);
        }}
        placeholder="Tìm theo tên khách hàng hoặc mã đơn..."
        wrapperClassName="w-full md:w-2/6"
      />

      <div className="flex gap-1.5 flex-wrap my-3">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setStatusFilter(tab.key);
              setCurrentPage(1);
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${statusFilter === tab.key
              ? "bg-[#1a1a1a] text-white"
              : "bg-white text-[#555] border border-[#eaeaea] hover:border-[#ccc]"
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table using DataTable */}
      <div className="flex-1">
        <DataTable
          isLoading={loading}
          isEmpty={!loading && filtered.length === 0}
          emptyMessage="Không tìm thấy khiếu nại nào"
          footer={
            totalPages > 1 && (
              <Pagination
                displayCount={paginated.length}
                totalCount={filtered.length}
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(page) => setCurrentPage(page)}
              />
            )
          }
        >
          <thead>
            <tr className="border-border border-[#f0f0f0] bg-gray-50/50">
              <th className="py-4 px-6 text-xs font-semibold text-[#999] uppercase tracking-wider text-left">Mã đơn</th>
              <th className="py-4 px-6 text-xs font-semibold text-[#999] uppercase tracking-wider text-left">Khách hàng</th>
              <th className="py-4 px-6 text-xs font-semibold text-[#999] uppercase tracking-wider text-left">Yêu cầu</th>
              <th className="py-4 px-6 text-xs font-semibold text-[#999] uppercase tracking-wider text-left">Giá trị</th>
              <th className="py-4 px-6 text-xs font-semibold text-[#999] uppercase tracking-wider text-left">Ngày gửi</th>
              <th className="py-4 px-6 text-xs font-semibold text-[#999] uppercase tracking-wider text-center">Trạng thái</th>
              <th className="py-4 px-6 text-xs font-semibold text-[#999] uppercase tracking-wider text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((iss) => {
              const rental = iss.rentalId;
              const customer = rental?.customerId;
              const isHighValue = (rental?.totalAmount || 0) >= 1000000;
              const canHandle =
                iss.status === "pending" || (iss.status === "escalated" && role === "owner");
              return (
                <tr
                  key={iss._id}
                  className="border-b border-[#eaeaea] hover:bg-[#faf9f7] transition-colors"
                >
                  <td className="py-4 px-6 text-sm text-[#1a1a1a] text-left">
                    <span className="font-mono text-xs text-[#555] font-semibold">
                      #{rental?._id?.slice(-6).toUpperCase() || "—"}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-sm text-[#1a1a1a] text-left">
                    <p className="font-semibold text-[#1a1a1a] text-[13px]">
                      {customer?.fullName || "—"}
                    </p>
                    <p className="text-[11px] text-[#aaa]">
                      {customer?.email || ""}
                    </p>
                  </td>
                  <td className="py-4 px-6 text-sm text-[#555] text-left">
                    <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 text-[11px] font-semibold border border-amber-100">
                      {RESOLUTION_LABELS[iss.resolution] || iss.resolution}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-sm text-[#555] text-left">
                    <span
                      className={`text-[13px] font-bold ${isHighValue ? "text-red-600" : "text-[#333]"}`}
                    >
                      {formatCurrency(rental?.totalAmount)}
                      {isHighValue && (
                        <span className="ml-1 text-[10px]">⚠️</span>
                      )}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-sm text-[#555] text-left">
                    {formatDate(iss.createdAt)}
                  </td>
                  <td className="py-4 px-6 text-sm text-center">
                    <span
                      className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_STYLES[iss.status]}`}
                    >
                      {STATUS_LABELS[iss.status] || iss.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-sm text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => setSelectedIssue(iss)}
                        title="Xem chi tiết"
                        className="w-8 h-8 rounded-full flex items-center justify-center text-[#1a1a1a] hover:bg-[#eaeaea] transition-colors"
                      >
                        <FontAwesomeIcon icon={faInfoCircle} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </DataTable>
      </div>

      {/* Detail Drawer */}
      {
        selectedIssue && (
          <DetailDrawer
            issue={selectedIssue}
            role={role}
            onClose={() => setSelectedIssue(null)}
            onAction={(iss) => {
              setSelectedIssue(null);
              setHandleTarget(iss);
            }}
          />
        )
      }

      {/* Handle Modal */}
      {
        handleTarget && (
          <HandleModal
            issue={handleTarget}
            role={role}
            onClose={() => setHandleTarget(null)}
            onSuccess={() => {
              setHandleTarget(null);
              showToast("Xử lý khiếu nại thành công!");
              fetchIssues();
            }}
          />
        )
      }
    </div >
  );
}
