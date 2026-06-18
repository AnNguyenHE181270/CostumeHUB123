import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../routes/routePaths";

/* ─── Keyframes injected into <head> once ─── */
const KEYFRAMES = `
@keyframes ch-overlay-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}
@keyframes ch-overlay-out {
  from { opacity: 1; }
  to   { opacity: 0; }
}
@keyframes ch-modal-in {
  from { opacity: 0; transform: translateY(52px) scale(0.95); }
  to   { opacity: 1; transform: translateY(0)    scale(1);    }
}
@keyframes ch-modal-out {
  from { opacity: 1; transform: translateY(0)    scale(1);    }
  to   { opacity: 0; transform: translateY(32px) scale(0.97); }
}
@keyframes ch-card-in {
  from { opacity: 0; transform: translateY(22px) scale(0.98); }
  to   { opacity: 1; transform: translateY(0)    scale(1);    }
}
@keyframes ch-badge-pulse {
  0%,100% { box-shadow: 0 0 0 0   rgba(212,175,55,0.40); }
  50%      { box-shadow: 0 0 0 9px rgba(212,175,55,0);    }
}
@keyframes ch-shimmer {
  0%   { background-position: -500px 0; }
  100% { background-position:  500px 0; }
}
@keyframes ch-float {
  0%,100% { transform: translateY(0px);  }
  50%      { transform: translateY(-5px); }
}
@keyframes ch-line-grow {
  from { transform: scaleX(0); }
  to   { transform: scaleX(1); }
}
/* Continuous color cycle for the "Đã hiểu" dismiss link */
@keyframes ch-color-cycle {
  0%   { color: #1a1a1a; }
  20%  { color: #b8941f; }
  40%  { color: #d4af37; }
  60%  { color: #555555; }
  80%  { color: #d4af37; }
  100% { color: #1a1a1a; }
}
/* Underline slide for dismiss link */
@keyframes ch-underline-slide {
  from { transform: scaleX(0); transform-origin: left; }
  to   { transform: scaleX(1); transform-origin: left; }
}
`;

function injectKeyframes() {
    if (document.getElementById("ch-policies-kf")) return;
    const s = document.createElement("style");
    s.id = "ch-policies-kf";
    s.textContent = KEYFRAMES;
    document.head.appendChild(s);
}

/* ─── Policy data ─── */
const POLICIES = [
    {
        icon: "shield_person",
        title: "Trách nhiệm",
        accent: "#1a1a1a",
        iconBg: "#1a1a1a",
        items: [
            "Khách hàng có trách nhiệm giữ gìn trang phục, không tự ý sửa chữa hoặc giặt tẩy mạnh.",
            <>Phí trả muộn: <strong style={{ color: "#1a1a1a" }}>10% giá cọc/ngày</strong> theo thời điểm trả thực tế.</>,
        ],
    },
    {
        icon: "calendar_month",
        title: "Đặt hàng & Thanh toán",
        accent: "#1a1a1a",
        iconBg: "#1a1a1a",
        items: [
            <>Khách hàng cần tiến hành đặt lịch thuê đồ trước <strong style={{ color: "#1a1a1a" }}>ít nhất 1 ngày (24 giờ)</strong>.</>,
            <>Nền tảng trừ tiền trực tiếp thông qua <strong style={{ color: "#1a1a1a" }}>Số dư ví </strong>của khách hàng.</>,
        ],
    },
    {
        icon: "report_problem",
        title: "Bồi thường",
        accent: "#1a1a1a",
        iconBg: "#1a1a1a",
        items: [
            <>Hư hỏng nhẹ: Phí bồi thường <strong style={{ color: "#1a1a1a" }}>20% tiền cọc</strong>.</>,
            <>Mất hoặc hư hỏng không phục hồi: Khấu trừ <strong style={{ color: "#1a1a1a" }}>100% tiền cọc</strong>.</>,
        ],
    },
    {
        icon: "swap_horiz",
        title: "Quyền lợi",
        accent: "#1a1a1a",
        iconBg: "#1a1a1a",
        items: [
            <>Khách hàng có thể đổi/trả sản phẩm dễ dàng trong vòng <strong style={{ color: "#1a1a1a" }}>5 tiếng </strong> nếu phát hiện lỗi hoặc không vừa ý.</>,
            "Nền tảng chỉ hỗ trợ cho thuê và vận chuyển trên địa phận Hà Nội.",
        ],
    },
];


