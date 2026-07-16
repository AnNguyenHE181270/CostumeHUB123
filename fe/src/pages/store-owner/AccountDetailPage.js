import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faSave, faUser, faEnvelope, faPhone, faCalendarDay, faVenusMars, faCamera, faShieldAlt, faToggleOn } from "@fortawesome/free-solid-svg-icons";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Toast from "../../components/ui/Toast";
import userService from "../../services/user.service";

// Hàm Helper dịch Role sang Tiếng Việt
const translateRole = (roleName) => {
  if (!roleName) return "";
  const name = roleName.toLowerCase();
  if (name === "owner") return "Chủ cửa hàng";
  if (name === "staff") return "Nhân viên";
  if (name === "online-customer") return "Khách hàng";
  return roleName;
};

export default function AccountDetailPage() {
  const navigate = useNavigate();
  const [loadingPage, setLoadingPage] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({ isVisible: false, message: "", type: "success" });
  const [availableRoles, setAvailableRoles] = useState([]);
  const [avatarFile, setAvatarFile] = useState(null);

  const [form, setForm] = useState({
    phone: "",
    email: "",
    fullName: "",
    gender: "",
    dateOfBirth: "",
    avatar: "",
    status: "",
    role: "",
  });
  const { id } = useParams();

  const getDetailAccount = async () => {
    try {
      setLoadingPage(true);
      setToast({ isVisible: false, message: "", type: "success" });
      const data = await userService.getUserById(id);
      setForm({
        phone: data.user.phone,
        email: data.user.email,
        fullName: data.user.fullName,
        gender: data.user.gender,
        dateOfBirth: data.user.dateOfBirth ? new Date(data.user.dateOfBirth).toISOString().split('T')[0] : "",
        status: data.user.status,
        avatar: data.user.avatar,
        role: data.user.role?.name,
      });
    } catch (err) {
      setToast({ isVisible: true, type: "error", message: err.message || "Network error while loading data." });
    } finally {
      setLoadingPage(false);
    }
  };

  useEffect(() => { getDetailAccount(); }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Only allow changing role and status
    if (name === "role" || name === "status") {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm((prev) => ({ ...prev, avatar: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (submitting) return;

    try {
      setSubmitting(true);
      setToast({ isVisible: false, message: "", type: "success" });

      const formData = new FormData();

      Object.keys(form).forEach(key => {
        if (key !== 'avatar' && form[key] !== null && form[key] !== undefined) {
          formData.append(key, form[key]);
        }
      });

      if (avatarFile) {
        formData.append("avatar", avatarFile);
      } else if (form.avatar && !form.avatar.startsWith("data:image")) {
        formData.append("avatar", form.avatar);
      }

      await userService.updateUser(id, formData);
      setToast({ isVisible: true, type: "success", message: "Cập nhật tài khoản thành công!" });
      setTimeout(() => {
        setToast(prev => ({ ...prev, isVisible: false }));
        navigate(-1);
      }, 1500);
    } catch (err) {
      setToast({ isVisible: true, type: "error", message: err.message || "Lỗi kết nối mạng. Vui lòng thử lại." });
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingPage) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#eaeaea] border-t-[#1a1a1a]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border border-[#eaeaea] p-8 md:p-10 h-full">
        <Toast
          isVisible={toast.isVisible}
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, isVisible: false })}
        />

        <form onSubmit={handleSubmit}>
          <div className="flex flex-col lg:flex-row gap-12 lg:items-start">

            {/* Left Column: Avatar & System Access */}
            <div className="flex flex-col lg:w-[280px] shrink-0 border-r-0 lg:border-r border-[#eaeaea] lg:pr-12">

              <div className="flex flex-col items-center mb-10">
                <div className="relative group mb-6">
                  <div className="w-40 h-40 rounded-full border border-[#eaeaea] bg-[#faf9f7] text-[#1a1a1a] flex items-center justify-center font-bold text-4xl overflow-hidden relative shadow-sm">
                    {form.avatar ? (
                      <img src={form.avatar} alt="User Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span className="font-serif italic text-5xl text-[#ccc]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                        {form.fullName ? form.fullName.charAt(0).toUpperCase() : "U"}
                      </span>
                    )}

                    <label className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-pointer">
                      <FontAwesomeIcon icon={faCamera} className="text-[#1a1a1a] text-2xl mb-2" />
                      <span className="text-[#1a1a1a] text-[11px] font-bold uppercase tracking-wider">Chọn ảnh</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                    </label>
                  </div>
                </div>
                <div className="text-center">
                  <h4 className="text-lg font-bold text-[#1a1a1a] mb-1">{form.fullName || "Người Dùng"}</h4>
                  {/* FIX 1: Dịch Role dưới avatar */}
                  <p className="text-[11px] text-[#999] tracking-[0.1em] uppercase mb-4">{translateRole(form.role)}</p>
                </div>
              </div>

              {/* Phân quyền hệ thống */}
              <div>
                <h4 className="text-[14px] font-bold text-[#1a1a1a] uppercase tracking-[0.1em] mb-6 pb-2 border-b border-[#eaeaea]">
                  Phân Quyền
                </h4>
                <div className="space-y-6">
                  <div>
                    <label className="flex items-center gap-2 text-[10px] font-semibold text-[#555] uppercase tracking-[0.1em] mb-2">
                      <FontAwesomeIcon icon={faShieldAlt} /> Vai trò
                    </label>
                    <div className="relative">
                      <select
                        name="role"
                        value={form.role}
                        onChange={handleChange}
                        className="w-full bg-surface border border-borderorder rounded-xl px-4 py-3 text-sm text-text-primary outline-none transition-all duration-200 focus:border-primary-500 focus:bg-background focus:ring-1 focus:ring-primary-500 appearance-none"
                      >
                        {/* FIX 2: Dịch toàn bộ Option */}
                        {availableRoles.length > 0 ? (
                          availableRoles.map((r) => (
                            <option key={r._id} value={r.name}>
                              {translateRole(r.name)}
                            </option>
                          ))
                        ) : (
                          <>
                            <option value="staff">Nhân viên</option>
                            <option value="online-customer">Khách hàng</option>
                            <option value="owner">Chủ cửa hàng</option>
                          </>
                        )}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-[#999]">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-[10px] font-semibold text-[#555] uppercase tracking-[0.1em] mb-2">
                      <FontAwesomeIcon icon={faToggleOn} /> Trạng thái
                    </label>
                    <div className="relative">
                      <select
                        name="status"
                        value={form.status}
                        onChange={handleChange}
                        className={`w-full border rounded-xl px-4 py-3 text-sm outline-none transition-all duration-200 focus:ring-1 appearance-none ${form.status === "blocked"
                          ? "border-red-200 bg-red-50 text-red-900 focus:border-red-500 focus:ring-red-500"
                          : "bg-surface border-borderorder text-text-primary focus:border-primary-500 focus:bg-background focus:ring-primary-500"
                          }`}
                      >
                        <option value="active">Hoạt động (Active)</option>
                        <option value="pending">Chờ xử lý (Pending)</option>
                        <option value="blocked">Đã khóa (Blocked)</option>
                      </select>
                      <div className={`pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 ${form.status === "blocked" ? "text-red-500" : "text-[#999]"}`}>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Right Column: Form Section */}
            <div className="flex-1">

              {/* Thông tin cá nhân (Read Only) */}
              <div>
                <h4 className="text-[14px] font-bold text-[#1a1a1a] uppercase tracking-[0.1em] mb-6 pb-2 border-b border-[#eaeaea]">
                  Thông Tin Cá Nhân <span className="text-[#999] ml-2 normal-case font-normal text-[12px]">(Chỉ đọc)</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                  <div className="md:col-span-2">
                    <label className="flex items-center gap-2 text-[10px] font-semibold text-[#555] uppercase tracking-[0.1em] mb-2">
                      <FontAwesomeIcon icon={faUser} /> Họ và Tên
                    </label>
                    <Input
                      type="text"
                      name="fullName"
                      value={form.fullName}
                      readOnly
                      className="bg-[#f5f5f5] text-[#858585] cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-[10px] font-semibold text-[#555] uppercase tracking-[0.1em] mb-2">
                      <FontAwesomeIcon icon={faEnvelope} /> Địa chỉ Email
                    </label>
                    <Input
                      type="email"
                      name="email"
                      value={form.email}
                      readOnly
                      className="bg-[#f5f5f5] text-[#858585] cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-[10px] font-semibold text-[#555] uppercase tracking-[0.1em] mb-2">
                      <FontAwesomeIcon icon={faPhone} /> Số Điện Thoại
                    </label>
                    <Input
                      type="tel"
                      name="phone"
                      value={form.phone}
                      readOnly
                      className="bg-[#f5f5f5] text-[#858585] cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-[10px] font-semibold text-[#555] uppercase tracking-[0.1em] mb-2">
                      <FontAwesomeIcon icon={faVenusMars} /> Giới Tính
                    </label>
                    <Input
                      type="text"
                      name="gender"
                      value={form.gender === "male" ? "Nam" : form.gender === "female" ? "Nữ" : "Khác"}
                      readOnly
                      className="bg-[#f5f5f5] text-[#858585] cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-[10px] font-semibold text-[#555] uppercase tracking-[0.1em] mb-2">
                      <FontAwesomeIcon icon={faCalendarDay} /> Ngày Sinh
                    </label>
                    <Input
                      type="date"
                      name="dateOfBirth"
                      value={form.dateOfBirth}
                      readOnly
                      className="bg-[#f5f5f5] text-[#858585] cursor-not-allowed"
                    />
                  </div>

                  <div className="md:col-span-2 pt-6 mt-2 border-t border-[#eaeaea] flex items-center justify-end">
                    <Button type="submit" variant="primary" disabled={submitting}>
                      <FontAwesomeIcon icon={faSave} className="mr-2" />
                      {submitting ? "Đang lưu..." : "Lưu Thay Đổi"}
                    </Button>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </form>
      </div>
    </div>
  );
}