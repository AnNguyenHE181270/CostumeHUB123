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
import AuthLayout from "../layouts/AuthLayout";
import { useGoogleLogin } from "@react-oauth/google";

export default function RegisterPage() {
  const [form, setForm] = useState({
    fullName: "", email: "", phone: "", password: "", gender: "", dateOfBirth: "", acceptTerms: false,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [matchPassword, setMatchPassword] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    if (!form.acceptTerms) { setError("Bạn cần đồng ý điều khoản để tiếp tục."); return; }
    if (form.password !== matchPassword) { setError("Mật khẩu không khớp"); return; }
    setLoading(true);
    try {
      setError("");
      const response = await fetch("http://localhost:9999/api/users/register", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok) { setError(data.errors?.[0]?.msg || data.message || "Register failed."); return; }
      navigate(`/verify-otp/${encodeURIComponent(form.email)}`);
    } catch (error) { setError("Network error. Please try again."); } finally { setLoading(false); }
  };

const loginGoogle = useGoogleLogin({
  onSuccess: async (tokenResponse) => {
    try {
      const response = await fetch(
        "http://localhost:9999/api/users/google-login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            accessToken: tokenResponse.access_token,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Google login failed");
        return;
      }

      if (data.needsMoreInfo) {
        navigate(`/complete-with-google/${encodeURIComponent(data.user.email)}`, {
          state: {
            token: data.token,
            user: data.user,
          },
        });
      } else {
        navigate("/"); 
      }

    } catch (error) {
      setError("Google login failed.");
    }
  },

  onError: () => {
    setError("Google login failed.");
  },
});
  const inputBase = "w-full bg-ghost-fog border border-sterling-gray rounded-cards px-4 py-3 text-[14px] text-midnight-ink outline-none transition-all duration-200 focus:border-midnight-ink focus:bg-canvas-white placeholder:text-midnight-ink/40";

  return (
    <AuthLayout>
      <div className="w-full max-w-[420px]">
        <div className="lg:hidden mb-10">
          <span className="text-midnight-ink text-[11px] font-medium tracking-[0.35em] uppercase">Vogue Rental</span>
        </div>
        <div className="mb-10">
          <p className="text-warning-orange text-[10px] uppercase tracking-[0.3em] font-medium mb-3">Bắt đầu hành trình</p>
          <h2 className="text-abyssal-black font-medium" style={{ fontSize: "43px", lineHeight: 1.05, letterSpacing: "-0.02em" }}>Tạo tài khoản</h2>
        </div>

        <Button icon={faGoogle} label="Tiếp tục với Google" className="bg-canvas-white text-abyssal-black border border-abyssal-black hover:bg-ghost-fog rounded-buttons" onClick={() => loginGoogle()} />

        <div className="my-8 flex items-center gap-4">
          <div className="h-px flex-1 bg-sterling-gray" />
          <span className="text-[10px] uppercase tracking-[0.2em] text-midnight-ink/50">hoặc</span>
          <div className="h-px flex-1 bg-sterling-gray" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Input label="Họ và tên" required><input type="text" name="fullName" value={form.fullName} onChange={handleChange} required className={inputBase} placeholder="Nguyễn Văn A" /></Input>
            <Input label="Số điện thoại"><input type="tel" name="phone" value={form.phone} onChange={handleChange} className={inputBase} placeholder="0912 345 678" /></Input>
          </div>
          <Input label="Email" required><input type="email" name="email" value={form.email} onChange={handleChange} required className={inputBase} placeholder="name@example.com" /></Input>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Input label="Giới tính"><select name="gender" value={form.gender} onChange={handleChange} className={`${inputBase} cursor-pointer`}><option value="">Chọn giới tính</option><option value="female">Nữ</option><option value="male">Nam</option><option value="other">Khác</option></select></Input>
            <Input label="Ngày sinh"><input type="date" name="dateOfBirth" value={form.dateOfBirth} onChange={handleChange} className={inputBase} /></Input>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Input label="Mật khẩu" required><div className="relative"><input type={showPw ? "text" : "password"} name="password" value={form.password} onChange={handleChange} required className={`${inputBase} pr-10`} placeholder="8+ ký tự" /><button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-midnight-ink/40 hover:text-midnight-ink transition-colors"><FontAwesomeIcon icon={showPw ? faEyeSlash : faEye} size="sm" /></button></div></Input>
            <Input label="Nhập lại mật khẩu" required><div className="relative"><input type={showConfirmPw ? "text" : "password"} name="confirmPassword" value={matchPassword} onChange={(e) => setMatchPassword(e.target.value)} required className={`${inputBase} pr-10`} placeholder="Nhập lại mật khẩu" /><button type="button" onClick={() => setShowConfirmPw(!showConfirmPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-midnight-ink/40 hover:text-midnight-ink transition-colors"><FontAwesomeIcon icon={showConfirmPw ? faEyeSlash : faEye} size="sm" /></button></div></Input>
          </div>
          
          <div className="flex items-start gap-3 pt-1">
            <button type="button" role="checkbox" aria-checked={form.acceptTerms} onClick={() => handleChange({ target: { name: "acceptTerms", type: "checkbox", checked: !form.acceptTerms } })} className={`mt-0.5 flex-shrink-0 w-[18px] h-[18px] rounded-navigation border flex items-center justify-center transition-all duration-200 ${form.acceptTerms ? "bg-abyssal-black border-abyssal-black" : "bg-canvas-white border-sterling-gray hover:border-midnight-ink"}`}>
              {form.acceptTerms && <FontAwesomeIcon icon={faCheck} className="text-canvas-white text-[9px]" />}
            </button>
            <span className="text-[13px] text-midnight-ink/60 leading-[1.5]">Tôi đồng ý với <button type="button" className="text-midnight-ink underline underline-offset-2 decoration-sterling-gray hover:decoration-midnight-ink transition-colors">Điều khoản dịch vụ</button> và <button type="button" className="text-midnight-ink underline underline-offset-2 decoration-sterling-gray hover:decoration-midnight-ink transition-colors">Chính sách bảo mật</button></span>
          </div>

          {error && <ErrorMessage message={error} />}
          <Button type="submit" icon={faArrowRight} label="Tạo tài khoản" loading={loading} className="bg-action-blue text-canvas-white hover:bg-blue-700 rounded-buttons" />
          <p className="text-center text-[14px] text-midnight-ink/60">Đã có tài khoản? <button type="button" onClick={() => navigate(ROUTES.LOGIN)} className="text-action-blue font-medium hover:underline">Đăng nhập</button></p>
        </form>
      </div>
    </AuthLayout>
  );
}