export default function PoliciesModal({ isOpen, onClose }) {
    const navigate = useNavigate();
    const [mounted, setMounted] = useState(false);
    const [closing, setClosing] = useState(false);

    useEffect(() => { injectKeyframes(); }, []);

    useEffect(() => {
        if (isOpen) {
            setClosing(false);
            document.body.style.overflow = "hidden";
            requestAnimationFrame(() => setMounted(true));
        } else {
            document.body.style.overflow = "";
            setMounted(false);
        }
        return () => { document.body.style.overflow = ""; };
    }, [isOpen]);

    const handleClose = (redirectTo = ROUTES.HOME) => {
        setClosing(true);
        setTimeout(() => {
            setMounted(false);
            document.body.style.overflow = "";
            if (onClose) onClose();
            if (redirectTo !== ROUTES.HOME) navigate(redirectTo);
        }, 320);
    };

    if (!isOpen && !mounted) return null;

    return (
        <>
            <link
                href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
                rel="stylesheet"
            />

            {/* ── Dark overlay ── */}
            <div
                aria-hidden="true"
                onClick={() => handleClose(ROUTES.HOME)}
                style={{
                    position: "fixed",
                    inset: 0,
                    zIndex: 9998,
                    background: "rgba(10,10,10,0.72)",
                    backdropFilter: "blur(4px)",
                    WebkitBackdropFilter: "blur(4px)",
                    animation: closing
                        ? "ch-overlay-out 0.32s ease forwards"
                        : "ch-overlay-in 0.35s ease forwards",
                }}
            />

            {/* ── Centering shell ── */}
            <div
                role="dialog"
                aria-modal="true"
                aria-label="Chính sách CostumeHUB"
                style={{
                    position: "fixed",
                    inset: 0,
                    zIndex: 9999,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "20px",
                    pointerEvents: "none",
                }}
            >
                {/* ── Unified modal card (no internal borders) ── */}
                <div
                    onClick={(e) => e.stopPropagation()}
                    style={{
                        pointerEvents: "auto",
                        position: "relative",          /* for the dismiss link */
                        width: "100%",
                        maxWidth: "860px",
                        maxHeight: "88vh",
                        display: "flex",
                        flexDirection: "column",
                        borderRadius: "20px",
                        overflow: "hidden",
                        background: "#faf9f7",          /* uniform cream — no sections */
                        border: "1px solid rgba(26,26,26,0.10)",
                        boxShadow: "0 40px 100px rgba(0,0,0,0.42), 0 0 0 1px rgba(255,255,255,0.06)",
                        fontFamily: "'Inter', sans-serif",
                        animation: closing
                            ? "ch-modal-out 0.32s cubic-bezier(0.32,0,0.67,0) forwards"
                            : "ch-modal-in 0.45s cubic-bezier(0.16,1,0.3,1) forwards",
                    }}
                >
                    {/* ── TOP-RIGHT dismiss text link ── */}
                    <DismissLink onClick={() => handleClose(ROUTES.HOME)} />

                    {/* ── Shimmer top stripe ── */}
                    <div style={{
                        flexShrink: 0,
                        height: "3px",
                        background: "linear-gradient(90deg, #1a1a1a 0%, #d4af37 50%, #1a1a1a 100%)",
                        backgroundSize: "500px 100%",
                        animation: "ch-shimmer 3s linear infinite",
                    }} />

                    {/* ── Scrollable area — header + cards + footer button — all one unit ── */}
                    <div style={{
                        flex: 1,
                        overflowY: "auto",
                        padding: "36px 36px 32px",
                        scrollbarWidth: "thin",
                        scrollbarColor: "#d4af37 transparent",
                    }}>
                        {/* Header content */}
                        <div style={{ textAlign: "center", marginBottom: "28px", paddingRight: "60px" }}>
                            {/* Badge */}
                            <div style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px",
                                background: "#1a1a1a",
                                color: "#d4af37",
                                padding: "5px 16px",
                                borderRadius: "9999px",
                                fontSize: "10px",
                                fontWeight: 700,
                                letterSpacing: "0.12em",
                                textTransform: "uppercase",
                                marginBottom: "16px",
                                animation: "ch-badge-pulse 2.5s ease-in-out 0.5s infinite",
                            }}>
                                <span className="material-symbols-outlined"
                                    style={{ fontSize: "13px", fontVariationSettings: "'FILL' 1" }}>
                                    verified
                                </span>
                                CHÍNH SÁCH THÀNH VIÊN
                            </div>

                            {/* Title */}
                            <h1 style={{
                                fontFamily: "'Cormorant Garamond', serif",
                                fontSize: "clamp(24px, 4vw, 36px)",
                                fontWeight: 700,
                                color: "#1a1a1a",
                                letterSpacing: "-0.02em",
                                lineHeight: 1.15,
                                marginBottom: "10px",
                                animation: "ch-float 4s ease-in-out 1s infinite",
                            }}>
                                Chào mừng đến với{" "}
                                <span style={{
                                    background: "linear-gradient(135deg, #1a1a1a 0%, #555 100%)",
                                    WebkitBackgroundClip: "text",
                                    WebkitTextFillColor: "transparent",
                                    backgroundClip: "text",
                                }}>
                                    CostumeHUB
                                </span>
                                <span style={{ color: "#d4af37" }}>!</span>
                            </h1>

                            <p style={{
                                color: "#555555",
                                fontSize: "15px",
                                lineHeight: "1.65",
                                maxWidth: "520px",
                                margin: "0 auto",
                            }}>
                                Vui lòng dành ít phút đọc qua các quy định thuê trang phục —
                                để trải nghiệm của bạn thật trọn vẹn.
                            </p>
                        </div>

                        {/* Decorative divider line */}
                        <div style={{
                            height: "1.5px",
                            background: "linear-gradient(90deg, transparent, #d4af37, transparent)",
                            marginBottom: "24px",
                            animation: "ch-line-grow 0.9s 0.4s cubic-bezier(0.16,1,0.3,1) both",
                            transformOrigin: "center",
                        }} />

                        {/* Policy cards grid */}
                        <div style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                            gap: "14px",
                            marginBottom: "28px",
                        }}>
                            {POLICIES.map((policy, idx) => (
                                <PolicyCard key={policy.title} policy={policy} delay={idx * 90} />
                            ))}
                        </div>

                        {/* Bottom: "Xem chi tiết chính sách" button */}
                        <div style={{ display: "flex", justifyContent: "center" }}>
                            <DetailButton onClick={() => handleClose(ROUTES.ABOUT_US)} />
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

