import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash, faArrowRight } from "@fortawesome/free-solid-svg-icons";
import Input from "../components/ui/Input";
import { useNavigate, useParams } from "react-router-dom";
import { ROUTES } from "../routes/routePaths";
import Button from "../components/ui/Button";
import ErrorMessage from "../components/ui/ErrorMessage";
import AuthLayout from "../layouts/AuthLayout";

export default function ResetPasswordPage() {
  const [form, setForm] = useState({ password: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const { token } = useParams();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    try {
      setError("");
      if (loading) return;
      const response = await fetch(
        `http://localhost:9999/api/users/reset-password/${token}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        }
      );
      const data = await response.json();
      if (!response.ok) {
        setError(data.errors?.[0]?.msg || data.message || "Register failed.");
        return;
      }
      navigate(`/login`);
    } catch (error) {
      setError("Network error. Please try again.");
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
          <p className="text-primary-600 text-[10px] uppercase tracking-[0.3em] font-medium mb-3">
            Account Security
          </p>
          <h2 className="text-text-primary text-4xl font-semibold tracking-tight">
            Reset Password
          </h2>
          <p className="mt-4 text-text-secondary text-sm leading-relaxed">
            Please enter a new password for your account. This link is only
            valid for 15 minutes.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="New Password"
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
            label="Confirm New Password"
            name="confirmPassword"
            type={showConfirmPw ? "text" : "password"}
            value={form.confirmPassword}
            onChange={handleChange}
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

          {error && <ErrorMessage message={error} />}

          <div className="pt-2 mb-6">
            <Button
              type="submit"
              variant="primary"
              icon={faArrowRight}
              label="Update Password"
              loading={loading}
            />
          </div>

          <p className="text-center text-sm text-text-secondary">
            Remembered your password?{" "}
            <button
              type="button"
              onClick={() => navigate(ROUTES.LOGIN)}
              className="text-primary-600 font-medium hover:text-primary-700 transition-colors"
            >
              Back to Login
            </button>
          </p>
        </form>
      </div>
    </AuthLayout>
  );
}