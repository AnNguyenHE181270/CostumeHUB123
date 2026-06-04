import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faSave, faUpload, faLink } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";

export default function CreateUserPage() {
  const navigate = useNavigate();

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [availableRoles, setAvailableRoles] = useState([]);
  const [avatarFile, setAvatarFile] = useState(null);
  
  const [form, setForm] = useState({
      phone: "",
      email: "",
      password: "",
      fullName: "",
      gender: "male",
      dateOfBirth: "",
      avatar: "",
      role: "",
  });

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const token = localStorage.getItem("token") || sessionStorage.getItem("token");
        const roleRes = await fetch("http://localhost:9999/api/roles/get-roles", {
          headers: { Authorization: `Bearer ${token}` }
        });
        const roleData = await roleRes.json();
        if (roleData.success && roleData.roles) {
          setAvailableRoles(roleData.roles.filter(r => r.name !== 'owner'));
        }
      } catch (err) {
        console.error("Failed to load roles", err);
      }
    };
    fetchRoles();
  }, []);

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
    
    if (!form.role) {
      setError("Vui lòng chọn vai trò (Role).");
      return;
    }
  
    try {
      setSubmitting(true);
      setError("");
      setSuccess("");
  
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      
      const formData = new FormData();
      Object.keys(form).forEach(key => {
        if (key !== 'avatar' && form[key] !== null && form[key] !== undefined && form[key] !== "") {
          formData.append(key, form[key]);
        }
      });

      if (avatarFile) {
        formData.append("avatar", avatarFile);
      } else if (form.avatar && !form.avatar.startsWith("data:image")) {
        formData.append("avatar", form.avatar);
      }

      formData.append("status", "active");

      const response = await fetch(
        `http://localhost:9999/api/users/user/create`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );
  
      const data = await response.json();
  
      if (!response.ok) {
        setError(
          data.errors?.[0]?.msg ||
          data.message ||
          "Creation failed."
        );
        return;
      }

      setSuccess("Account created successfully!");
      setTimeout(() => {
        setSuccess("");
        navigate(-1);
      }, 1500);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      {/* Toast Notifications */}
      {error && (
        <div className="fixed top-4 right-4 z-50 bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded shadow-md max-w-md">
          <p className="font-medium">Error</p>
          <p className="text-sm">{error}</p>
        </div>
      )}
      {success && (
        <div className="fixed top-4 right-4 z-50 bg-green-50 border-l-4 border-green-500 text-green-700 p-4 rounded shadow-md max-w-md">
          <p className="font-medium">Success</p>
          <p className="text-sm">{success}</p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10">
        <div>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="text-[12px] uppercase tracking-[0.1em] font-semibold text-[#555] hover:text-[#1a1a1a] transition-colors flex items-center gap-2 mb-4"
          >
            <FontAwesomeIcon icon={faArrowLeft} /> Quay lại
          </button>
          <h2 className="text-3xl font-bold text-[#1a1a1a] tracking-tight" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            Tạo Người Dùng Mới
          </h2>
          <p className="text-[#999] text-[14px] mt-2">
            Thêm tài khoản mới và thiết lập quyền truy cập hệ thống.
          </p>
        </div>
        <div className="shrink-0">
          <button
            type="submit"
            disabled={submitting}
            className="bg-[#1a1a1a] text-white text-[12px] uppercase tracking-[0.1em] font-semibold px-8 py-3.5 hover:bg-[#333] transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <FontAwesomeIcon icon={faSave} /> {submitting ? "Đang tạo..." : "Tạo Tài Khoản"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-4 space-y-10">
          <div className="bg-white border border-[#eaeaea] p-8 text-center flex flex-col items-center">
            <div className="relative group mb-6">
              <div className="w-32 h-32 rounded-full border border-[#eaeaea] bg-[#faf9f7] text-[#1a1a1a] flex items-center justify-center font-bold text-4xl overflow-hidden relative">
                {form.avatar ? (
                  <img src={form.avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="font-serif italic text-5xl text-[#ccc]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                    {form.fullName ? form.fullName.charAt(0).toUpperCase() : "U"}
                  </span>
                )}
                <label className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-pointer">
                  <FontAwesomeIcon icon={faUpload} className="text-[#1a1a1a] text-xl mb-1" />
                  <span className="text-[#1a1a1a] text-[10px] font-semibold uppercase tracking-wider">Tải lên</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                </label>
              </div>
            </div>
            
            <h3 className="text-xl font-bold text-[#1a1a1a] mb-1" style={{ fontFamily: "'Cormorant Garamond', serif" }}>{form.fullName || "Người Dùng Mới"}</h3>
            <p className="text-[12px] text-[#999] tracking-[0.1em] uppercase">{form.role || "Chưa phân quyền"}</p>

            <div className="w-full mt-6 text-left">
              <label className="block text-[10px] font-semibold text-[#555] uppercase tracking-[0.1em] mb-2">Hoặc dán liên kết ảnh</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#999]">
                  <FontAwesomeIcon icon={faLink} className="text-[12px]" />
                </div>
                <input
                  type="url"
                  name="avatar"
                  value={form.avatar}
                  onChange={handleChange}
                  placeholder="https://..."
                  className="w-full pl-9 pr-4 py-2.5 border border-[#eaeaea] bg-[#faf9f7] outline-none focus:border-[#1a1a1a] text-[13px] text-[#1a1a1a] transition-colors"
                />
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#eaeaea] p-8">
            <h3 className="text-lg font-bold text-[#1a1a1a] mb-6 border-b border-[#eaeaea] pb-4" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Phân Quyền Hệ Thống</h3>
            
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-semibold text-[#555] uppercase tracking-[0.1em] mb-2">Vai trò <span className="text-red-500">*</span></label>
                <div className="relative">
                  <select
                    name="role"
                    value={form.role}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-[#eaeaea] bg-[#faf9f7] text-[#1a1a1a] focus:border-[#1a1a1a] outline-none transition-all appearance-none text-[13px] font-medium"
                  >
                    <option value="">-- Chọn vai trò --</option>
                    {availableRoles.length > 0 ? (
                      availableRoles.map((r) => (
                        <option key={r._id} value={r.name}>
                          {r.name.charAt(0).toUpperCase() + r.name.slice(1).replace("-", " ")}
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="staff">Staff</option>
                        <option value="online-customer">Online Customer</option>
                      </>
                    )}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-[#999]">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-8">
          <div className="bg-white border border-[#eaeaea] p-8 md:p-12 h-full">
            <h3 className="text-2xl font-bold text-[#1a1a1a] mb-2" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Thông Tin Cá Nhân</h3>
            <p className="text-[13px] text-[#999] mb-10 pb-6 border-b border-[#eaeaea]">Cập nhật thông tin định danh của người dùng này.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-8">
              <div className="md:col-span-2">
                <label className="block text-[10px] font-semibold text-[#555] uppercase tracking-[0.1em] mb-2">Họ và Tên <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="fullName"
                  value={form.fullName}
                  onChange={handleChange}
                  placeholder="Nhập họ và tên đầy đủ"
                  className="w-full px-4 py-3 border border-[#eaeaea] bg-[#faf9f7] text-[#1a1a1a] focus:bg-white focus:border-[#1a1a1a] outline-none transition-all text-[14px]"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-[#555] uppercase tracking-[0.1em] mb-2">Địa chỉ Email <span className="text-red-500">*</span></label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="name@example.com"
                  className="w-full px-4 py-3 border border-[#eaeaea] bg-[#faf9f7] text-[#1a1a1a] focus:bg-white focus:border-[#1a1a1a] outline-none transition-all text-[14px]"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-[#555] uppercase tracking-[0.1em] mb-2">Mật khẩu (Khởi tạo) <span className="text-red-500">*</span></label>
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Tối thiểu 6 ký tự"
                  className="w-full px-4 py-3 border border-[#eaeaea] bg-[#faf9f7] text-[#1a1a1a] focus:bg-white focus:border-[#1a1a1a] outline-none transition-all text-[14px]"
                  required
                  minLength={6}
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-[#555] uppercase tracking-[0.1em] mb-2">Số Điện Thoại</label>
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="Nhập số điện thoại"
                  className="w-full px-4 py-3 border border-[#eaeaea] bg-[#faf9f7] text-[#1a1a1a] focus:bg-white focus:border-[#1a1a1a] outline-none transition-all text-[14px]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-[#555] uppercase tracking-[0.1em] mb-2">Giới Tính</label>
                <div className="relative">
                  <select
                    name="gender"
                    value={form.gender}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-[#eaeaea] bg-[#faf9f7] text-[#1a1a1a] focus:bg-white focus:border-[#1a1a1a] outline-none transition-all appearance-none text-[14px]"
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
                <label className="block text-[10px] font-semibold text-[#555] uppercase tracking-[0.1em] mb-2">Ngày Sinh</label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={form.dateOfBirth}
                  onChange={handleChange}
                  max={new Date().toISOString().split("T")[0]}
                  className="w-full px-4 py-3 border border-[#eaeaea] bg-[#faf9f7] text-[#1a1a1a] focus:bg-white focus:border-[#1a1a1a] outline-none transition-all text-[14px]"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