function DismissLink({ onClick }) {
    const [hov, setHov] = useState(false);

    return (
        <button
            onClick={onClick}
            onMouseEnter={() => setHov(true)}
            onMouseLeave={() => setHov(false)}
            title="Đã hiểu – Về trang chủ"
            style={{
                position: "absolute",
                top: "24px",
                right: "-36px",
                width: "150px",
                zIndex: 10,
                background: hov ? "#d4af37" : "#1a1a1a",
                border: "none",
                cursor: "pointer",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                padding: "8px 0",
                outline: "none",
                transform: "rotate(45deg)",
                boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
                transition: "all 0.3s ease",
            }}
        >
            {/* The text */}
            <span style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "12px",
                fontWeight: 700,
                color: hov ? "#1a1a1a" : "#d4af37",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                whiteSpace: "nowrap",
                animation: "ch-color-cycle 3.5s linear infinite",
            }}>
                Đã hiểu ✓
            </span>
        </button>
    );
}


function DetailButton({ onClick }) {
    const [hov, setHov] = useState(false);
    const [press, setPress] = useState(false);

    return (
        <button
            onClick={onClick}
            onMouseEnter={() => setHov(true)}
            onMouseLeave={() => { setHov(false); setPress(false); }}
            onMouseDown={() => setPress(true)}
            onMouseUp={() => setPress(false)}
            style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "0 32px",
                height: "48px",
                borderRadius: "9999px",
                fontSize: "14px",
                fontFamily: "'Inter', sans-serif",
                fontWeight: 600,
                cursor: "pointer",
                outline: "none",
                letterSpacing: "0.01em",
                border: "1.5px solid rgba(26,26,26,0.22)",
                background: hov ? "rgba(26,26,26,0.06)" : "transparent",
                color: "#1a1a1a",
                transition: "all 0.22s cubic-bezier(0.16,1,0.3,1)",
                transform: press ? "scale(0.95)" : hov ? "scale(1.03)" : "scale(1)",
                boxShadow: hov ? "0 4px 16px rgba(0,0,0,0.08)" : "none",
            }}
        >
            <span className="material-symbols-outlined"
                style={{ fontSize: "17px", fontVariationSettings: "'FILL' 1" }}>
                open_in_new
            </span>
            Xem chi tiết chính sách
        </button>
    );
}

