import { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight, faShieldHalved } from "@fortawesome/free-solid-svg-icons";
import { useNavigate, useParams, useLocation, useSearchParams } from "react-router-dom";
import Button from "../components/ui/Button";
import ErrorMessage from "../components/ui/ErrorMessage";
import AuthLayout from "../layouts/AuthLayout";
import { ROUTES } from "../routes/routePaths";
import userService from "../services/user.service";

const OTP_LENGTH = 6;
const TIMER_SECONDS = 60;

export default function VerifyOtpPage() {
    const { email } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [otp, setOtp] = useState(new Array(OTP_LENGTH).fill(""));
    const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS);
    const [isResending, setIsResending] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const inputRefs = useRef([]);
    const [searchParams] = useSearchParams();
    const queryOtp = searchParams.get("otp");
    const decodedEmail = decodeURIComponent(email || "");

    useEffect(() => {
        if (!location.state?.fromRegister && !queryOtp) {
            navigate(ROUTES.REGISTER, { replace: true });
        }
    }, [location.state, navigate, queryOtp]);

    useEffect(() => {
        if (queryOtp && queryOtp.length === OTP_LENGTH) {
            const pastedArray = queryOtp.slice(0, OTP_LENGTH).split("");
            const newOtp = new Array(OTP_LENGTH).fill("");
            pastedArray.forEach((char, i) => { newOtp[i] = char.toUpperCase(); });
            setOtp(newOtp);
            
            // Auto submit
            setLoading(true);
            userService.verifyOtp(decodedEmail, queryOtp)
                .then(() => navigate(ROUTES.LOGIN))
                .catch((err) => {
                    setError(err.message || "Xác thực thất bại. Mã OTP không chính xác.");
                    setLoading(false);
                });
        }
    }, [queryOtp, decodedEmail, navigate]);

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
                    await userService.resendOtp(decodedEmail);
            setTimeLeft(TIMER_SECONDS); setOtp(new Array(OTP_LENGTH).fill("")); inputRefs.current[0]?.focus();
        } catch (err) { setError(err.message || "Gửi lại mã thất bại."); } finally { setIsResending(false); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (loading) return;
        const otpCode = otp.join("");
        if (otpCode.length !== OTP_LENGTH) { setError("Vui lòng nhập đủ 6 ký tự."); return; }
        setLoading(true); setError("");
        try {
                await userService.verifyOtp(decodedEmail, otpCode);
            navigate(ROUTES.LOGIN);
        } catch (err) { setError(err.message || "Xác thực thất bại. Mã OTP không chính xác."); } finally { setLoading(false); }
    };

    const formatTime = (seconds) => { const m = Math.floor(seconds / 60).toString().padStart(1, "0"); const s = (seconds % 60).toString().padStart(2, "0"); return `${m}:${s}`; };

    return (
        <AuthLayout>
            <div className="w-full max-w-[420px] text-center">
                <div className="lg:hidden mb-10">
                    <span className="text-text-primary text-[11px] font-medium tracking-[0.35em] uppercase">Luxe Rent</span>
                </div>
                
                <div className="mx-auto w-14 h-14 rounded-2xl bg-surface border border-borderorder flex items-center justify-center mb-8">
                    <FontAwesomeIcon icon={faShieldHalved} className="text-[#1a1a1a] text-xl" />
                </div>
                
                <div className="mb-10">
                    <h2 className="text-text-primary text-4xl font-semibold tracking-tight mb-3">Xác thực OTP</h2>
                    <p className="text-text-secondary text-sm leading-relaxed">
                        Một mã xác thực đã được gửi đến<br />
                        <span className="text-text-primary font-medium">{decodedEmail}</span>
                    </p>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="flex justify-center gap-3" onPaste={handlePaste}>
                        {otp.map((data, index) => (
                            <input 
                                key={index} 
                                type="text" 
                                inputMode="text" 
                                maxLength={1} 
                                value={data} 
                                ref={(el) => (inputRefs.current[index] = el)} 
                                onChange={(e) => handleChange(e, index)} 
                                onKeyDown={(e) => handleKeyDown(e, index)} 
                                onFocus={handleFocus}
                                className="w-12 h-14 text-center text-xl font-medium text-text-primary bg-surface border border-borderorder rounded-xl outline-none transition-all duration-200 focus:border-primary-500 focus:bg-background focus:ring-1 focus:ring-[#1a1a1a] uppercase" 
                            />
                        ))}
                    </div>
                    
                    {error && <ErrorMessage message={error} />}
                    
                    <Button 
                        type="submit" 
                        variant="primary"
                        icon={faArrowRight} 
                        label="Xác nhận" 
                        loading={loading} 
                    />
                    
                    <div className="text-sm text-text-secondary pt-2">
                        {timeLeft > 0 ? (
                            <>Gửi lại mã sau <span className="text-[#1a1a1a] font-medium tabular-nums">{formatTime(timeLeft)}</span></>
                        ) : (
                            <button 
                                type="button" 
                                onClick={handleResendOtp} 
                                disabled={isResending} 
                                className="text-[#1a1a1a] font-medium hover:text-[#1a1a1a] transition-colors disabled:opacity-50"
                            >
                                {isResending ? "Đang gửi..." : "Gửi lại OTP"}
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </AuthLayout>
    );
}