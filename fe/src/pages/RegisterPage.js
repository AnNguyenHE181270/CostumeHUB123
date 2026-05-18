import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEye,
  faEyeSlash,
  faArrowRight,
  faCheck,
} from "@fortawesome/free-solid-svg-icons";
import { faGoogle } from "@fortawesome/free-brands-svg-icons";
import Input from "../components/ui/Input";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../routes/routePaths";
import Button from "../components/ui/Button";
import ErrorMessage from "../components/ui/ErrorMessage";
import AuthLayout from "../layouts/AuthLayout"; // <-- Import layout vừa tạo
import { useGoogleLogin } from "@react-oauth/google";
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
      setError("Bạn cần đồng ý điều khoản để tiếp tục.");
      return;
    }
    if (form.password !== matchPassword) {
      setError("Mật khẩu không khớp");
      return;
    }
    setLoading(true);
    try {
      setError("");

      const response = await fetch("http://localhost:9999/api/users/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.errors?.[0]?.msg || data.message || "Register failed.");
        return;
      }
      navigate(`/verify-otp/${encodeURIComponent(form.email)}`);
    } catch (error) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const loginGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const response = await fetch(
          "http://localhost:9999/api/users/google-login",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              accessToken: tokenResponse.access_token,
            }),
          },
        );

        const data = await response.json();

        if (!response.ok) {
          setError(data.message || "Google login failed");
          return;
        }

        console.log(data);

        localStorage.setItem("token", data.token);

        localStorage.setItem("user", JSON.stringify(data.user));

        navigate(ROUTES.HOME);
      } catch (error) {
        setError("Google login failed.");
      }
    },

    onError: () => {
      setError("Google login failed.");
    },
  });

  const inputBase =
    "w-full bg-canvas-fog border border-stone-whisper rounded-f-card-sm px-4 py-3 text-[14px] text-ash-grey outline-none transition-all duration-200 focus:border-midnight-coal focus:bg-cloud-white placeholder:text-muted-slate/40";

  return (
    <AuthLayout>
      <div className="w-full max-w-[420px]">
        {/* Mobile logo */}
        <div className="lg:hidden mb-10">
          <span className="text-midnight-coal text-[11px] font-medium tracking-[0.35em] uppercase">
            Vogue Rental
          </span>
        </div>

        {/* Header */}
        <div className="mb-10">
          <p className="text-sunset-orange text-[10px] uppercase tracking-[0.3em] font-medium mb-3">
            Bắt đầu hành trình
          </p>
          <h2
            className="text-midnight-coal font-medium"
            style={{
              fontSize: "43px",
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
            }}
          >
            Tạo tài khoản
          </h2>
        </div>

        {/* Google */}
        <Button
          icon={faGoogle}
          label="Tiếp tục với Google"
          className="bg-white text-midnight-coal border border-stone-whisper hover:border-midnight-coal"
          onClick={() =>
            loginGoogle()
          }
        />

        {/* Divider */}
        <div className="my-8 flex items-center gap-4">
          <div className="h-px flex-1 bg-stone-whisper" />
          <span className="text-[10px] uppercase tracking-[0.2em] text-muted-slate">
            hoặc
          </span>
          <div className="h-px flex-1 bg-stone-whisper" />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Họ tên + SĐT */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Input label="Họ và tên" required>
              <input
                type="text"
                name="fullName"
                value={form.fullName}
                onChange={handleChange}
                required
                className={inputBase}
                placeholder="Nguyễn Văn A"
              />
            </Input>
            <Input label="Số điện thoại">
              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                className={inputBase}
                placeholder="0912 345 678"
              />
            </Input>
          </div>

          {/* Email */}
          <Input label="Email" required>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              className={inputBase}
              placeholder="name@example.com"
            />
          </Input>

          {/* Giới tính + Ngày sinh */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Input label="Giới tính">
              <select
                name="gender"
                value={form.gender}
                onChange={handleChange}
                className={`${inputBase} cursor-pointer`}
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
              />
            </Input>
          </div>

          {/* Mật khẩu + Xác nhận */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Input label="Mật khẩu" required>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  className={`${inputBase} pr-10`}
                  placeholder="8+ ký tự"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-slate hover:text-midnight-coal transition-colors"
                >
                  <FontAwesomeIcon
                    icon={showPw ? faEyeSlash : faEye}
                    size="sm"
                  />
                </button>
              </div>
            </Input>
            <Input label="Nhập lại mật khẩu" required>
              <div className="relative">
                <input
                  type={showConfirmPw ? "text" : "password"}
                  name="confirmPassword"
                  value={matchPassword}
                  onChange={(e) => setMatchPassword(e.target.value)}
                  required
                  className={`${inputBase} pr-10`}
                  placeholder="Nhập lại mật khẩu"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPw(!showConfirmPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-slate hover:text-midnight-coal transition-colors"
                >
                  <FontAwesomeIcon
                    icon={showConfirmPw ? faEyeSlash : faEye}
                    size="sm"
                  />
                </button>
              </div>
            </Input>
          </div>

          {/* Điều khoản */}
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
              className={`mt-0.5 flex-shrink-0 w-[18px] h-[18px] rounded-[3px] border flex items-center justify-center transition-all duration-200 ${form.acceptTerms
                ? "bg-midnight-coal border-midnight-coal"
                : "bg-cloud-white border-stone-whisper hover:border-muted-slate"
                }`}
            >
              {form.acceptTerms && (
                <FontAwesomeIcon
                  icon={faCheck}
                  className="text-cloud-white text-[9px]"
                />
              )}
            </button>
            <span className="text-[13px] text-muted-slate leading-[1.5]">
              Tôi đồng ý với{" "}
              <button
                type="button"
                className="text-midnight-coal underline underline-offset-2 decoration-stone-whisper hover:decoration-midnight-coal transition-colors"
              >
                Điều khoản dịch vụ
              </button>{" "}
              và{" "}
              <button
                type="button"
                className="text-midnight-coal underline underline-offset-2 decoration-stone-whisper hover:decoration-midnight-coal transition-colors"
              >
                Chính sách bảo mật
              </button>
            </span>
          </div>

          {/* Error Message */}
          {error && <ErrorMessage message={error} />}

          {/* Submit — Sunset gradient CTA */}
          <Button
            type="submit"
            icon={faArrowRight}
            label="Tạo tài khoản"
            loading={loading}
            className="bg-sunset-orange text-white hover:brightness-110 shadow-[0_4px_16px_rgba(249,74,0,0.3)]"
          />

          {/* Login link */}
          <p className="text-center text-[14px] text-muted-slate">
            Đã có tài khoản?{" "}
            <button
              type="button"
              onClick={() => navigate(ROUTES.LOGIN)} // Điều hướng sang trang Login
              className="text-midnight-coal font-medium hover:text-sunset-orange transition-colors"
            >
              Đăng nhập
            </button>
          </p>
        </form>
      </div>
    </AuthLayout>
  );
}
