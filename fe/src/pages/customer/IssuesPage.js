import React, { useState, useEffect } from "react";
import Modal from "../../components/Modal";
import Selector from "../../components/ui/Selector";
import Button from "../../components/ui/Button";
import Radio from "../../components/ui/Radio";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBox, faCamera, faTimes } from "@fortawesome/free-solid-svg-icons"
import { statusOrder } from "../../constants/statusOrder";
import Toast from "../../components/ui/Toast";
import ConfirmModal from "../../components/ui/ConfirmModal";
import issueService from "../../services/issue.service";

export function IssuesModal({ open, onOpenChange, order, onSuccess }) {
    const [resolution, setResolution] = useState("return_refund");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [reason, setReason] = useState("");
    const [customReason, setCustomReason] = useState("");
    const [errors, setErrors] = useState({
        reason: "",
        customReason: "",
        evidence: "",
        submit: ""
    });
    const [toast, setToast] = useState({ isVisible: false, message: "", type: "success" });
    const [files, setFiles] = useState([]);
    const [note, setNote] = useState("");
    const [existingIssue, setExistingIssue] = useState(null);
    const [isLoadingIssue, setIsLoadingIssue] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);

    useEffect(() => {
        if (open && order) {
            const fetchExistingIssue = async () => {
                setIsLoadingIssue(true);
                try {
                    const data = await issueService.getByRentalId(order.id || order._id);
                    if (data.success && data.issue) {
                        setExistingIssue(data.issue);
                    } else {
                        setExistingIssue(null);
                    }
                } catch (err) {
                    console.error("Lỗi khi tải thông tin khiếu nại:", err);
                    setExistingIssue(null);
                } finally {
                    setIsLoadingIssue(false);
                }
            };
            fetchExistingIssue();
        } else {
            setExistingIssue(null);
        }
    }, [open, order]);

    useEffect(() => {
        if (!open) {
            setReason("");
            setCustomReason("");
            setResolution("return_refund");
            setErrors({
                reason: "",
                customReason: "",
                evidence: "",
                submit: ""
            });
            setNote("");
            files.forEach((f) => URL.revokeObjectURL(f.preview));
            setFiles([]);
            setToast({ isVisible: false, message: "", type: "success" });
            setExistingIssue(null);
        }
    }, [open]);

    const handleCancelIssue = () => {
        if (!existingIssue) return;
        setIsConfirmOpen(true);
    };

    const handleCancelConfirm = () => {
        setIsConfirmOpen(false);
    };

    const handleConfirm = async () => {
        setIsConfirmOpen(false);
        setIsCancelling(true);
        try {
            const data = await issueService.cancel(existingIssue._id);
            if (data.success) {
                setToast({ isVisible: true, message: "Hủy khiếu nại thành công.", type: "success" });
                if (onSuccess) onSuccess();
                if (onOpenChange) onOpenChange(false);
            } else {
                setErrors(prev => ({ ...prev, submit: data.message || "Đã xảy ra lỗi khi hủy khiếu nại." }));
            }
        } catch (err) {
            setErrors(prev => ({ ...prev, submit: err.message || "Đã xảy ra lỗi kết nối đến máy chủ." }));
        } finally {
            setIsCancelling(false);
        }
    };

    const handleFileChange = (e) => {
        setErrors(prev => ({ ...prev, evidence: "" }));
        const selectedFiles = Array.from(e.target.files);
        if (selectedFiles.length === 0) return;

        let newFiles = [...files];
        let imageCount = newFiles.filter(f => f.type === "image").length;
        let videoCount = newFiles.filter(f => f.type === "video").length;

        for (const file of selectedFiles) {
            const isImage = file.type.startsWith("image/");
            const isVideo = file.type.startsWith("video/");

            if (!isImage && !isVideo) {
                setErrors(prev => ({ ...prev, evidence: `Tệp "${file.name}" không hợp lệ. Chỉ chấp nhận tệp ảnh hoặc video.` }));
                continue;
            }

            if (isImage) {
                if (imageCount >= 4) {
                    setErrors(prev => ({ ...prev, evidence: "Chỉ được tải lên tối đa 4 ảnh." }));
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
                    setErrors(prev => ({ ...prev, evidence: "Chỉ được tải lên tối đa 1 video." }));
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
        URL.revokeObjectURL(newFiles[index].preview);
        newFiles.splice(index, 1);
        setFiles(newFiles);
    };

    const REASON_OPTIONS = [
        { value: "", label: "Chọn lý do của bạn", disabled: true },
        { value: "product_damage", label: "Sản phẩm bị hư hỏng / rách" },
        { value: "wrong_item", label: "Giao sai mẫu mã / kích thước" },
        { value: "late_delivery", label: "Giao hàng chậm trễ" },
        { value: "quality_issue", label: "Chất lượng không như mô tả" },
        { value: "other", label: "Khác" },
    ];

    const RESOLUTION_OPTIONS = [
        { value: "return_refund", label: "Trả hàng & Hoàn tiền" },
        { value: "exchange", label: "Đổi trả khác" },
    ];

    const statusInfo = typeof order?.status === "object" ? order.status : (statusOrder[order?.status] || null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const newErrors = {
            reason: "",
            customReason: "",
            evidence: "",
            submit: ""
        };

        let hasError = false;
        if (!reason) {
            newErrors.reason = "Vui lòng chọn lý do khiếu nại.";
            hasError = true;
        }
        if (reason === "other" && !customReason.trim()) {
            newErrors.customReason = "Vui lòng nhập lý do cụ thể.";
            hasError = true;
        }
        if (files.length === 0) {
            newErrors.evidence = "Vui lòng tải lên bằng chứng (ảnh hoặc video).";
            hasError = true;
        }

        if (hasError) {
            setErrors(newErrors);
            return;
        }

        setErrors(newErrors);
        setIsSubmitting(true);
        try {
            const formData = new FormData();
            formData.append("rentalId", order._id || order.id);

            const selectedReason = reason === "other"
                ? customReason.trim()
                : REASON_OPTIONS.find(r => r.value === reason)?.label || reason;

            formData.append("reason", selectedReason);
            formData.append("resolution", resolution);
            formData.append("note", note.trim());

            files.forEach((f) => {
                formData.append("evidence", f.file);
            });

            const data = await issueService.create(formData);

            if (data.success) {
                setToast({ isVisible: true, message: "Khiếu nại của bạn đã được gửi thành công.", type: "success" });
                if (onSuccess) onSuccess();
                if (onOpenChange) onOpenChange(false);
            } else {
                setErrors(prev => ({ ...prev, submit: data.message || "Đã xảy ra lỗi khi gửi khiếu nại." }));
            }
        } catch (err) {
            setErrors(prev => ({ ...prev, submit: err.message || "Đã xảy ra lỗi kết nối đến máy chủ." }));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <Modal isOpen={open} onClose={() => onOpenChange(false)} title={existingIssue ? "Chi tiết khiếu nại" : "Gửi khiếu nại đơn hàng"}>
                <p className="text-xl font-semibold mb-4">
                    {existingIssue ? "Yêu cầu khiếu nại của bạn" : "Bạn cần trợ giúp với đơn hàng này?"}
                </p>

                {order?.items?.map((item, index) => (
                    <div key={index} className="rounded-lg border border-border p-2 mb-4">
                        <div className="flex gap-4">
                            <div className="h-24 w-20 shrink-0 rounded-lg bg-[oklch(0.92_0.03_130)] flex items-center justify-center overflow-hidden border border-border">
                                {item.image ? (
                                    <img src={item.image} alt={item.costumeName} className="h-full w-full object-cover" />
                                ) : (
                                    <FontAwesomeIcon icon={faBox} className="h-8 w-8 text-[oklch(0.7_0.04_130)]" />
                                )}
                            </div>
                            <div className="flex-1">
                                <div className="flex items-start justify-between pb-2 gap-2">
                                    <h3 className="text-lg font-bold" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                                        {item.costumeName}
                                    </h3>
                                    {index === 0 && statusInfo && (
                                        <span className={
                                            "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium " +
                                            (statusInfo.className || "")
                                        }>
                                            {statusInfo.label}
                                        </span>
                                    )}
                                </div>
                                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                                    {item.size && <span>Size: {item.size}</span>}
                                    <span>Số lượng: {item.quantity}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {isLoadingIssue ? (
                    <div className="flex flex-col items-center justify-center py-12">
                        <p className="text-sm text-[#858585] font-medium animate-pulse">Đang tải thông tin khiếu nại...</p>
                    </div>
                ) : existingIssue ? (
                    <div className="mt-4 space-y-6">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-[#858585]">Trạng thái khiếu nại</span>
                            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${existingIssue.status === 'pending' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                                existingIssue.status === 'resolved' ? 'bg-green-100 text-green-800 border border-green-200' :
                                    existingIssue.status === 'cancelled' ? 'bg-gray-100 text-gray-800 border border-gray-200' :
                                        'bg-red-100 text-red-800 border border-red-200'
                                }`}>
                                {existingIssue.status === 'pending' ? 'Chờ xử lý' :
                                    existingIssue.status === 'resolved' ? 'Đã giải quyết' :
                                        existingIssue.status === 'cancelled' ? 'Đã hủy' : 'Đã từ chối'}
                            </span>
                        </div>

                        <div>
                            <p className="text-sm font-medium text-[#858585] pb-2">Lý do khiếu nại</p>
                            <div className="text-sm font-semibold text-[#1a1a1a] bg-[#faf9f7] p-3 rounded-lg border border-[#eaeaea]">
                                {existingIssue.reason}
                            </div>
                        </div>

                        <div>
                            <p className="text-sm font-medium text-[#858585] pb-2">Phương thức giải quyết đề xuất</p>
                            <div className="text-sm font-semibold text-[#1a1a1a] bg-[#faf9f7] p-3 rounded-lg border border-[#eaeaea]">
                                {existingIssue.resolution === 'return_refund' ? 'Trả hàng & Hoàn tiền' : 'Đổi trả khác'}
                            </div>
                        </div>

                        {existingIssue.note && (
                            <div>
                                <p className="text-sm font-medium text-[#858585] pb-2">Ghi chú thêm</p>
                                <div className="text-sm text-[#555] bg-[#faf9f7] p-3 rounded-lg border border-[#eaeaea] whitespace-pre-wrap">
                                    {existingIssue.note}
                                </div>
                            </div>
                        )}

                        {existingIssue.evidence && existingIssue.evidence.length > 0 && (
                            <div>
                                <p className="text-sm font-medium text-[#858585] pb-2">Bằng chứng đã cung cấp</p>
                                <div className="flex flex-wrap gap-3">
                                    {existingIssue.evidence.map((url, idx) => {
                                        const isVideo = url.toLowerCase().endsWith('.mp4') || url.includes('/video/');
                                        return (
                                            <div key={idx} className="w-20 h-20 bg-[#faf9f7] rounded-lg overflow-hidden relative border border-[#eaeaea] shrink-0">
                                                {isVideo ? (
                                                    <video
                                                        src={url}
                                                        className="w-full h-full object-cover"
                                                        controls
                                                    />
                                                ) : (
                                                    <img
                                                        src={url}
                                                        alt={`Evidence ${idx + 1}`}
                                                        className="w-full h-full object-cover cursor-zoom-in hover:opacity-90 transition-opacity"
                                                        onClick={() => window.open(url, '_blank')}
                                                    />
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {errors.submit && (
                            <p className="text-xs text-red-500 mt-2 mb-1">{errors.submit}</p>
                        )}

                        <div className="flex gap-3 pt-4 border-t border-[#eaeaea]">
                            <Button
                                type="button"
                                onClick={() => onOpenChange(false)}
                            >
                                Đóng
                            </Button>
                            {existingIssue.status === 'pending' && (
                                <Button
                                    type="button"
                                    onClick={handleCancelIssue}
                                    loading={isCancelling}
                                    className="!bg-red-600 hover:!bg-red-700 text-white border-none shadow-sm"
                                >
                                    Hủy khiếu nại
                                </Button>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div>
                            <p className="text-sm font-medium pb-2">Lý do<span className="text-red-500 pl-1">*</span></p>
                            <div className="w-full [&>div]:w-full [&_select]:w-full">
                                <Selector
                                    options={REASON_OPTIONS}
                                    value={reason}
                                    onChange={(val) => {
                                        setReason(val);
                                        setErrors(prev => ({ ...prev, reason: "" }));
                                        if (val !== "other") {
                                            setCustomReason("");
                                            setErrors(prev => ({ ...prev, customReason: "" }));
                                        }
                                    }}
                                    className="w-full"
                                />
                            </div>
                            {errors.reason && (
                                <p className="text-xs text-red-500 mt-1">{errors.reason}</p>
                            )}
                        </div>

                        {reason === "other" && (
                            <div>
                                <textarea
                                    className={`w-full bg-white border rounded-lg focus:outline-none p-2.5 text-sm placeholder:text-gray-400 ${errors.customReason
                                        ? "border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                                        : "border-gray-200 focus:border-black focus:ring-1 focus:ring-black"
                                        }`}
                                    placeholder="Vui lòng nhập lý do cụ thể..."
                                    rows="3"
                                    value={customReason}
                                    onChange={(e) => {
                                        setCustomReason(e.target.value);
                                        if (e.target.value.trim()) {
                                            setErrors(prev => ({ ...prev, customReason: "" }));
                                        }
                                    }}
                                />
                                {errors.customReason && (
                                    <p className="text-xs text-red-500 mt-1">{errors.customReason}</p>
                                )}
                            </div>
                        )}

                        <div>
                            <p className="text-sm font-medium pb-2">Bằng chứng<span className="text-red-500 pl-1">*</span></p>
                            <p className="text-xs text-gray-500 mb-2">(Định dạng JPG, PNG, MP4. Tối đa 4 ảnh và 1 video)</p>

                            <div className="flex flex-wrap gap-3">
                                <label className="w-20 h-20 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors rounded-lg group border border-gray-200 border-dashed shrink-0">
                                    <input
                                        type="file"
                                        multiple
                                        accept="image/*,video/*"
                                        className="hidden"
                                        onChange={handleFileChange}
                                    />
                                    <FontAwesomeIcon icon={faCamera} className="text-gray-400 group-hover:text-black transition-colors text-lg" />
                                    <span className="text-[10px] mt-1 text-gray-400 font-medium">TẢI LÊN</span>
                                </label>

                                {files.map((file, idx) => (
                                    <div key={idx} className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden relative group border border-gray-200 shrink-0">
                                        {file.type === "image" ? (
                                            <img src={file.preview} alt={`Evidence ${idx + 1}`} className="w-full h-full object-cover" />
                                        ) : (
                                            <video src={file.preview} className="w-full h-full object-cover" />
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveFile(idx)}
                                            className="absolute top-1 right-1 bg-black/50 text-white w-5 h-5 flex items-center justify-center rounded-full hover:bg-black transition-colors"
                                        >
                                            <FontAwesomeIcon icon={faTimes} className="text-xs" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                            {errors.evidence && (
                                <p className="text-xs text-red-500 mt-2">{errors.evidence}</p>
                            )}
                        </div>

                        <div>
                            <p className="text-sm font-medium pb-2">Phương thức giải quyết<span className="text-red-500 pl-1">*</span></p>
                            {RESOLUTION_OPTIONS.map((opt) => (
                                <label
                                    key={opt.value}
                                    htmlFor={`resolution-${opt.value}`}
                                    className={
                                        "flex items-center gap-2 p-2 my-1 border rounded-lg cursor-pointer transition-colors " +
                                        (resolution === opt.value
                                            ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary/50"
                                            : "border-gray-200 hover:bg-gray-50")
                                    }
                                >
                                    <Radio
                                        id={`resolution-${opt.value}`}
                                        name="resolution"
                                        value={opt.value}
                                        checked={resolution === opt.value}
                                        onChange={(e) => setResolution(e.target.value)}
                                    />
                                    <span className="text-sm font-medium">{opt.label}</span>
                                </label>
                            ))}
                        </div>

                        <div>
                            <p className="text-sm font-medium pb-2">Ghi chú thêm (Tùy chọn)</p>
                            <textarea
                                className="w-full bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-black focus:ring-1 focus:ring-black p-3 resize-none text-sm placeholder:text-gray-400"
                                placeholder="Mô tả chi tiết tình trạng sản phẩm và yêu cầu của bạn..."
                                rows="4"
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                            />
                        </div>

                        {errors.submit && (
                            <p className="text-xs text-red-500 mt-2 mb-1">{errors.submit}</p>
                        )}

                        <div className="flex gap-3 pt-1">
                            <Button
                                type="button"
                                onClick={() => onOpenChange(false)}
                            >
                                Hủy
                            </Button>
                            <Button
                                type="submit"
                                onClick={handleSubmit}
                                loading={isSubmitting}
                            >
                                Khiếu nại
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
            <ConfirmModal
                isOpen={isConfirmOpen}
                onCancel={handleCancelConfirm}
                onConfirm={handleConfirm}
                title="Xác nhận"
                message="Bạn có chắc chắn muốn hủy yêu cầu khiếu nại này không?"
                zIndex="z-[10000]"
            />
            <Toast
                isVisible={toast.isVisible}
                message={toast.message}
                type={toast.type}
                onClose={() => setToast((prev) => ({ ...prev, isVisible: false }))}
            />
        </>
    );
}

export default IssuesModal;
