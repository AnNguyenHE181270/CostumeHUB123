import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../routes/routePaths";
import chinhsachImg from "../assets/chinhsach.png";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBookOpen, faCheck } from "@fortawesome/free-solid-svg-icons";

export default function PoliciesModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setClosing(false);
      document.body.style.overflow = "hidden";
      requestAnimationFrame(() => setMounted(true));
    } else {
      document.body.style.overflow = "";
      setMounted(false);
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleClose = (redirectTo = null) => {
    setClosing(true);
    setTimeout(() => {
      setMounted(false);
      document.body.style.overflow = "";
      if (onClose) onClose();
      if (redirectTo) navigate(redirectTo);
    }, 300);
  };

  if (!isOpen && !mounted) return null;

  return (
    <>
      {/* ── Dark Backdrop Overlay ── */}
      <div
        aria-hidden="true"
        onClick={() => handleClose()}
        className={`fixed inset-0 z-[9998] bg-black/75 backdrop-blur-md transition-opacity duration-300 ${
          closing ? "opacity-0" : "opacity-100"
        }`}
      />

      {/* ── Modal Shell ── */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Chính sách CostumeHUB"
        className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 pointer-events-none"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className={`pointer-events-auto relative w-auto max-w-[92vw] sm:max-w-[720px] max-h-[85vh] bg-white rounded-3xl border border-[#c9a869]/40 shadow-[0_25px_80px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col items-center justify-center transition-all duration-300 transform ${
            closing ? "opacity-0 scale-95 translate-y-6" : "opacity-100 scale-100 translate-y-0"
          }`}
        >
          {/* ── Nút "XEM CHÍNH SÁCH" góc bên trái - Di chuột cuộn rộng ra ── */}
          <button
            onClick={() => handleClose(ROUTES.ABOUT_US)}
            className="absolute top-4 left-4 z-30 group flex items-center gap-2 h-9 px-2.5 rounded-full bg-black/80 hover:bg-black text-[#f5e6ca] border border-[#c9a869]/50 shadow-xl transition-all duration-300 text-[11px] font-bold uppercase tracking-wider backdrop-blur-md cursor-pointer overflow-hidden max-w-[36px] hover:max-w-[170px]"
            title="Xem chi tiết chính sách"
          >
            <FontAwesomeIcon icon={faBookOpen} className="text-[#d4af37] text-[12px] shrink-0" />
            <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap pr-1.5">
              Xem chính sách
            </span>
          </button>

          {/* ── Nút "ĐÃ HIỂU" thay thế nút X ở góc trên bên phải ── */}
          <button
            onClick={() => handleClose()}
            className="absolute top-4 right-4 z-30 px-4 py-2 rounded-full bg-black/80 hover:bg-black text-[#f5e6ca] hover:text-white border border-[#c9a869]/50 shadow-xl transition-all duration-300 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 backdrop-blur-md cursor-pointer hover:scale-105"
            title="Đóng thông báo"
          >
            <FontAwesomeIcon icon={faCheck} className="text-[#d4af37] text-[11px]" />
            Đã Hiểu
          </button>

          {/* ── Dynamic Image Container (Fit 100% không cuộn) ── */}
          <div className="w-full flex items-center justify-center p-2 sm:p-3 overflow-hidden">
            <img
              src={chinhsachImg}
              alt="Chính sách CostumeHUB"
              className="max-w-full max-h-[78vh] w-auto h-auto object-contain select-none rounded-2xl block"
            />
          </div>
        </div>
      </div>
    </>
  );
}