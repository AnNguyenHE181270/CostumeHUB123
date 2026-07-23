import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCamera } from "@fortawesome/free-solid-svg-icons";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import Toast from "../components/ui/Toast";
import userService from "../services/user.service";

export default function ProfilePage() {
  const { loading, user, token, login } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({ isVisible: false, message: "", type: "success" });
  const [avatarFile, setAvatarFile] = useState(null);
  
  const [form, setForm] = useState({
      fullName: "",
      phone: "",
      gender: "",
      dateOfBirth: "",
      avatar: "",
  });


  useEffect(() => {
    if (user) {
      setForm({
        fullName: user.fullName ,
        phone: user.phone ,
        gender: user.gender ,
        dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : "",
        avatar: user.avatar ,
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
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

      await userService.updateMyProfile(formData);

      // Refetch profile to update Header/Sidebar globally
      await login(token, true);

      setToast({ isVisible: true, type: "success", message: "Cập nhật thông tin thành công!" });
    } catch {
      setToast({ isVisible: true, type: "error", message: "Lỗi kết nối mạng. Vui lòng thử lại." });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="bg-white border border-[#eaeaea] p-8 md:p-10 h-full">
      <h3 className="text-2xl font-bold text-[#1a1a1a] mb-10 pb-4 border-b border-[#eaeaea]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
        Thông Tin Cá Nhân
      </h3>
      
      <Toast 
        isVisible={toast.isVisible} 
        message={toast.message} 
        type={toast.type} 
        onClose={() => setToast({ ...toast, isVisible: false })} 
      />

      <div className="flex flex-col lg:flex-row gap-12 lg:items-start pb-8 border-b border-[#eaeaea]">
        {/* Avatar Section */}
        <div className="flex flex-col items-center lg:w-[220px] shrink-0 border-r-0 lg:border-r border-[#eaeaea] lg:pr-12">
          <div className="relative mb-4">
            <div className="w-32 h-32 rounded-full border border-[#eaeaea] bg-[#faf9f7] text-[#1a1a1a] flex items-center justify-center overflow-hidden relative shadow-sm">
              <img src={form.avatar || user.avatar || "https://i.pravatar.cc/300"} alt="User Avatar" className="w-full h-full object-cover" />
            </div>
          </div>
          <div className="text-center">
            <h4 className="text-lg font-bold text-[#1a1a1a] mb-4">{form.fullName || user.fullName}</h4>
            <label className="inline-flex items-center gap-2 border border-gray-300 rounded-lg px-4 py-2.5 text-[11px] font-semibold text-[#1a1a1a] uppercase tracking-wider hover:bg-gray-50 active:scale-[0.985] transition-all cursor-pointer shadow-sm">
              <FontAwesomeIcon icon={faCamera} className="text-xs" />
              <span>ĐỔI ẢNH</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
            </label>
          </div>
        </div>

        <div className="flex-1">
          <form onSubmit={handleSubmit} id="profile-form">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold text-[#555] uppercase tracking-[0.1em] mb-2">
                  Họ và Tên
                </label>
                <Input
                  type="text"
                  name="fullName"
                  value={form.fullName}
                  onChange={handleChange}
                  className="!rounded-lg"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#555] uppercase tracking-[0.1em] mb-2">
                  Địa chỉ Email
                </label>
                <Input
                  type="email"
                  name="email"
                  defaultValue={user.email}
                  readOnly
                  className="!rounded-lg"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#555] uppercase tracking-[0.1em] mb-2">
                  Số Điện Thoại
                </label>
                <Input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  className="!rounded-lg"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#555] uppercase tracking-[0.1em] mb-2">
                  Giới Tính
                </label>
                <div className="relative">
                  <select
                    name="gender"
                    value={form.gender}
                    onChange={handleChange}
                    className="w-full bg-surface border border-border rounded-lg px-4 py-3 text-sm text-text-primary outline-none transition-all duration-200 focus:border-primary-500 focus:bg-background focus:ring-1 focus:ring-primary-500 appearance-none"
                  >
                    <option value="male">Nam</option>
                    <option value="female">Nữ</option>
                    <option value="other">Khác</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-[#999]">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#555] uppercase tracking-[0.1em] mb-2">
                  Ngày Sinh
                </label>
                <Input
                  type="date"
                  name="dateOfBirth"
                  value={form.dateOfBirth}
                  onChange={handleChange}
                  className="!rounded-lg"
                />
              </div>
            </div>
          </form>
        </div>
      </div>



      {/* Submit Button Section */}
      <div className="flex justify-end mt-6 pt-4 border-t border-[#eaeaea]">
        <Button 
          type="submit" 
          form="profile-form"
          disabled={submitting}
          className="!rounded-lg max-w-[200px] bg-[#1a1a1a] text-white hover:bg-black font-semibold py-3.5 px-8 text-[12px] tracking-[0.1em] uppercase transition-all duration-200"
        >
          {submitting ? "Đang lưu..." : "LƯU THAY ĐỔI"}
        </Button>
      </div>
    </div>
  );
}
