import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash, faArrowRight, faCheck } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import ErrorMessage from "../components/ui/ErrorMessage";
import AuthLayout from "../layouts/AuthLayout";
import { ROUTES } from "../routes/routePaths";
import userService from "../services/user.service";

export default function RegisterPage() {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    gender: "",
    dateOfBirth: "",
    acceptTerms: false,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [matchPassword, setMatchPassword] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    if (!form.acceptTerms) {
      setError("Bạn phải đồng ý với các điều khoản để tiếp tục.");
      return;
    }
    if (!form.phone.trim()) {
      setError("Vui lòng nhập số điện thoại.");
      return;
    }
    if (!form.gender) {
      setError("Vui lòng chọn giới tính.");
      return;
    }
    if (!form.dateOfBirth) {
      setError("Vui lòng chọn ngày sinh.");
      return;
    }
    const today = new Date().toISOString().split('T')[0];
    if (form.dateOfBirth > today) {
      setError("Ngày sinh không được ở trong tương lai.");
      return;
    }
    if (form.password !== matchPassword) {
      setError("Mật khẩu không khớp.");
      return;
    }
    setLoading(true);
    try {
      setError("");
      await userService.register(form);
      navigate(`/verify-otp/${encodeURIComponent(form.email)}`, { state: { fromRegister: true } });
    } catch (err) {
      setError(err.message || "Đăng ký thất bại.");
    } finally {
      setLoading(false);
    }
  };

  const inputBase = "w-full bg-surface border border-borderorder rounded-xl px-4 py-3 text-sm text-text-primary outline-none transition-all duration-200 focus:border-primary-500 focus:bg-background focus:ring-1 focus:ring-[#1a1a1a] placeholder:text-text-muted";

  return (
    <AuthLayout>
      <div className="w-full max-w-[460px]">
        <div className="lg:hidden mb-10">
          <span className="text-text-primary text-[11px] font-medium tracking-[0.35em] uppercase">
            Luxe Rent
          </span>
        </div>

        <div className="mb-10">
          <p className="text-[#1a1a1a] text-[10px] uppercase tracking-[0.3em] font-medium mb-3">
            Bắt đầu hành trình
          </p>
          <h2 className="text-text-primary text-4xl font-semibold tracking-tight">
            Đăng Ký Tài Khoản
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Input
              label="Họ và Tên"
              name="fullName"
              type="text"
              value={form.fullName}
              onChange={handleChange}
              placeholder="Nguyễn Văn A"
              required
            />
            <Input
              label="Số điện thoại"
              name="phone"
              type="tel"
              value={form.phone}
              onChange={handleChange}
              placeholder="VD: 0912345678"
              required
            />
          </div>

          <Input
            label="Email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="name@example.com"
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Input label="Giới tính">
              <select
                name="gender"
                value={form.gender}
                onChange={handleChange}
                className={`${inputBase} cursor-pointer`}
                required
              >
                <option value="">Chọn giới tính</option>
                <option value="female">Nữ</option>
                <option value="male">Nam</option>
                <option value="other">Khác</option>
              </select>
            </Input>
            <Input label="Ngày sinh">
              <input
                type="date"
                name="dateOfBirth"
                value={form.dateOfBirth}
                onChange={handleChange}
                className={inputBase}
                max={new Date().toISOString().split("T")[0]}
                required
              />
            </Input>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Input
              label="Mật khẩu"
              name="password"
              type={showPw ? "text" : "password"}
              value={form.password}
              onChange={handleChange}
              placeholder="Từ 6 ký tự trở lên"
              required
              rightIcon={
                <FontAwesomeIcon icon={showPw ? faEyeSlash : faEye} size="sm" />
              }
              onRightIconClick={() => setShowPw(!showPw)}
            />
            <Input
              label="Xác nhận mật khẩu"
              name="confirmPassword"
              type={showConfirmPw ? "text" : "password"}
              value={matchPassword}
              onChange={(e) => setMatchPassword(e.target.value)}
              placeholder="Xác nhận mật khẩu"
              required
              rightIcon={
                <FontAwesomeIcon
                  icon={showConfirmPw ? faEyeSlash : faEye}
                  size="sm"
                />
              }
              onRightIconClick={() => setShowConfirmPw(!showConfirmPw)}
            />
          </div>

          <div className="flex items-start gap-3 pt-1">
            <button
              type="button"
              role="checkbox"
              aria-checked={form.acceptTerms}
              onClick={() =>
                handleChange({
                  target: {
                    name: "acceptTerms",
                    type: "checkbox",
                    checked: !form.acceptTerms,
                  },
                })
              }
              className={`flex-shrink-0 w-5 h-5 mt-0.5 rounded border flex items-center justify-center transition-all duration-200 ${form.acceptTerms
                  ? "bg-primary-600 border-primary-600"
                  : "bg-surface border-borderorder hover:border-primary-500"
                }`}
            >
              {form.acceptTerms && (
                <FontAwesomeIcon
                  icon={faCheck}
                  className="text-white text-[10px]"
                />
              )}
            </button>
            <span className="text-sm text-text-secondary leading-[1.5]">
              Tôi đồng ý với{" "}
              <button
                type="button"
                className="text-text-primary font-medium hover:text-[#1a1a1a] transition-colors"
              >
                Điều khoản Dịch vụ
              </button>{" "}
              và{" "}
              <button
                type="button"
                className="text-text-primary font-medium hover:text-[#1a1a1a] transition-colors"
              >
                Chính sách Bảo mật
              </button>
            </span>
          </div>

          {error && <ErrorMessage message={error} />}

          <div className="pt-2 mb-6">
            <Button
              type="submit"
              variant="primary"
              icon={faArrowRight}
              label="Đăng Ký"
              loading={loading}
            />
          </div>

          <p className="text-center text-sm text-text-secondary">
            Đã có tài khoản?{" "}
            <button
              type="button"
              onClick={() => navigate(ROUTES.LOGIN)}
              className="text-[#1a1a1a] font-medium hover:text-[#1a1a1a] transition-colors"
            >
              Đăng nhập
            </button>
          </p>
        </form>
      </div>
    </AuthLayout>
  );
}