function PolicyCard({ policy, delay }) {
    const [hovered, setHovered] = useState(false);

    return (
        <div
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                background: hovered ? "#ffffff" : "rgba(255,255,255,0.55)",
                borderRadius: "14px",
                padding: "20px",
                border: hovered
                    ? `1.5px solid ${policy.accent}35`
                    : "1.5px solid rgba(26,26,26,0.08)",
                transition: "all 0.28s cubic-bezier(0.16,1,0.3,1)",
                transform: hovered ? "translateY(-4px)" : "translateY(0)",
                boxShadow: hovered
                    ? `0 16px 40px rgba(0,0,0,0.10), 0 0 0 1px ${policy.accent}18`
                    : "0 1px 4px rgba(0,0,0,0.04)",
                animation: `ch-card-in 0.5s cubic-bezier(0.16,1,0.3,1) ${delay}ms both`,
                cursor: "default",
            }}
        >
            <div style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
                {/* Icon */}
                <div style={{
                    width: "44px",
                    height: "44px",
                    flexShrink: 0,
                    borderRadius: "12px",
                    background: policy.iconBg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: policy.isVip ? "#1a1a1a" : "#ffffff",
                    transition: "transform 0.3s cubic-bezier(0.16,1,0.3,1)",
                    transform: hovered ? "scale(1.1) rotate(-4deg)" : "scale(1)",
                }}>
                    <span className="material-symbols-outlined" style={{
                        fontSize: "20px",
                        fontVariationSettings: policy.isVip ? "'FILL' 1" : "'FILL' 0",
                    }}>
                        {policy.icon}
                    </span>
                </div>

                <div style={{ flex: 1 }}>
                    {/* Title row */}
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                        <h3 style={{
                            fontFamily: "'Cormorant Garamond', serif",
                            fontSize: "18px",
                            fontWeight: 700,
                            color: "#1a1a1a",
                            margin: 0,
                            letterSpacing: "-0.01em",
                        }}>
                            {policy.title}
                        </h3>
                        {policy.isVip && (
                            <span style={{
                                background: "#d4af37",
                                color: "#fff",
                                fontSize: "9px",
                                fontWeight: 800,
                                padding: "2px 7px",
                                borderRadius: "4px",
                                letterSpacing: "0.1em",
                                textTransform: "uppercase",
                                fontFamily: "'Inter', sans-serif",
                            }}>
                                VIP
                            </span>
                        )}
                    </div>

                    {/* Divider */}
                    <div style={{
                        height: "1px",
                        background: `linear-gradient(90deg, ${policy.accent}22, transparent)`,
                        marginBottom: "10px",
                        opacity: hovered ? 1 : 0.5,
                        transition: "opacity 0.3s",
                    }} />

                    <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
                        {policy.items.map((item, i) => (
                            <li key={i} style={{
                                display: "flex",
                                alignItems: "flex-start",
                                gap: "8px",
                                marginBottom: i < policy.items.length - 1 ? "8px" : 0,
                                fontSize: "13.5px",
                                lineHeight: "19px",
                                color: "#555555",
                                fontFamily: "'Inter', sans-serif",
                            }}>
                                <span style={{
                                    color: "#1a1a1a",
                                    marginTop: "3px",
                                    flexShrink: 0,
                                    fontSize: "10px",
                                    fontWeight: 900,
                                }}>●</span>
                                <span>{item}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}