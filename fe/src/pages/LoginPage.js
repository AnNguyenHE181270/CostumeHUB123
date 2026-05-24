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
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  // ==========================================
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(false);
  const navigate = useNavigate();
  const { login, isProfileComplete } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      setError("");
      const response = await fetch("http://localhost:9999/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.errors?.[0]?.msg || data.message || "Login failed.");
        return;
      }
      await login(data.token, remember);

      navigate(`/`);
    } catch (error) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const inputBase =
    "w-full bg-ghost-fog border border-sterling-gray rounded-cards px-4 py-3 text-[14px] text-midnight-ink outline-none transition-all duration-200 focus:border-midnight-ink focus:bg-canvas-white placeholder:text-midnight-ink/40";

  return (
    <AuthLayout>
      <div className="w-full max-w-[420px]">
        <div className="lg:hidden mb-10">
          <span className="text-midnight-ink text-[11px] font-medium tracking-[0.35em] uppercase">
            CostumeHUB
          </span>
        </div>

        <div className="mb-10">
          <p className="text-warning-orange text-[10px] uppercase tracking-[0.3em] font-medium mb-3">
            Welcome Back
          </p>
          <h2
            className="text-abyssal-black font-medium"
            style={{
              fontSize: "43px",
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
            }}
          >
            Login
          </h2>
        </div>

        <div className="my-8 flex items-center gap-4">
          <div className="h-px flex-1 bg-sterling-gray" />
          <span className="text-[10px] uppercase tracking-[0.2em] text-midnight-ink/50">
            or
          </span>
          <div className="h-px flex-1 bg-sterling-gray" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="name@example.com"
            required
          />

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

          <div className="text-right">
            <a
              href="/forgot-password"
              className="text-action-blue text-[13px] font-medium hover:underline underline-offset-2"
            >
              Forgot Password?
            </a>
          </div>
          <div className="flex items-start gap-3 pt-1">
            <button
              type="button"
              role="checkbox"
              aria-checked={remember}
              onClick={() => setRemember((prev) => !prev)}
              className={`mt-0.5 flex-shrink-0 w-[18px] h-[18px] rounded-navigation border flex items-center justify-center transition-all duration-200 ${remember
                ? "bg-abyssal-black border-abyssal-black"
                : "bg-canvas-white border-sterling-gray hover:border-midnight-ink"
                }`}
            >
              {remember && (
                <FontAwesomeIcon
                  icon={faCheck}
                  className="text-canvas-white text-[9px]"
                />
              )}
            </button>

            <span className="text-[13px] text-midnight-ink/60 leading-[1.5]">
              Remember me
            </span>
          </div>

          {error && <ErrorMessage message={error} />}

          <Button
            type="submit"
            icon={faArrowRight}
            label="Login"
            loading={loading}
            className="bg-action-blue text-canvas-white hover:bg-blue-700 rounded-buttons"
          />

          <p className="text-center text-[14px] text-midnight-ink/60">
            Don't have an account?{" "}
            <button
              type="button"
              onClick={() => navigate(ROUTES.REGISTER)}
              className="text-action-blue font-medium hover:underline"
            >
              Register
            </button>
          </p>
        </form>
      </div>
    </AuthLayout>
  );
}
