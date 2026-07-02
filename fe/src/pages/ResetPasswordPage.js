import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash, faArrowRight } from "@fortawesome/free-solid-svg-icons";
import Input from "../components/ui/Input";
import { useNavigate, useParams } from "react-router-dom";
import { ROUTES } from "../routes/routePaths";
import userService from "../services/user.service";
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
      await userService.resetPassword(token, form.password);
      navigate(`/login`);
    } catch (err) {
      setError(err.message || "Reset failed.");
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
            placeholder="6+ characters"
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
              className="text-[#1a1a1a] font-medium hover:text-[#1a1a1a] transition-colors"
            >
              Back to Login
            </button>
          </p>
        </form>
      </div>
    </AuthLayout>
  );
}