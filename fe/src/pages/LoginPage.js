import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash, faArrowRight, faCheck } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import ErrorMessage from "../components/ui/ErrorMessage";
import AuthLayout from "../layouts/AuthLayout";
import { ROUTES } from "../routes/routePaths";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(false);
  const navigate = useNavigate();
  const { login, role } = useAuth();

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

      const response = await fetch(
        "http://localhost:9999/api/users/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(form),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        if (data.isPending) {
          navigate(`/verify-otp/${encodeURIComponent(data.email)}`, { state: { fromRegister: true } });
          return;
        }

        setError(
          data.errors?.[0]?.msg ||
          data.message ||
          "Login failed."
        );
        return;
      }

      const profile = await login(
        data.token,
        remember
      );
      const role = profile?.user?.role 

      if (role == "owner") {
        navigate("/owner");
      } else if (
        role=="staff"
      ) {
        navigate("/staff");
      } else {
        navigate("/");
      }
    } catch (error) {
      setError(
        "Network error. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="w-full max-w-[420px]">
        <div className="lg:hidden mb-10">
          <span className="text-text-primary text-[11px] font-medium tracking-[0.35em] uppercase">
            Luxe Rent
          </span>
        </div>

        <div className="mb-10">
          <p className="text-[#1a1a1a] text-[10px] uppercase tracking-[0.3em] font-medium mb-3">
            Welcome Back
          </p>
          <h2 className="text-text-primary text-4xl font-semibold tracking-tight">
            Sign In
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Email Address"
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
            placeholder="Enter your password"
            required
            rightIcon={
              <FontAwesomeIcon icon={showPw ? faEyeSlash : faEye} size="sm" />
            }
            onRightIconClick={() => setShowPw(!showPw)}
          />

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-3">
              <button
                type="button"
                role="checkbox"
                aria-checked={remember}
                onClick={() => setRemember((prev) => !prev)}
                className={`flex-shrink-0 w-5 h-5 rounded border flex items-center justify-center transition-all duration-200 ${remember
                    ? "bg-primary-600 border-primary-600"
                    : "bg-surface border-borderorder hover:border-primary-500"
                  }`}
              >
                {remember && (
                  <FontAwesomeIcon icon={faCheck} className="text-white text-[10px]" />
                )}
              </button>
              <span
                className="text-sm text-text-secondary cursor-pointer hover:text-text-primary transition-colors"
                onClick={() => setRemember((prev) => !prev)}
              >
                Remember me
              </span>
            </div>

            <a
              href="/forgot-password"
              className="text-[#1a1a1a] text-sm font-medium hover:text-[#1a1a1a] transition-colors"
            >
              Forgot Password?
            </a>
          </div>

          {error && <ErrorMessage message={error} />}

          <div className="pt-2 mb-6">
            <Button
              type="submit"
              variant="primary"
              icon={faArrowRight}
              label="Sign In"
              loading={loading}
            />
          </div>

          <p className="text-center text-sm text-text-secondary mt-8">
            Don't have an account?{" "}
            <button
              type="button"
              onClick={() => navigate(ROUTES.REGISTER)}
              className="text-[#1a1a1a] font-medium hover:text-[#1a1a1a] transition-colors"
            >
              Create an account
            </button>
          </p>
        </form>
      </div>
    </AuthLayout>
  );
}