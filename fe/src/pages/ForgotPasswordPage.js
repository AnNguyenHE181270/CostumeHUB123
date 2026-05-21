import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight } from "@fortawesome/free-solid-svg-icons";
import Input from "../components/ui/Input";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../routes/routePaths";
import Button from "../components/ui/Button";
import ErrorMessage from "../components/ui/ErrorMessage";
import AuthLayout from "../layouts/AuthLayout";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { value } = e.target;
    setEmail(value);
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
        },
      );
      const data = await response.json();
      if (!response.ok) {
        setError(data.errors?.[0]?.msg || data.message || "Register failed.");
        return;
      }
      setTitle(`Please check your email: ${email}`);
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
          <span className="text-midnight-ink text-[11px] font-medium tracking-[0.35em] uppercase">
            CostumeHUB
          </span>
        </div>

        <div className="mb-10">
          <p className="text-warning-orange text-[10px] uppercase tracking-[0.3em] font-medium mb-3">
            Recover Account
          </p>
          <h2
            className="text-abyssal-black font-medium"
            style={{
              fontSize: "43px",
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
            }}
          >
            Forgot Password
          </h2>
          <p className="mt-4 text-midnight-ink/60 text-[14px] leading-[1.6]">
            Enter your registered email. We will send password reset
            instructions to that email.
          </p>
        </div>

        {title ? (
          <p>{title}</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Email"
              name="email"
              type="email"
              value={email}
              onChange={handleChange}
              placeholder="name@example.com"
              required
            />

            {error && <ErrorMessage message={error} />}

            <Button
              type="submit"
              icon={faArrowRight}
              label="Send Request"
              loading={loading}
              className="bg-action-blue text-canvas-white hover:bg-blue-700 rounded-buttons"
            />

            <p className="text-center text-[14px] text-midnight-ink/60">
              Remembered your password?{" "}
              <button
                type="button"
                onClick={() => navigate(ROUTES.LOGIN)}
                className="text-action-blue font-medium hover:underline"
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
