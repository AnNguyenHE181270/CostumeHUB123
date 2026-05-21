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

    useEffect(() => {
        if (timeLeft <= 0) return;
        const timerId = setInterval(() => { setTimeLeft((prev) => prev - 1); }, 1000);
        return () => clearInterval(timerId);
    }, [timeLeft]);

    useEffect(() => { inputRefs.current[0]?.focus(); }, []);

    const handleChange = (e, index) => {
        const value = e.target.value;
        if (!/^[a-zA-Z0-9]*$/.test(value)) return;
        const newOtp = [...otp];
        newOtp[index] = value.slice(-1).toUpperCase();
        setOtp(newOtp);
        setError("");
        if (value !== "" && index < OTP_LENGTH - 1) { inputRefs.current[index + 1]?.focus(); }
    };

    const handleKeyDown = (e, index) => {
        if (e.key === "Backspace" && otp[index] === "" && index > 0) {
            const newOtp = [...otp]; newOtp[index - 1] = ""; setOtp(newOtp);
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handleFocus = (e) => { e.target.select(); };

    const handlePaste = (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData("text").trim();
        if (!/^[a-zA-Z0-9]+$/.test(pastedData)) return;
        const pastedArray = pastedData.slice(0, OTP_LENGTH).split("");
        const newOtp = [...otp];
        pastedArray.forEach((char, i) => { newOtp[i] = char.toUpperCase(); });
        setOtp(newOtp);
        const nextFocusIndex = Math.min(pastedArray.length, OTP_LENGTH - 1);
        inputRefs.current[nextFocusIndex]?.focus();
    };

    const handleResendOtp = async () => {
        if (timeLeft > 0 || isResending) return;
        setIsResending(true); setError("");
        try {
            const response = await fetch(`http://localhost:9999/api/users/resend-otp/${decodedEmail}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: decodedEmail }) });
            const data = await response.json();
            if (!response.ok) { setError(data.message || "Failed to resend code."); return; }
            setTimeLeft(TIMER_SECONDS); setOtp(new Array(OTP_LENGTH).fill("")); inputRefs.current[0]?.focus();
        } catch (err) { setError("Network error. Please try again."); } finally { setIsResending(false); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (loading) return;
        const otpCode = otp.join("");
        if (otpCode.length !== OTP_LENGTH) { setError("Please enter all 6 characters."); return; }
        setLoading(true); setError("");
        try {
            const response = await fetch(`http://localhost:9999/api/users/verify-otp/${decodedEmail}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: decodedEmail, otp: otpCode }) });
            const data = await response.json();
            if (!response.ok) { setError(data.message || "Verification failed. Incorrect OTP."); return; }
            navigate(ROUTES.LOGIN);
        } catch (err) { setError("Network error. Please try again."); } finally { setLoading(false); }
    };

    const formatTime = (seconds) => { const m = Math.floor(seconds / 60).toString().padStart(1, "0"); const s = (seconds % 60).toString().padStart(2, "0"); return `${m}:${s}`; };

    return (
        <AuthLayout>
            <div className="w-full max-w-[420px] text-center">
                <div className="lg:hidden mb-10"><span className="text-midnight-ink text-[11px] font-medium tracking-[0.35em] uppercase">Vogue Rental</span></div>
                <div className="mx-auto w-14 h-14 rounded-largeFeatures bg-ghost-fog flex items-center justify-center mb-8">
                    <FontAwesomeIcon icon={faShieldHalved} className="text-action-blue text-xl" />
                </div>
                <div className="mb-10">
                    <h2 className="text-abyssal-black font-medium mb-3" style={{ fontSize: "43px", lineHeight: 1.05, letterSpacing: "-0.02em" }}>Verify OTP</h2>
                    <p className="text-midnight-ink/60 text-[14px] leading-[1.5]">A verification code has been sent to<br /><span className="text-abyssal-black font-medium">{decodedEmail}</span></p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="flex justify-center gap-3" onPaste={handlePaste}>
                        {otp.map((data, index) => (
                            <input key={index} type="text" inputMode="text" maxLength={1} value={data} ref={(el) => (inputRefs.current[index] = el)} onChange={(e) => handleChange(e, index)} onKeyDown={(e) => handleKeyDown(e, index)} onFocus={handleFocus}
                                className="w-12 h-14 text-center text-[20px] font-medium text-abyssal-black bg-ghost-fog border border-sterling-gray rounded-cards outline-none transition-all duration-200 focus:border-midnight-ink focus:bg-canvas-white uppercase" />
                        ))}
                    </div>
                    {error && <ErrorMessage message={error} />}
                    <Button type="submit" icon={faArrowRight} label="Confirm" loading={loading} className="bg-action-blue text-canvas-white hover:bg-blue-700 rounded-buttons w-full" />
                    <div className="text-[14px] text-midnight-ink/60 pt-2">
                        {timeLeft > 0 ? (<>Resend code in <span className="text-warning-orange font-medium tabular-nums">{formatTime(timeLeft)}</span></>) : (
                            <button type="button" onClick={handleResendOtp} disabled={isResending} className="text-action-blue font-medium hover:text-blue-700 transition-colors disabled:opacity-50">
                                {isResending ? "Sending..." : "Resend OTP"}
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </AuthLayout>
    );
}