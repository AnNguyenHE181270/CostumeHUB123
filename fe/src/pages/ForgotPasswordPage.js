import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import ErrorMessage from "../components/ui/ErrorMessage";
import AuthLayout from "../layouts/AuthLayout";
import { ROUTES } from "../routes/routePaths";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setEmail(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      setError("");
      const response = await fetch(
        "http://localhost:9999/api/users/forgot-password",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        }
      );
      const data = await response.json();
      if (!response.ok) {
        setError(data.errors?.[0]?.msg || data.message || "Failed to process request.");
        return;
      }
      setSuccessMessage(`We've sent a password reset link to ${email}`);
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

        <div className="mb-8">
          <p className="text-[#1a1a1a] text-[10px] uppercase tracking-[0.3em] font-medium mb-3">
            Recover Account
          </p>
          <h2 className="text-text-primary text-4xl font-semibold tracking-tight">
            Forgot Password
          </h2>
          <p className="text-text-secondary text-sm mt-3 leading-relaxed">
            Enter your registered email address. We will send you instructions to reset your password.
          </p>
        </div>

        {successMessage ? (
          <div className="space-y-6">
            <div className="bg-success-50 border border-success-100 text-success-600 p-4 rounded-xl text-sm leading-relaxed">
              {successMessage}
            </div>
            <Button
              type="button"
              variant="outline"
              label="Back to Login"
              onClick={() => navigate(ROUTES.LOGIN)}
            />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Email Address"
              name="email"
              type="email"
              value={email}
              onChange={handleChange}
              placeholder="name@example.com"
              required
            />

            {error && <ErrorMessage message={error} />}

            <div className="pt-2 mb-6">
              <Button
                type="submit"
                variant="primary"
                icon={faArrowRight}
                label="Send Reset Link"
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
        )}
      </div>
    </AuthLayout>
  );
}