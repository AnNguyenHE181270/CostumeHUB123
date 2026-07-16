import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import issueService from "../../services/issue.service";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleExclamation,
  faSearch,
  faCheck,
  faTimes,
  faArrowUp,
  faEye,
  faImage,
  faVideo,
  faSpinner,
  faChevronLeft,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";

const STATUS_LABELS = {
  pending: "Chờ xử lý",
  escalated: "Chờ Owner duyệt",
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
      <div className="rounded-xl overflow-hidden bg-black aspect-video relative flex items-center justify-center">
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
            className="max-h-full max-w-full object-contain"
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
  const [action, setAction] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef();

  const rental = issue.rentalId;
  const isHighValue = (rental?.totalAmount || 0) > 1000000;
  const isEscalated = issue.status === "escalated";

  const canAcceptReject = role === "owner" || !isHighValue || isEscalated;
  const canEscalate = role === "staff" && isHighValue && !isEscalated;

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files);
    setFiles(selected);
    setPreviews(
      selected.map((f) => ({ url: URL.createObjectURL(f), type: f.type }))
    );
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
    if (action !== "accept" && files.length === 0) {
      setError("Vui lòng tải lên ít nhất 1 ảnh/video bằng chứng.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("action", action);
      if (rejectReason) formData.append("rejectReason", rejectReason);
      files.forEach((f) => formData.append("evidence", f));
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
                ⚠️ Đơn hàng có giá trị cao (&gt;1 triệu VNĐ). Nhân viên chỉ
                được phép đẩy lên Owner xử lý.
              </p>
            )}
          </div>

          {/* Action selector */}
          <div>
            <label className="block text-xs font-semibold text-[#555] uppercase tracking-wider mb-2">
              Hành động
            </label>
            <div className="flex flex-wrap gap-2">
              {canAcceptReject && (
                <>
                  <button
                    onClick={() => setAction("accept")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${action === "accept"
                      ? "bg-emerald-600 text-white border-emerald-600"
                      : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                      }`}
                  >
                    <FontAwesomeIcon icon={faCheck} /> Đồng ý hoàn tiền
                  </button>
                  <button
                    onClick={() => setAction("reject")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${action === "reject"
                      ? "bg-red-600 text-white border-red-600"
                      : "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                      }`}
                  >
                    <FontAwesomeIcon icon={faTimes} /> Từ chối
                  </button>
                </>
              )}
              {canEscalate && (
                <button
                  onClick={() => setAction("escalate")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${action === "escalate"
                    ? "bg-violet-600 text-white border-violet-600"
                    : "bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-100"
                    }`}
                >
                  <FontAwesomeIcon icon={faArrowUp} /> Đẩy lên Owner
                </button>
              )}
            </div>
          </div>

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
          {action && action !== "accept" && (
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
              {previews.length > 0 && (
                <div className="flex gap-2 mt-3 flex-wrap">
                  {previews.map((p, i) => (
                    <div
                      key={i}
                      className="w-16 h-16 rounded-lg overflow-hidden border border-[#eaeaea]"
                    >
                      {p.type.startsWith("video/") ? (
                        <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                          <FontAwesomeIcon
                            icon={faVideo}
                            className="text-white"
                          />
                        </div>
                      ) : (
                        <img
                          src={p.url}
                          alt={`preview-${i}`}
                          className="w-full h-full object-cover"
                        />
                      )}
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
            className="px-5 py-2.5 rounded-xl bg-[#1a1a1a] text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#333] transition-colors flex items-center gap-2"
          >
            {submitting && (
              <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
            )}
            Xác nhận
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
  const isHighValue = (rental?.totalAmount || 0) > 1000000;
  const isEscalated = issue.status === "escalated";
  const canHandle =
    issue.status === "pending" || issue.status === "escalated";

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white w-full max-w-[480px] h-full overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-[#eaeaea] px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-[15px] font-bold text-[#1a1a1a]">
              Chi tiết khiếu nại
            </h2>
            <p className="text-xs text-[#888] mt-0.5">
              #{issue._id?.slice(-8).toUpperCase()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-[#f5f5f5] flex items-center justify-center transition-colors"
          >
            <FontAwesomeIcon icon={faTimes} className="text-[#888]" />
          </button>
        </div>

        <div className="flex-1 px-6 py-5 space-y-6">
          <span
            className={`inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-semibold ${STATUS_STYLES[issue.status]}`}
          >
            {STATUS_LABELS[issue.status] || issue.status}
          </span>

          {/* Customer info */}
          <div>
            <p className="text-xs font-semibold text-[#555] uppercase tracking-wider mb-3">
              Thông tin khách hàng
            </p>
            <div className="bg-[#fafafa] rounded-xl p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[#888]">Họ tên</span>
                <span className="font-semibold">{customer?.fullName || "—"}</span>
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
            <p className="text-xs font-semibold text-[#555] uppercase tracking-wider mb-3">
              Thông tin đơn hàng
            </p>
            <div className="bg-[#fafafa] rounded-xl p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[#888]">Mã đơn</span>
                <span className="font-mono font-semibold">
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
                <span>{formatDate(rental?.startDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#888]">Ngày trả</span>
                <span>{formatDate(rental?.endDate)}</span>
              </div>
            </div>
          </div>

          {/* Issue content */}
          <div>
            <p className="text-xs font-semibold text-[#555] uppercase tracking-wider mb-3">
              Nội dung khiếu nại
            </p>
            <div className="space-y-3">
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                <p className="text-xs text-amber-600 font-semibold mb-1">
                  Yêu cầu giải quyết
                </p>
                <p className="text-sm font-semibold text-[#1a1a1a]">
                  {RESOLUTION_LABELS[issue.resolution] || issue.resolution}
                </p>
              </div>
              <div className="bg-[#fafafa] rounded-xl p-4">
                <p className="text-xs text-[#888] font-semibold mb-1">
                  Lý do khiếu nại
                </p>
                <p className="text-sm text-[#333] leading-relaxed">
                  {issue.reason}
                </p>
              </div>
              {issue.note && (
                <div className="bg-[#fafafa] rounded-xl p-4">
                  <p className="text-xs text-[#888] font-semibold mb-1">
                    Ghi chú thêm
                  </p>
                  <p className="text-sm text-[#555]">{issue.note}</p>
                </div>
              )}
              <div className="text-xs text-[#888]">
                Gửi lúc: {formatDate(issue.createdAt)}
              </div>
            </div>
          </div>

          {/* Customer evidence */}
          <div>
            <p className="text-xs font-semibold text-[#555] uppercase tracking-wider mb-3">
              <FontAwesomeIcon icon={faImage} className="mr-1.5" />
              Bằng chứng từ khách hàng
            </p>
            <MediaViewer urls={issue.evidence || []} title="Bằng chứng khách" />
          </div>

          {/* Store evidence */}
          {issue.rejectEvidence?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-[#555] uppercase tracking-wider mb-3">
                <FontAwesomeIcon icon={faImage} className="mr-1.5" />
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
            <div className="bg-red-50 border border-red-100 rounded-xl p-4">
              <p className="text-xs text-red-600 font-semibold mb-1">
                Lý do từ chối
              </p>
              <p className="text-sm text-red-800">{issue.rejectReason}</p>
            </div>
          )}
        </div>

        {canHandle && (
          <div className="sticky bottom-0 bg-white border-t border-[#eaeaea] px-6 py-4">
            <button
              onClick={() => onAction(issue)}
              className="w-full py-3 bg-[#1a1a1a] text-white rounded-xl font-semibold text-sm hover:bg-[#333] transition-colors flex items-center justify-center gap-2"
            >
              <FontAwesomeIcon icon={faCircleExclamation} />
              Xử lý khiếu nại này
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Main Page ─────────────────────────────────────────────────────────────── */
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

      <div className="sticky top-0 z-20 bg-white pt-6 pb-4 -mx-6 px-6">

        {/* Status filter tabs */}
        <div className="flex gap-1.5 flex-wrap mb-3">
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

        {/* Search */}
        <div className="relative">
          <FontAwesomeIcon
            icon={faSearch}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#aaa] text-xs"
          />
          <input
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-[#eaeaea] rounded-xl focus:outline-none focus:border-[#1a1a1a] transition-colors"
            placeholder="Tìm theo tên khách hàng hoặc mã đơn..."
          />
        </div>
      </div>

      {/* Table */}
      <div className="flex-1">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#eaeaea] border-t-[#1a1a1a]" />
          </div>
        ) : paginated.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <div className="w-16 h-16 rounded-2xl bg-[#f0f0f0] flex items-center justify-center">
              <FontAwesomeIcon
                icon={faCircleExclamation}
                className="text-[#ccc] text-2xl"
              />
            </div>
            <p className="text-[#aaa] text-sm">Không có khiếu nại nào</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-[#eaeaea] bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#f0f0f0] bg-[#fafafa]">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#888] uppercase tracking-wider">
                    Mã đơn
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#888] uppercase tracking-wider">
                    Khách hàng
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#888] uppercase tracking-wider">
                    Yêu cầu
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#888] uppercase tracking-wider">
                    Giá trị
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#888] uppercase tracking-wider">
                    Ngày gửi
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-[#888] uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-[#888] uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f5f5f5]">
                {paginated.map((iss) => {
                  const rental = iss.rentalId;
                  const customer = rental?.customerId;
                  const isHighValue = (rental?.totalAmount || 0) > 1000000;
                  const canHandle =
                    iss.status === "pending" || iss.status === "escalated";
                  return (
                    <tr
                      key={iss._id}
                      className="hover:bg-[#fafafa] transition-colors"
                    >
                      <td className="px-4 py-3.5">
                        <span className="font-mono text-xs text-[#555] font-semibold">
                          #{rental?._id?.slice(-6).toUpperCase() || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="font-semibold text-[#1a1a1a] text-[13px]">
                          {customer?.fullName || "—"}
                        </p>
                        <p className="text-[11px] text-[#aaa]">
                          {customer?.email || ""}
                        </p>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 text-[11px] font-semibold border border-amber-100">
                          {RESOLUTION_LABELS[iss.resolution] || iss.resolution}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`text-[13px] font-bold ${isHighValue ? "text-red-600" : "text-[#333]"
                            }`}
                        >
                          {formatCurrency(rental?.totalAmount)}
                          {isHighValue && (
                            <span className="ml-1 text-[10px]">⚠️</span>
                          )}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-[#555] text-[12px]">
                        {formatDate(iss.createdAt)}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span
                          className={`inline-block px-3 py-1.5 rounded-xl text-[11px] font-semibold ${STATUS_STYLES[iss.status]}`}
                        >
                          {STATUS_LABELS[iss.status] || iss.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setSelectedIssue(iss)}
                            title="Xem chi tiết"
                            className="w-8 h-8 rounded-lg border border-[#eaeaea] flex items-center justify-center text-[#888] hover:bg-[#f5f5f5] hover:text-[#1a1a1a] transition-colors"
                          >
                            <FontAwesomeIcon icon={faEye} size="xs" />
                          </button>
                          {canHandle && (
                            <button
                              onClick={() => setHandleTarget(iss)}
                              title="Xử lý khiếu nại"
                              className="w-8 h-8 rounded-lg border border-[#1a1a1a] bg-[#1a1a1a] flex items-center justify-center text-white hover:bg-[#333] transition-colors"
                            >
                              <FontAwesomeIcon
                                icon={faCircleExclamation}
                                size="xs"
                              />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="border-t border-[#f0f0f0] px-4 py-3 flex items-center justify-between">
                <span className="text-xs text-[#aaa]">
                  {(currentPage - 1) * itemsPerPage + 1}–
                  {Math.min(currentPage * itemsPerPage, filtered.length)} /{" "}
                  {filtered.length}
                </span>
                <div className="flex gap-1">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => p - 1)}
                    className="w-7 h-7 rounded-lg border border-[#eaeaea] flex items-center justify-center text-[#888] hover:bg-[#f5f5f5] disabled:opacity-40 transition-colors"
                  >
                    <FontAwesomeIcon icon={faChevronLeft} size="xs" />
                  </button>
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => p + 1)}
                    className="w-7 h-7 rounded-lg border border-[#eaeaea] flex items-center justify-center text-[#888] hover:bg-[#f5f5f5] disabled:opacity-40 transition-colors"
                  >
                    <FontAwesomeIcon icon={faChevronRight} size="xs" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Detail Drawer */}
      {selectedIssue && (
        <DetailDrawer
          issue={selectedIssue}
          role={role}
          onClose={() => setSelectedIssue(null)}
          onAction={(iss) => {
            setSelectedIssue(null);
            setHandleTarget(iss);
          }}
        />
      )}

      {/* Handle Modal */}
      {handleTarget && (
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
      )}
    </div>
  );
}
