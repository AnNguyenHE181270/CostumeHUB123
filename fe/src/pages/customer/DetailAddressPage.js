import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faCheck } from "@fortawesome/free-solid-svg-icons";
import { useParams, useNavigate } from "react-router-dom";
import Input from "../../components/ui/Input";
import Toast from "../../components/ui/Toast";
import GHNAddressSelect from "../../components/GHNAddressSelect";
import { useAuth } from "../../context/AuthContext";

export default function DetailAddressPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();

  const [loadingPage, setLoadingPage] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({ isVisible: false, message: "", type: "success" });

  const [form, setForm] = useState({
    receiverName: "",
    receiverPhone: "",
    province: "",
    provinceId: null,
    district: "",
    districtId: null,
    ward: "",
    wardCode: "",
    addressDetail: "",
    note: "",
    isDefault: false
  });

  const handleGHNChange = (ghnData) => {
    setForm(prev => ({
        ...prev,
        ...ghnData
    }));
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const getDetailAddress = async () => {
    try {
      setLoadingPage(true);
      setToast({ isVisible: false, message: "", type: "success" });



      const response = await fetch(
        `http://localhost:9999/api/users/address/${id}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setToast({ isVisible: true, type: "error", message: data.message || "Failed to load user data." });
        return;
      }

      setForm({
        receiverName: data.address.receiverName,
        receiverPhone: data.address.receiverPhone,
        province: data.address.province,
        provinceId: data.address.provinceId,
        district: data.address.district,
        districtId: data.address.districtId,
        ward: data.address.ward,
        wardCode: data.address.wardCode,
        addressDetail: data.address.addressDetail,
        note: data.address.note,
        isDefault: data.address.isDefault,
      });

    } catch {
      setToast({ isVisible: true, type: "error", message: "Network error while loading data." });
    } finally {
      setLoadingPage(false);
    }
  };
  useEffect(() => { getDetailAddress(); }, []);



  const handleSubmit = async (e) => {
    e.preventDefault();

    if (submitting) return;

    try {
      setSubmitting(true);
      setToast({ isVisible: false, message: "", type: "success" });

      const response = await fetch(
        `http://localhost:9999/api/users/update-address/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(form),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setToast({
          isVisible: true,
          type: "error",
          message: data.errors?.[0]?.msg || data.message || "Update failed."
        });
        return;
      }

      setToast({ isVisible: true, type: "success", message: "Cập nhật tài khoản thành công!" });
      setTimeout(() => {
        setToast(prev => ({ ...prev, isVisible: false }));
        navigate(-1);
      }, 1500);
    } catch {
      setToast({ isVisible: true, type: "error", message: "Lỗi kết nối mạng. Vui lòng thử lại." });
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingPage) {
    return (
      <div className="bg-white border border-[#eaeaea] p-8 md:p-10 h-full flex items-center justify-center">
        <p className="text-[#858585]">Đang tải thông tin địa chỉ...</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#eaeaea] p-8 md:p-10 h-full relative">
      <Toast
        isVisible={toast.isVisible}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, isVisible: false })}
      />

      <div className="flex items-center gap-4 mb-8 pb-4 border-b border-[#eaeaea]">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 flex items-center justify-center rounded-full border border-[#eaeaea] hover:bg-[#f4f4f4] transition-colors"
        >
          <FontAwesomeIcon icon={faArrowLeft} className="text-[#1a1a1a]" />
        </button>
        <h3 className="text-2xl font-bold text-[#1a1a1a]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
          Chi Tiết Địa Chỉ
        </h3>
      </div>

      <div className="max-w-3xl">
        <form id="edit-address-form" onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Input label="Họ và tên người nhận" name="receiverName" value={form.receiverName} onChange={handleChange} placeholder="Ví dụ: Nguyễn Văn A" required />
            <Input label="Số điện thoại" name="receiverPhone" type="tel" value={form.receiverPhone} onChange={handleChange} placeholder="Ví dụ: 0912345678" required />
          </div>

          <GHNAddressSelect 
            provinceId={form.provinceId}
            districtId={form.districtId}
            wardCode={form.wardCode}
            onChange={handleGHNChange}
          />

          <Input label="Địa chỉ cụ thể (Số nhà, tên đường)">
            <textarea name="addressDetail" value={form.addressDetail} onChange={handleChange} placeholder="Ví dụ: Số 12, ngõ 34, đường ABC" rows="2" className="w-full bg-surface border border-[#eaeaea] rounded-xl px-4 py-3 text-sm text-[#1a1a1a] outline-none transition-all duration-200 focus:border-[#1a1a1a] focus:bg-white focus:ring-1 focus:ring-[#1a1a1a] placeholder:text-[#999] resize-none" required />
          </Input>

          <Input label="Ghi chú (Tùy chọn)">
            <textarea name="note" value={form.note} onChange={handleChange} placeholder="Ví dụ: Giao giờ hành chính..." rows="2" className="w-full bg-surface border border-[#eaeaea] rounded-xl px-4 py-3 text-sm text-[#1a1a1a] outline-none transition-all duration-200 focus:border-[#1a1a1a] focus:bg-white focus:ring-1 focus:ring-[#1a1a1a] placeholder:text-[#999] resize-none" />
          </Input>

          <div className="flex items-center gap-3 pt-2">
            <button type="button" role="checkbox" aria-checked={form.isDefault} onClick={() => handleChange({ target: { name: "isDefault", type: "checkbox", checked: !form.isDefault } })} className={`flex-shrink-0 w-5 h-5 rounded border flex items-center justify-center transition-all duration-200 ${form.isDefault ? "bg-[#1a1a1a] border-[#1a1a1a]" : "bg-surface border-[#eaeaea] hover:border-[#1a1a1a]"}`}>
              {form.isDefault && <FontAwesomeIcon icon={faCheck} className="text-white text-[10px]" />}
            </button>
            <span className="text-sm font-medium text-[#1a1a1a] cursor-pointer" onClick={() => handleChange({ target: { name: "isDefault", type: "checkbox", checked: !form.isDefault } })}>
              Đặt làm địa chỉ mặc định
            </span>
          </div>

          <div className="pt-6 mt-6 border-t border-[#eaeaea] flex justify-end gap-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-8 py-3 rounded-xl border border-[#eaeaea] text-[#555] text-sm font-semibold hover:bg-[#f4f4f4] transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-8 py-3 rounded-xl bg-[#1a1a1a] border border-[#1a1a1a] text-white text-sm font-semibold hover:bg-[#333] transition-colors disabled:opacity-50"
            >
              {submitting ? "Đang lưu..." : "Lưu Thay Đổi"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
