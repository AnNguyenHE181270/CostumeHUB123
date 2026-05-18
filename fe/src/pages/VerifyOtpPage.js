import { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight, faShieldHalved } from "@fortawesome/free-solid-svg-icons";
import { useNavigate, useParams } from "react-router-dom";
import Button from "../components/ui/Button";
import ErrorMessage from "../components/ui/ErrorMessage";
import AuthLayout from "../layouts/AuthLayout";
import { ROUTES } from "../routes/routePaths";

const OTP_LENGTH = 6;
const TIMER_SECONDS = 60;

export default function VerifyOtpPage() {
    const { email } = useParams();
    const navigate = useNavigate();

    const [otp, setOtp] = useState(new Array(OTP_LENGTH).fill(""));
    const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS);
    const [isResending, setIsResending] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const inputRefs = useRef([]);

    const decodedEmail = decodeURIComponent(email || "");

    // ===== Countdown Timer =====
    useEffect(() => {
        if (timeLeft <= 0) return;
        const timerId = setInterval(() => {
            setTimeLeft((prev) => prev - 1);
        }, 1000);
        return () => clearInterval(timerId);
    }, [timeLeft]);

    // ===== Focus first input on mount =====
    useEffect(() => {
        inputRefs.current[0]?.focus();
    }, []);

    // ===== Handle OTP Input (CHO PHÉP CẢ CHỮ VÀ SỐ) =====
    const handleChange = (e, index) => {
        const value = e.target.value;

        // Chỉ cho phép chữ cái (a-z, A-Z) và số (0-9), chặn ký tự đặc biệt/khoảng trắng
        if (!/^[a-zA-Z0-9]*$/.test(value)) return;

        const newOtp = [...otp];
        // Luôn lấy 1 ký tự cuối cùng và tự động CHUYỂN SANG IN HOA
        newOtp[index] = value.slice(-1).toUpperCase(); 
        setOtp(newOtp);
        setError("");

        // Nếu có nhập giá trị và chưa phải ô cuối, nhảy sang ô tiếp theo
        if (value !== "" && index < OTP_LENGTH - 1) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (e, index) => {
        // Nếu nhấn Backspace ở ô trống, xóa số ở ô trước đó và nhảy focus lùi lại
        if (e.key === "Backspace" && otp[index] === "" && index > 0) {
            const newOtp = [...otp];
            newOtp[index - 1] = "";
            setOtp(newOtp);
            inputRefs.current[index - 1]?.focus();
        }
    };

    // ===== Bôi đen chữ khi focus để gõ đè dễ hơn =====
    const handleFocus = (e) => {
        e.target.select();
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData("text").trim();

        // Chỉ cho phép dán nếu là chuỗi toàn chữ cái và số
        if (!/^[a-zA-Z0-9]+$/.test(pastedData)) return;

        const pastedArray = pastedData.slice(0, OTP_LENGTH).split("");
        const newOtp = [...otp];

        pastedArray.forEach((char, i) => {
            newOtp[i] = char.toUpperCase(); // Tự động in hoa khi dán
        });

        setOtp(newOtp);

        // Focus vào ô cuối cùng đã được điền
        const nextFocusIndex = Math.min(pastedArray.length, OTP_LENGTH - 1);
        inputRefs.current[nextFocusIndex]?.focus();
    };

    // ===== Handle Resend OTP =====
    const handleResendOtp = async () => {
        if (timeLeft > 0 || isResending) return;

        setIsResending(true);
        setError("");

        try {
            const response = await fetch(`http://localhost:9999/api/users/resend-otp/${decodedEmail}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: decodedEmail }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.message || "Gửi lại mã thất bại.");
                return;
            }

            setTimeLeft(TIMER_SECONDS);
            setOtp(new Array(OTP_LENGTH).fill(""));
            inputRefs.current[0]?.focus();
        } catch (err) {
            setError("Lỗi mạng. Vui lòng thử lại.");
        } finally {
            setIsResending(false);
        }
    };

    // ===== Handle Submit =====
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (loading) return;

        const otpCode = otp.join("");
        if (otpCode.length !== OTP_LENGTH) {
            setError("Vui lòng nhập đủ 6 ký tự.");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const response = await fetch(`http://localhost:9999/api/users/verify-otp/${decodedEmail}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: decodedEmail, otp: otpCode }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.message || "Xác thực thất bại. Mã OTP không đúng.");
                return;
            }

            navigate(ROUTES.LOGIN);
        } catch (err) {
            setError("Lỗi mạng. Vui lòng thử lại.");
        } finally {
            setLoading(false);
        }
    };

    // ===== Format Time =====
    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60).toString().padStart(1, "0");
        const s = (seconds % 60).toString().padStart(2, "0");
        return `${m}:${s}`;
    };

    return (
        <AuthLayout>
            <div className="w-full max-w-[420px] text-center">
                {/* Mobile logo */}
                <div className="lg:hidden mb-10">
                    <span className="text-midnight-coal text-[11px] font-medium tracking-[0.35em] uppercase">
                        Vogue Rental
                    </span>
                </div>

                {/* Icon */}
                <div className="mx-auto w-14 h-14 rounded-f-promo bg-canvas-fog flex items-center justify-center mb-8">
                    <FontAwesomeIcon
                        icon={faShieldHalved}
                        className="text-sunset-orange text-xl"
                    />
                </div>

                {/* Header */}
                <div className="mb-10">
                    <h2
                        className="text-midnight-coal font-medium mb-3"
                        style={{
                            fontSize: "43px",
                            lineHeight: 1.05,
                            letterSpacing: "-0.02em",
                        }}
                    >
                        Xác thực OTP
                    </h2>
                    <p className="text-muted-slate text-[14px] leading-[1.5]">
                        Mã xác nhận đã được gửi đến
                        <br />
                        <span className="text-midnight-coal font-medium">
                            {decodedEmail}
                        </span>
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* OTP Inputs */}
                    <div className="flex justify-center gap-3" onPaste={handlePaste}>
                        {otp.map((data, index) => (
                            <input
                                key={index}
                                type="text"
                                inputMode="text" // Đổi sang text để hiện bàn phím đầy đủ (chữ + số) trên điện thoại
                                maxLength={1}
                                value={data}
                                ref={(el) => (inputRefs.current[index] = el)}
                                onChange={(e) => handleChange(e, index)}
                                onKeyDown={(e) => handleKeyDown(e, index)}
                                onFocus={handleFocus}
                                className="w-12 h-14 text-center text-[20px] font-medium text-midnight-coal bg-canvas-fog border border-stone-whisper rounded-f-card-sm outline-none transition-all duration-200 focus:border-midnight-coal focus:bg-cloud-white focus:shadow-soft uppercase" // Thêm class 'uppercase' để hiển thị chữ in hoa trên giao diện
                            />
                        ))}
                    </div>

                    {/* Error */}
                    {error && <ErrorMessage message={error} />}

                    {/* Submit Button */}
                    <Button
                        type="submit"
                        icon={faArrowRight}
                        label="Xác nhận"
                        loading={loading}
                        className="bg-sunset-orange text-white hover:brightness-110 shadow-[0_4px_16px_rgba(249,74,0,0.3)] w-full"
                    />

                    {/* Timer & Resend */}
                    <div className="text-[14px] text-muted-slate pt-2">
                        {timeLeft > 0 ? (
                            <>
                                Gửi lại mã sau{" "}
                                <span className="text-sunset-orange font-medium tabular-nums">
                                    {formatTime(timeLeft)}
                                </span>
                            </>
                        ) : (
                            <button
                                type="button"
                                onClick={handleResendOtp}
                                disabled={isResending}
                                className="text-sunset-orange font-medium hover:text-midnight-coal transition-colors disabled:opacity-50"
                            >
                                {isResending ? "Đang gửi..." : "Gửi lại mã OTP"}
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </AuthLayout>
    );
}