import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faEnvelope, faPhone, faCalendarDay, faVenusMars, faCamera } from "@fortawesome/free-solid-svg-icons";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import Toast from "../components/ui/Toast";
import { formatPrice } from "../utils/formatters";

export default function ProfilePage() {
  const { loading, user, token, login } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({ isVisible: false, message: "", type: "success" });
  const [avatarFile, setAvatarFile] = useState(null);
  const [topUpAmount, setTopUpAmount] = useState("");
  const [isToppingUp, setIsToppingUp] = useState(false);
  
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

      const response = await fetch(
        `http://localhost:9999/api/users/update-my-profile`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );
  
      const data = await response.json();
  
      if (!response.ok) {
        setToast({
          isVisible: true,
          type: "error",
          message: data.errors?.[0]?.msg || data.message || "Cập nhật thất bại."
        });
        return;
      }

      // Refetch profile to update Header/Sidebar globally
      await login(token, true);

      setToast({ isVisible: true, type: "success", message: "Cập nhật thông tin thành công!" });
    } catch {
      setToast({ isVisible: true, type: "error", message: "Lỗi kết nối mạng. Vui lòng thử lại." });
    } finally {
      setSubmitting(false);
    }
  };

  const handleTopUp = async () => {
    if (!topUpAmount || isNaN(topUpAmount) || Number(topUpAmount) < 10000) {
      setToast({ isVisible: true, type: "error", message: "Số tiền nạp tối thiểu là 10.000 VNĐ" });
      return;
    }
    
    try {
      setIsToppingUp(true);
      const res = await fetch(`http://localhost:9999/api/vnpays/create-payment-url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ amount: Number(topUpAmount) })
      });
      const data = await res.json();
      if (data.success && data.paymentUrl) {
        window.location.href = data.paymentUrl;
      } else {
        setToast({ isVisible: true, type: "error", message: data.message || "Không thể tạo liên kết nạp tiền" });
      }
    } catch (err) {
      setToast({ isVisible: true, type: "error", message: "Lỗi kết nối khi nạp tiền" });
    } finally {
      setIsToppingUp(false);
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

      <div className="flex flex-col lg:flex-row gap-12 lg:items-start">
        {/* Avatar Section */}
        <div className="flex flex-col items-center lg:w-[280px] shrink-0 border-r-0 lg:border-r border-[#eaeaea] lg:pr-12">
          <div className="relative group mb-6">
            <div className="w-40 h-40 rounded-full border border-[#eaeaea] bg-[#faf9f7] text-[#1a1a1a] flex items-center justify-center font-bold text-4xl overflow-hidden relative shadow-sm">
              <img src={form.avatar || user.avatar || "https://i.pravatar.cc/300"} alt="User Avatar" className="w-full h-full object-cover" />
              
              <label className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-pointer">
                <FontAwesomeIcon icon={faCamera} className="text-[#1a1a1a] text-2xl mb-2" />
                <span className="text-[#1a1a1a] text-[11px] font-bold uppercase tracking-wider">Chọn ảnh</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
              </label>
            </div>
          </div>
          <div className="text-center">
            <h4 className="text-lg font-bold text-[#1a1a1a] mb-1">{form.fullName || user.fullName}</h4>
            <p className="text-[11px] text-[#999] tracking-[0.1em] uppercase mb-4">Thành viên Vogue</p>
            <p className="text-[12px] text-[#858585] mb-1">Dung lượng tối đa 1 MB</p>
            <p className="text-[12px] text-[#858585]">Định dạng: .JPEG, .PNG</p>
          </div>
        </div>

        <div className="flex-1">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-8">
              <div className="md:col-span-2">
                <label className="flex items-center gap-2 text-[10px] font-semibold text-[#555] uppercase tracking-[0.1em] mb-2">
                  <FontAwesomeIcon icon={faUser} /> Họ và Tên
                </label>
                <Input
                  type="text"
                  name="fullName"
                  value={form.fullName}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-[10px] font-semibold text-[#555] uppercase tracking-[0.1em] mb-2">
                  <FontAwesomeIcon icon={faEnvelope} /> Địa chỉ Email
                </label>
                <Input
                  type="email"
                  name="email"
                  defaultValue={user.email}
                  readOnly
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
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-[10px] font-semibold text-[#555] uppercase tracking-[0.1em] mb-2">
                  <FontAwesomeIcon icon={faVenusMars} /> Giới Tính
                </label>
                <div className="relative">
                  <select
                    name="gender"
                    value={form.gender}
                    onChange={handleChange}
                    className="w-full bg-surface border border-borderorder rounded-xl px-4 py-3 text-sm text-text-primary outline-none transition-all duration-200 focus:border-primary-500 focus:bg-background focus:ring-1 focus:ring-primary-500 appearance-none"
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
                <label className="flex items-center gap-2 text-[10px] font-semibold text-[#555] uppercase tracking-[0.1em] mb-2">
                  <FontAwesomeIcon icon={faCalendarDay} /> Ngày Sinh
                </label>
                <Input
                  type="date"
                  name="dateOfBirth"
                  value={form.dateOfBirth}
                  onChange={handleChange}
                />
              </div>

              <div className="md:col-span-2 pt-6 mt-2 border-t border-[#eaeaea]">
                <Button type="submit" variant="primary" disabled={submitting}>
                  {submitting ? "Đang lưu..." : "Lưu Thay Đổi"}
                </Button>
              </div>
            </div>
          </form>

          {/* Wallet Section */}
          <div className="mt-10 pt-8 border-t border-[#eaeaea]">
            <h4 className="text-xl font-bold text-[#1a1a1a] mb-6" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
              Ví Điện Tử
            </h4>
            <div className="bg-[#fcfaf5] border border-[#f0e6d3] p-6 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <p className="text-[12px] text-[#858585] tracking-[0.1em] uppercase mb-1">Số dư hiện tại</p>
                <p className="text-3xl font-bold text-[#1a1a1a]">{formatPrice(user.balance || 0)}</p>
              </div>
              <div className="flex items-center gap-3 w-full md:w-auto">
                <Input 
                  type="number" 
                  placeholder="Nhập số tiền nạp..." 
                  value={topUpAmount}
                  onChange={(e) => setTopUpAmount(e.target.value)}
                  className="max-w-[200px]"
                />
                <Button 
                  onClick={handleTopUp} 
                  disabled={isToppingUp}
                  className="whitespace-nowrap"
                >
                  {isToppingUp ? "Đang xử lý..." : "Nạp tiền qua VNPay"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
