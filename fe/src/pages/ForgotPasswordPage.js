import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import ErrorMessage from "../components/ui/ErrorMessage";
import AuthLayout from "../layouts/AuthLayout";
import { ROUTES } from "../routes/routePaths";
import userService from "../services/user.service";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [countdown, setCountdown] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const handleChange = (e) => {
    setEmail(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      setError("");
      await userService.forgotPassword(email);
      setSuccessMessage(`Chúng tôi đã gửi liên kết đặt lại mật khẩu đến ${email}`);
      setCountdown(60);
    } catch (err) {
      setError(err.message || "Yêu cầu thất bại.");
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
            Khôi phục tài khoản
          </p>
          <h2 className="text-text-primary text-4xl font-semibold tracking-tight">
            Quên mật khẩu
          </h2>
          <p className="text-text-secondary text-sm mt-3 leading-relaxed">
            Nhập địa chỉ email đã đăng ký của bạn. Chúng tôi sẽ gửi hướng dẫn để đặt lại mật khẩu.
          </p>
        </div>

        {successMessage ? (
          <div className="space-y-6">
            <div className="bg-success-50 border border-success-100 text-success-600 p-4 rounded-xl text-sm leading-relaxed">
              {successMessage}
            </div>

            {error && <ErrorMessage message={error} />}

            <div className="flex flex-col gap-3">
              <Button
                type="button"
                variant="primary"
                label={countdown > 0 ? `Gửi lại liên kết (${countdown}s)` : "Gửi lại liên kết"}
                onClick={handleSubmit}
                disabled={countdown > 0 || loading}
                loading={loading}
              />
              <Button
                type="button"
                variant="outline"
                label="Quay lại Đăng nhập"
                onClick={() => navigate(ROUTES.LOGIN)}
              />
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Địa chỉ Email"
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
                label="Gửi liên kết đặt lại"
                loading={loading}
              />
            </div>

            <p className="text-center text-sm text-text-secondary">
              Đã nhớ mật khẩu?{" "}
              <button
                type="button"
                onClick={() => navigate(ROUTES.LOGIN)}
                className="text-[#1a1a1a] font-medium hover:text-[#1a1a1a] transition-colors"
              >
                Quay lại Đăng nhập
              </button>
            </p>
          </form>
        )}
      </div>
    </AuthLayout>
  );
}