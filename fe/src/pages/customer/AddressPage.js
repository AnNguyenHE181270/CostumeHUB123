import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faXmark, faCheck, faTruckFast, faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import { useAuth } from "../../context/AuthContext";
import Toast from "../../components/ui/Toast";
import { useNavigate, useLocation } from 'react-router-dom';
import GHNAddressSelect from "../../components/GHNAddressSelect";
import userService from "../../services/user.service";
import rentalService from "../../services/rental.service";

export default function AddressPage() {
  const { user, refreshProfile } = useAuth();
  const [showAddForm, setShowAddForm] = useState(false);
  const [phoneType, setPhoneType] = useState("my");
  const [loadingPage, setLoadingPage] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({ isVisible: false, message: "", type: "success" });
  const [addresses, setAddresses] = useState([]);
  const [deliveryEstimate, setDeliveryEstimate] = useState(null);
  const [form, setForm] = useState({
    receiverName: "", receiverPhone: "", province: "", provinceId: null, district: "", districtId: null, ward: "", wardCode: "", addressDetail: "", note: "", isDefault: false
  });
  const navigate = useNavigate();
  const location = useLocation();
  // Khách bấm "Thuê ngay" khi chưa có địa chỉ sẽ được điều hướng tới đây kèm ngày thuê đang chọn dở.
  const pendingStartDate = location.state?.pendingStartDate || null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };
  
  const handleGHNChange = (ghnData) => {
    setForm(prev => ({
        ...prev,
        ...ghnData
    }));
  };
  console.log(user)
  const handlePhoneTypeChange = (type) => {
    setPhoneType(type);
    if (type === "my") {
      setForm((prev) => ({ ...prev, receiverPhone: user.phone }));
    } else {
      setForm((prev) => ({ ...prev, receiverPhone: "" }));
    }
  };

