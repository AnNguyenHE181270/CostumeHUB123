import React, { useState } from "react";
import Modal from "../../components/Modal";
import Selector from "../../components/ui/Selector";
import Button from "../../components/ui/Button";
import Radio from "../../components/ui/Radio";

export function IssuesModal({ open, onOpenChange, order }) {
    const [resolution, setResolution] = useState("refund");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [reason, setReason] = useState("");

    const REASON_OPTIONS = [
        { value: "", label: "Chọn lý do của bạn", disabled: true },
        { value: "product_damage", label: "Sản phẩm bị hư hỏng / rách" },
        { value: "wrong_item", label: "Giao sai mẫu mã / kích thước" },
        { value: "late_delivery", label: "Giao hàng chậm trễ" },
        { value: "quality_issue", label: "Chất lượng không như mô tả" },
        { value: "other", label: "Lý do khác" },
    ];

    const RESOLUTION_OPTIONS = [
        { value: "refund", label: "Hoàn tiền" },
        { value: "return_refund", label: "Trả hàng & Hoàn tiền" },
        { value: "exchange", label: "Đổi trả khác" },
    ];

    const handleSubmit = (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        setTimeout(() => {
            alert("Khiếu nại của bạn đã được gửi thành công. Velvet & Vow sẽ phản hồi sớm nhất.");
            setIsSubmitting(false);
            if (onOpenChange) onOpenChange(false);
        }, 1500);
    };

    return (
        <Modal isOpen={open} onClose={() => onOpenChange(false)} title="Gửi khiếu nại đơn hàng">
            <p className="text-md font-medium pb-2">Lý do khiếu nại<span className="text-red-500 pl-1">*</span></p>
            <Selector
                value={reason}
                options={REASON_OPTIONS}
                onChange={setReason}
                className="w-full"
            />
            <p className="text-md font-medium p-1 mt-2">Bằng chứng<span className="text-red-500 pl-1">*</span></p>
            <p className="text-xs text-red-500 mb-2">(JPG, PNG, MP4. Dung lượng tối đa 20MB/file)</p>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                <label className="aspect-square flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors rounded-lg group border border-gray-200 border-dashed">
                    <input accept="image/*,video/*" className="hidden" multiple type="file" />
                    <span className="material-symbols-outlined text-gray-400 group-hover:text-black transition-colors">add_a_photo</span>
                    <span className="text-[10px] mt-1 text-gray-400 font-medium">TẢI LÊN</span>
                </label>
                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden relative group">
                    <img alt="Evidence 1" className="w-full h-full object-cover opacity-80" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAUTlBYyYFJvymwcZ7hukdJ8PG5n4dBQ0jVdcvh_fHwqs1LwWYHvclyJANLtDvBWqyGwVJqj6PuDguo_S_b37axhd14JbxSRakuW-pGgeqb-F_NRkjdJ-UJJQr5JNTeeTcdbDqO3fnSUSxnA_kFgo6dKkVNIFzXxaOwfcqeXH2VPXV-HS4BNMGcRFJq1reUyB9teF5gS6J3U8jOWAE0XlqQpCxIdeU-_UGO0ozTRkjlU4Dluba-kRAHeCCGPR35bM8Cs9if6c2Eov1n" />
                    <button className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" type="button">
                        <span className="material-symbols-outlined text-[14px]">close</span>
                    </button>
                </div>
            </div>

            <p className="text-md font-medium p-1 mt-2"> Phương thức giải quyết<span className="text-red-500 pl-1">*</span></p>
            {RESOLUTION_OPTIONS.map((opt) => (
                <label
                    key={opt.value}
                    htmlFor={`resolution-${opt.value}`}
                    className={[
                        "flex items-center gap-2 p-2 my-1 border rounded-lg cursor-pointer transition-colors",
                        resolution === opt.value
                            ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary/50"
                            : "border-gray-200 hover:bg-gray-50",
                    ].join(" ")}
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

            <p className="text-md font-medium p-1 mt-2"> Ghi chú thêm</p>
            <textarea
                className="w-full bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-black focus:ring-1 focus:ring-black p-3 resize-none text-sm placeholder:text-gray-400"
                placeholder="Mô tả chi tiết tình trạng sản phẩm và yêu cầu của bạn..."
                rows="3"
            />

            <div className="flex gap-3 pt-1">
                <Button
                    type="button"
                    variant="secondary"
                    onClick={() => onOpenChange(false)}
                >
                    Hủy
                </Button>
                <Button
                    type="submit"
                    variant="primary"
                    onClick={handleSubmit}
                    loading={isSubmitting}
                >
                    Khiếu nại
                </Button>
            </div>

        </Modal>
    );
}

export default IssuesModal;