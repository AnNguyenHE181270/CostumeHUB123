import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBell, faBoxOpen, faTruck, faWallet, faCircleCheck } from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "../../context/AuthContext";
import notificationService from "../../services/notification.service";
import { formatTime } from "../../utils/formatters";

const POLL_INTERVAL_MS = 30000;

// Icon riêng theo loại thông báo — để nội dung (VD: hoàn tiền) đi kèm icon đúng ý nghĩa,
// thay vì chỉ hiện chấm tròn chung chung như trước.
const NOTIFICATION_ICON_MAP = {
  order_created: { icon: faBoxOpen, className: "bg-blue-50 text-blue-600" },
  order_status: { icon: faTruck, className: "bg-amber-50 text-amber-600" },
  wallet_topup: { icon: faWallet, className: "bg-emerald-50 text-emerald-600" },
  issue_refund_accepted: { icon: faCircleCheck, className: "bg-emerald-50 text-emerald-600" },
  refund_completed: { icon: faWallet, className: "bg-emerald-50 text-emerald-600" },
};
const DEFAULT_NOTIFICATION_ICON = { icon: faBell, className: "bg-gray-100 text-gray-500" };

export default function NotificationBell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await notificationService.getMyNotifications();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      console.error("Không thể tải thông báo:", err.message);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    fetchNotifications();
    const interval = setInterval(fetchNotifications, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [user, fetchNotifications]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!user) return null;

  const handleItemClick = async (n) => {
    setOpen(false);
    if (!n.isRead) {
      try {
        await notificationService.markAsRead(n._id);
        setNotifications((prev) => prev.map((x) => (x._id === n._id ? { ...x, isRead: true } : x)));
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (err) {
        console.error("Không thể đánh dấu đã đọc:", err.message);
      }
    }
    if (n.link) navigate(n.link);
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Không thể đánh dấu tất cả đã đọc:", err.message);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="relative text-gray-700 hover:text-black transition-colors p-1 flex items-center justify-center"
        aria-label="Thông báo"
      >
        <FontAwesomeIcon icon={faBell} className="text-[20px] lg:text-[22px]" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full shadow-md border-2 border-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-4 w-80 max-w-[90vw] bg-white border border-gray-100 shadow-lg rounded-md z-50 max-h-[420px] flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="text-[13px] font-bold text-[#1a1a1a]">Thông báo</h3>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-[11px] font-medium text-[#b8935a] hover:text-black transition-colors"
              >
                Đánh dấu đã đọc tất cả
              </button>
            )}
          </div>

          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <p className="text-[12px] text-gray-400 text-center py-8">Chưa có thông báo nào.</p>
            ) : (
              notifications.map((n) => {
                const { icon, className } = NOTIFICATION_ICON_MAP[n.type] || DEFAULT_NOTIFICATION_ICON;
                return (
                  <button
                    key={n._id}
                    type="button"
                    onClick={() => handleItemClick(n)}
                    className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors ${!n.isRead ? "bg-[#faf6f0]" : ""}`}
                  >
                    <div className="flex items-start gap-2.5">
                      <span className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] shrink-0 ${className}`}>
                        <FontAwesomeIcon icon={icon} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start gap-1.5">
                          {!n.isRead && <span className="w-1.5 h-1.5 rounded-full bg-[#b8935a] mt-1.5 shrink-0" />}
                          <p className="text-[12px] font-semibold text-[#1a1a1a] truncate">{n.title}</p>
                        </div>
                        <p className="text-[12px] text-gray-500 mt-0.5 leading-relaxed line-clamp-2">{n.message}</p>
                        <p className="text-[10px] text-gray-400 mt-1">{formatTime(n.createdAt)}</p>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
