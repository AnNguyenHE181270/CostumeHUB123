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
      setError("You must agree to the terms to continue.");
      return;
    }
    if (form.password !== matchPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      setError("");
      const response = await fetch("http://localhost:9999/api/users/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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

  // ========= SỬA HÀM GOOGLE LOGIN =========
  const loginGoogle = useGoogleLogin({
    flow: "auth-code", // Khai báo dùng authorization code
    onSuccess: async (tokenResponse) => {
      try {
        const response = await fetch(
          "http://localhost:9999/api/users/google-login",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            // BẮT BUỘC gửi 'code', không phải 'accessToken' khi dùng flow: 'auth-code'
            body: JSON.stringify({ code: tokenResponse.code }),
          },
        );

        const data = await response.json();

        if (!response.ok) {
          setError(data.message || "Google login failed");
          return;
        }

        // Lưu token vào localStorage để duy trì đăng nhập
        localStorage.setItem("token", data.token);

        if (data.needsMoreInfo) {
          navigate(
            `/complete-with-google/${encodeURIComponent(data.user.email)}`,
            {
              state: { token: data.token, user: data.user },
            },
          );
        } else {
          navigate("/");
          localStorage.setItem("token", data.token);
        }
      } catch (error) {
        setError("Google login failed.");
      }
    },
    onError: () => {
      setError("Google login failed.");
    },
  });

  // Style dùng cho thẻ Select và Date (vì nó dùng children)
  const inputBase =
    "w-full bg-ghost-fog border border-sterling-gray rounded-cards px-4 py-3 text-[14px] text-midnight-ink outline-none transition-all duration-200 focus:border-midnight-ink focus:bg-canvas-white placeholder:text-midnight-ink/40";

  return (
    <AuthLayout>
      <div className="w-full max-w-[420px]">
        <div className="lg:hidden mb-10">
          <span className="text-midnight-ink text-[11px] font-medium tracking-[0.35em] uppercase">
            Vogue Rental
          </span>
        </div>
        <div className="mb-10">
          <p className="text-warning-orange text-[10px] uppercase tracking-[0.3em] font-medium mb-3">
            Start the Journey
          </p>
          <h2
            className="text-abyssal-black font-medium"
            style={{
              fontSize: "43px",
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
            }}
          >
            Create Account
          </h2>
        </div>

        <Button
          icon={faGoogle}
          label="Continue with Google"
          className="bg-canvas-white text-abyssal-black border border-abyssal-black hover:bg-ghost-fog rounded-buttons"
          onClick={() => loginGoogle()}
        />

        <div className="my-8 flex items-center gap-4">
          <div className="h-px flex-1 bg-sterling-gray" />
          <span className="text-[10px] uppercase tracking-[0.2em] text-midnight-ink/50">
            or
          </span>
          <div className="h-px flex-1 bg-sterling-gray" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* New usage for normal Input Text */}
            <Input
              label="Full Name"
              name="fullName"
              type="text"
              value={form.fullName}
              onChange={handleChange}
              placeholder="John Doe"
              required
            />
            <Input
              label="Phone Number"
              name="phone"
              type="tel"
              value={form.phone}
              onChange={handleChange}
              placeholder="e.g., +1 234 567 890"
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
            {/* Children for Select */}
            <Input label="Gender">
              <select
                name="gender"
                value={form.gender}
                onChange={handleChange}
                className={`${inputBase} cursor-pointer`}
              >
                <option value="">Select Gender</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="other">Other</option>
              </select>
            </Input>
            {/* Children for Date */}
            <Input label="Date of Birth">
              <input
                type="date"
                name="dateOfBirth"
                value={form.dateOfBirth}
                onChange={handleChange}
                className={inputBase}
              />
            </Input>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Dùng rightIcon cho Mật khẩu */}
            <Input
              label="Password"
              name="password"
              type={showPw ? "text" : "password"}
              value={form.password}
              onChange={handleChange}
              placeholder="8+ characters"
              required
              rightIcon={
                <FontAwesomeIcon icon={showPw ? faEyeSlash : faEye} size="sm" />
              }
              onRightIconClick={() => setShowPw(!showPw)}
            />
            <Input
              label="Confirm Password"
              name="confirmPassword"
              type={showConfirmPw ? "text" : "password"}
              value={matchPassword}
              onChange={(e) => setMatchPassword(e.target.value)}
              placeholder="Confirm Password"
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
              className={`mt-0.5 flex-shrink-0 w-[18px] h-[18px] rounded-navigation border flex items-center justify-center transition-all duration-200 ${form.acceptTerms ? "bg-abyssal-black border-abyssal-black" : "bg-canvas-white border-sterling-gray hover:border-midnight-ink"}`}
            >
              {form.acceptTerms && (
                <FontAwesomeIcon
                  icon={faCheck}
                  className="text-canvas-white text-[9px]"
                />
              )}
            </button>
            <span className="text-[13px] text-midnight-ink/60 leading-[1.5]">
              I agree to the{" "}
              <button
                type="button"
                className="text-midnight-ink underline underline-offset-2 decoration-sterling-gray hover:decoration-midnight-ink transition-colors"
              >
                Terms of Service
              </button>{" "}
              and{" "}
              <button
                type="button"
                className="text-midnight-ink underline underline-offset-2 decoration-sterling-gray hover:decoration-midnight-ink transition-colors"
              >
                Privacy Policy
              </button>
            </span>
          </div>

          {error && <ErrorMessage message={error} />}
          <Button
            type="submit"
            icon={faArrowRight}
            label="Create Account"
            loading={loading}
            className="bg-action-blue text-canvas-white hover:bg-blue-700 rounded-buttons"
          />
          <p className="text-center text-[14px] text-midnight-ink/60">
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => navigate(ROUTES.LOGIN)}
              className="text-action-blue font-medium hover:underline"
            >
              Login
            </button>
          </p>
        </form>
      </div>
    </AuthLayout>
  );
}