const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);

    try {
      setToast({ isVisible: false, message: "", type: "success" });
      const data = await userService.createAddress(form);
      if (data.isDefault) {
        setAddresses(prev => [...prev.map(addr => ({ ...addr, isDefault: false })), data]);
      } else {
        setAddresses(prev => [...prev, data]);
      }
      setShowAddForm(false);
      setToast({ isVisible: true, type: "success", message: "Tạo địa chỉ thành công!" });
      // Đồng bộ lại user.addresses trong AuthContext, nếu không trang thanh toán sẽ
      // vẫn thấy danh sách địa chỉ cũ (không có địa chỉ vừa thêm) do lấy dữ liệu từ đó.
      await refreshProfile();

      // Báo ngay dự kiến ngày giao GHN cho địa chỉ vừa thêm, không đợi khách vào bước thanh toán mới biết.
      // Nếu khách tới đây từ luồng "Thuê ngay" (có pendingStartDate), so sánh luôn và nhắc chỉnh lại ngày thuê nếu không kịp.
      if (data.districtId && data.wardCode) {
        setDeliveryEstimate(null);
        rentalService
          .estimateDelivery(data.districtId, data.wardCode)
          .then((res) => {
            const estimatedDate = new Date(res.estimatedDeliveryDate);
            const isLate = pendingStartDate ? new Date(pendingStartDate) < estimatedDate : false;
            setDeliveryEstimate({
              addressLabel: `${data.ward}, ${data.district}, ${data.province}`,
              date: estimatedDate,
              isLate,
            });
          })
          .catch(() => {});
      }
    } catch (err) {
      setToast({ isVisible: true, type: "error", message: err.message || "Lỗi tạo địa chỉ." });
    } finally {
      setSubmitting(false);
    }
  };

  const getAllAddresses = async () => {
    try {
      setLoadingPage(true);
      setToast({ isVisible: false, message: "", type: "success" });
      const data = await userService.getAddresses();
      let fetchedAddresses = data.addresses || [];
      let defaultCount = 0;
      fetchedAddresses = fetchedAddresses.reverse().map(addr => {
        if (addr.isDefault) {
          defaultCount++;
          if (defaultCount > 1) return { ...addr, isDefault: false };
        }
        return addr;
      }).reverse();
      setAddresses(fetchedAddresses);
    } catch (err) {
      setToast({ isVisible: true, type: "error", message: err.message || "Network error while loading data." });
    } finally {
      setLoadingPage(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      const data = await userService.deleteAddress(id);
      setToast({ isVisible: true, type: "success", message: data.message || "Delete address successfully!" });
      await getAllAddresses();
      await refreshProfile();
    } catch (err) {
      setToast({ isVisible: true, type: "error", message: err.message || "Network error while deleting data." });
    } finally {
      setLoadingPage(false);
    }
  };
  useEffect(() => { getAllAddresses(); }, []);
  const handleClick = (id) =>{
    navigate(`/user/address/${id}`)
  }
  return (
    <div className="bg-white border border-[#eaeaea] p-8 md:p-10 h-full relative">
      <Toast 
        isVisible={toast.isVisible} 
        message={toast.message} 
        type={toast.type} 
        onClose={() => setToast({ ...toast, isVisible: false })} 
      />

      {deliveryEstimate && (
        <div
          className={`mb-6 flex items-start gap-3 rounded-2xl border p-4 ${
            deliveryEstimate.isLate ? "border-amber-300 bg-amber-50" : "border-emerald-200 bg-emerald-50"
          }`}
        >
          <FontAwesomeIcon
            icon={deliveryEstimate.isLate ? faTriangleExclamation : faTruckFast}
            className={`mt-0.5 text-lg shrink-0 ${deliveryEstimate.isLate ? "text-amber-500" : "text-emerald-600"}`}
          />
          <p className={`flex-1 text-[13px] leading-relaxed font-medium ${deliveryEstimate.isLate ? "text-amber-800" : "text-emerald-800"}`}>
            {deliveryEstimate.isLate ? (
              <>
                Đơn hàng của bạn dự kiến được giao tới <strong>{deliveryEstimate.addressLabel}</strong> vào{" "}
                {deliveryEstimate.date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })}
                , hãy chỉnh sửa lại ngày thuê cho phù hợp để được hỗ trợ tốt nhất.
              </>
            ) : (
              <>
                Dự kiến đơn hàng giao tới <strong>{deliveryEstimate.addressLabel}</strong> vào khoảng{" "}
                {deliveryEstimate.date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })}.
              </>
            )}
          </p>
          <button
            onClick={() => setDeliveryEstimate(null)}
            className={`transition-colors shrink-0 ${deliveryEstimate.isLate ? "text-amber-500 hover:text-amber-700" : "text-emerald-500 hover:text-emerald-700"}`}
            title="Đóng"
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>
      )}

      <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#eaeaea]">
        <h3 className="text-2xl font-bold text-[#1a1a1a]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
          Địa Chỉ Của Tôi
        </h3>
        {!showAddForm && (
          <button 
            onClick={() => {
              setPhoneType("my");
              setForm({
                receiverName: "", receiverPhone: user?.phone || "", province: "", provinceId: null, district: "", districtId: null, ward: "", wardCode: "", addressDetail: "", note: "", isDefault: false
              });
              setShowAddForm(true);
            }}
            className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.1em] bg-[#1a1a1a] text-white px-5 py-2 hover:bg-[#333] transition-colors"
          >
            <FontAwesomeIcon icon={faPlus} /> Thêm Địa Chỉ
          </button>
        )}
      </div>

      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-opacity duration-300">
          <div 
            className="bg-white w-full max-w-[600px] max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md px-6 py-4 border-b border-[#eaeaea] flex items-center justify-between">
              <h3 className="text-xl font-bold text-[#1a1a1a] tracking-tight">Thêm Địa Chỉ Mới</h3>
              <button onClick={() => setShowAddForm(false)} className="w-8 h-8 flex items-center justify-center rounded-full text-[#858585] hover:text-[#1a1a1a] hover:bg-[#f4f4f4] transition-colors">
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>

            <div className="p-6">
              <form id="address-form" onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <Input label="Họ và tên người nhận" name="receiverName" value={form.receiverName} onChange={handleChange} placeholder="Ví dụ: Nguyễn Văn A" required />
                  
                  <div className="flex flex-col">
                    <Input label="Số điện thoại" name="receiverPhone" type="tel" value={form.receiverPhone} onChange={handleChange} placeholder="Ví dụ: 0912345678" disabled={phoneType === "my"} required />
                    <div className="flex gap-4 mt-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="phoneType" value="my" checked={phoneType === "my"} onChange={() => handlePhoneTypeChange("my")} className="w-3.5 h-3.5 text-[#1a1a1a] focus:ring-[#1a1a1a] cursor-pointer" />
                        <span className="text-xs text-[#555] font-medium">Số của tôi</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="phoneType" value="other" checked={phoneType === "other"} onChange={() => handlePhoneTypeChange("other")} className="w-3.5 h-3.5 text-[#1a1a1a] focus:ring-[#1a1a1a] cursor-pointer" />
                        <span className="text-xs text-[#555] font-medium">Số người khác</span>
                      </label>
                    </div>
                  </div>
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
              </form>
            </div>

            <div className="sticky bottom-0 z-10 bg-white/80 backdrop-blur-md px-6 py-4 border-t border-[#eaeaea] flex justify-end gap-3 rounded-b-2xl">
              <button type="button" onClick={() => setShowAddForm(false)} className="px-6 py-2.5 rounded-xl border border-[#eaeaea] text-[#555] text-sm font-semibold hover:bg-[#f4f4f4] transition-colors">
                Hủy Bỏ
              </button>
              <button type="submit" form="address-form" className="px-6 py-2.5 rounded-xl bg-[#1a1a1a] border border-[#1a1a1a] text-white text-sm font-semibold hover:bg-[#333] transition-colors">
                Thêm Địa Chỉ
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {addresses.map((addr) => (
          <div key={addr.id} className="border border-[#eaeaea] p-6 flex flex-col md:flex-row md:items-start justify-between gap-4 hover:border-[#ccc] transition-colors">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="font-bold text-[#1a1a1a] text-lg">{addr.receiverName}</span>
                <span className="text-[#858585]">|</span>
                <span className="text-[#555]">{addr.receiverPhone}</span>
                {addr.isDefault && (
                  <span className="text-[10px] uppercase tracking-[0.1em] font-semibold border border-[#1a1a1a] text-[#1a1a1a] px-2 py-1 ml-2">
                    Mặc định
                  </span>
                )}
              </div>
              <p className="text-[#555] text-sm mb-1">{addr.addressDetail}</p>
              <p className="text-[#555] text-sm">{addr.ward}, {addr.district}, {addr.province}</p>
            </div>
            
            <div className="flex items-center gap-4 mt-4 md:mt-0">
              <button className="text-[12px] uppercase tracking-[0.1em] font-semibold text-[#1a1a1a] hover:text-[#555] transition-colors" onClick={() =>handleClick(addr._id)}>
                Sửa
              </button>
              {!addr.isDefault && (
                <button className="text-[12px] uppercase tracking-[0.1em] font-semibold text-red-600 hover:text-red-800 transition-colors "onClick={() =>handleDelete(addr._id)}>
                  Xóa
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
