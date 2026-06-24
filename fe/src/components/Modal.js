import React, { useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";

/**
 * Modal — Reusable modal dialog.
 *
 * @prop {boolean}  isOpen      — Whether modal is visible
 * @prop {func}     onClose     — Close callback
 * @prop {string}   title       — Header title
 * @prop {string}   size        — "sm" | "md" | "lg"  (default: "md")
 * @prop {boolean}  closeOnOverlay — Close when clicking overlay (default: true)
 * @prop {boolean}  closeOnEsc  — Close on Escape key (default: true)
 * @prop {boolean}  showClose   — Show X button (default: true)
 * @prop {node}     children    — Modal body content
 * @prop {node}     footer      — Footer content (buttons, etc.)
 * @prop {string}   className   — Extra classes for modal card
 */
export default function Modal({
  isOpen = false,
  onClose,
  title,
  size = "md",
  closeOnOverlay = true,
  closeOnEsc = true,
  showClose = true,
  children,
  footer,
  className = "",
}) {
  const modalRef = useRef(null);

  /* ── Escape key ── */
  useEffect(() => {
    if (!isOpen || !closeOnEsc) return;
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [isOpen, closeOnEsc, onClose]);

  /* ── Lock body scroll ── */
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  /* ── Focus trap (basic) ── */
  useEffect(() => {
    if (isOpen && modalRef.current) {
      modalRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  /* ── Size styles ── */
  const sizeClasses = {
    sm: "max-w-[400px]",
    md: "max-w-[560px]",
    lg: "max-w-[720px]",
  };

  const handleOverlayClick = (e) => {
    if (closeOnOverlay && e.target === e.currentTarget) {
      onClose?.();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9990] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "modal-title" : undefined}
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in transition-opacity duration-300"
        onClick={handleOverlayClick}
        aria-hidden="true"
      />

      {/* Modal Card */}
      <div
        ref={modalRef}
        tabIndex={-1}
        className={`
          relative w-full bg-white rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)]
          ring-1 ring-black/5 animate-scale-in outline-none
          flex flex-col max-h-[90vh] overflow-hidden
          ${sizeClasses[size] || sizeClasses.md}
          ${className}
        `}
      >
        {(title || showClose) && (
          <div className="flex items-center justify-between px-7 py-5 border-b border-[#f0ece8] bg-white relative z-10">
            {title && (
              <h2
                id="modal-title"
                className="text-[22px] font-bold text-[#1a1a1a] tracking-tight"
                style={{ fontFamily: "'Cormorant Garamond', serif" }}
              >
                {title}
              </h2>
            )}
            {!title && <div />}
            {showClose && (
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-[#f5f5f5]
                           text-[#888] hover:text-rose-600 hover:bg-rose-50
                           transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                aria-label="Đóng"
              >
                <FontAwesomeIcon icon={faTimes} className="text-[14px]" />
              </button>
            )}
          </div>
        )}

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto p-7">
          {children}
        </div>

        {/* ── Footer ── */}
        {footer && (
          <div className="px-7 py-5 border-t border-[#f0ece8] bg-[#faf9f7] flex items-center justify-end gap-3 rounded-b-2xl relative z-10">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
