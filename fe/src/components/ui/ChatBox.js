import React, { useEffect, useState, useRef } from "react";
import { useLocation } from "react-router-dom";
import { socket } from "../../utils/socket";
import { useAuth } from "../../context/AuthContext";

export default function ChatBox() {
  const location = useLocation();
  const { user, token } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [roomId, setRoomId] = useState(null);
  const [staffInfo, setStaffInfo] = useState(null);
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [unreadCount, setUnreadCount] = useState(0);
  const [queuePosition, setQueuePosition] = useState(null);
  const [queueFullMessage, setQueueFullMessage] = useState("");
  
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      if (roomId && user) {
        socket.emit("seen_message", { roomId, userId: user.id || user._id });
        setUnreadCount(0);
      }
    }
  }, [chat, isOpen, roomId, user]);

  useEffect(() => {
    if (!user || user.role === "admin" || user.role === "staff" || location.pathname === "/customer/chat") return;

    socket.emit("register", { userId: user.id || user._id, role: user.role });

    const onUnread = (data) => setUnreadCount(data.count);
    const onNewMsgNotif = (data) => {
      if (!isOpen) {
        setUnreadCount(prev => prev + 1);
      } else {
        socket.emit("seen_message", { roomId: data.roomId, userId: user.id || user._id });
      }
    };

    socket.on("unread_count", onUnread);
    socket.on("new_message_notification", onNewMsgNotif);

    return () => {
      socket.off("unread_count", onUnread);
      socket.off("new_message_notification", onNewMsgNotif);
    };
  }, [user, isOpen]);

  useEffect(() => {
    if (!isOpen || !user || !token) return;

    const onChatAssigned = async (room) => {
      setRoomId(room._id);
      if (room.staffId && room.staffId.fullName) {
        setStaffInfo(room.staffId);
      }
      setQueuePosition(null);
      setQueueFullMessage("");
      
      socket.emit("join_room", room._id);
      
      try {
        setLoading(true);
        const msgRes = await fetch(`http://localhost:9999/api/messages/${room._id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (msgRes.ok) {
          const msgData = await msgRes.json();
          if (msgData.success && msgData.data) {
            setChat(msgData.data);
            socket.emit("seen_message", { roomId: room._id, userId: user.id || user._id });
          }
        }
      } catch (err) {
         console.error(err);
      } finally {
        setLoading(false);
      }
    };

    const onQueueUpdate = (data) => setQueuePosition(data.position);
    const onQueueFull = (data) => setQueueFullMessage(data.message);
    const onChatClosed = () => {
      setRoomId(null);
      setChat([]);
      setStaffInfo(null);
      setQueuePosition(null);
      setQueueFullMessage("");
      setIsOpen(false);
    };

    const onReceiveMsg = (data) => {
       setChat(prev => [...prev, data]);
       if (isOpen) {
         socket.emit("seen_message", { roomId: data.roomId, userId: user.id || user._id });
       }
    };

    const onMessageSeen = (data) => {
       setChat(prev => prev.map(m => {
          if (m.senderId !== data.byUserId) {
            return { ...m, status: "seen" };
          }
          return m;
       }));
    };

    socket.on("chat_assigned", onChatAssigned);
    socket.on("queue_update", onQueueUpdate);
    socket.on("queue_full", onQueueFull);
    socket.on("chat_closed", onChatClosed);
    socket.on("receive_message", onReceiveMsg);
    socket.on("message_seen", onMessageSeen);

    if (!roomId && !queuePosition && !queueFullMessage) {
       if (isOpen) {
         socket.emit("request_chat", user.id || user._id);
       } else {
         socket.emit("check_active_room", user.id || user._id);
       }
    }

    return () => {
      socket.off("chat_assigned", onChatAssigned);
      socket.off("queue_update", onQueueUpdate);
      socket.off("queue_full", onQueueFull);
      socket.off("chat_closed", onChatClosed);
      socket.off("receive_message", onReceiveMsg);
      socket.off("message_seen", onMessageSeen);
    };
  }, [isOpen, user, token, roomId, queuePosition, queueFullMessage]);

  // Removed old return null

  const sendMessage = async () => {
    if (!message.trim() || !roomId) return;
    
    const msgText = message;
    setMessage("");

    socket.emit("send_message", {
      roomId,
      message: msgText,
      senderId: user.id || user._id,
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  };

  const getUnreadBadge = () => {
    if (unreadCount === 0) return null;
    return unreadCount > 5 ? "5+" : unreadCount;
  };

  const closeChat = () => {
    if (!roomId) return;
    if (window.confirm("Kết thúc phiên trò chuyện này?")) {
      socket.emit("close_chat", { roomId });
    }
  };

  // Always render the chat button, but handle different user roles
  const roleStr = user?.role?.toLowerCase?.() || user?.role || "";
  const isStaffOrAdmin = roleStr === "admin" || roleStr === "owner" || roleStr === "staff";

  if (location.pathname === "/customer/chat") {
    return null;
  }

  if (!user || isStaffOrAdmin) {
    return (
      <button
        onClick={() => {
          if (!user) {
            alert("Vui lòng đăng nhập tài khoản Khách hàng để sử dụng tính năng chat hỗ trợ.");
          } else {
            alert("Tài khoản quản trị/nhân viên không sử dụng khung chat này. Vui lòng truy cập trang Quản lý Chat của nhân viên.");
          }
        }}
        className="fixed bottom-6 right-6 w-14 h-14 bg-[#1a1a1a] text-white rounded-full shadow-lg flex items-center justify-center hover:bg-black transition-all transform hover:scale-105 z-[9999]"
        title="Chat with us"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      </button>
    );
  }

  // Find index of last seen message sent by me
  let lastSeenIndex = -1;
  const myUserId = user.id || user._id;
  for (let i = chat.length - 1; i >= 0; i--) {
    if (chat[i].senderId === myUserId && chat[i].status === "seen") {
      lastSeenIndex = i;
      break;
    }
  }

  return (
    <>
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-[350px] h-[500px] bg-white border border-gray-200 rounded-lg shadow-2xl flex flex-col z-[9999] overflow-hidden">
          <div className="bg-[#1a1a1a] text-white px-4 py-3 flex justify-between items-center shadow-md z-10">
            <h3 className="font-semibold text-sm">
              {staffInfo ? `Đang chat với: ${staffInfo.fullName}` : "Hỗ trợ trực tuyến"}
            </h3>
            <div className="flex items-center gap-3">
              {roomId && (
                <button 
                  onClick={closeChat} 
                  className="text-xs bg-red-500 hover:bg-red-600 px-2 py-1 rounded transition-colors"
                  title="Kết thúc"
                >
                  Kết thúc
                </button>
              )}
              <button 
                onClick={() => setIsOpen(false)}
                className="text-gray-300 hover:text-white transition-colors"
                title="Thu nhỏ"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div className="flex-1 p-4 overflow-y-auto bg-gray-50 flex flex-col gap-3">
            {queueFullMessage ? (
               <div className="text-center text-sm text-red-500 mt-4">{queueFullMessage}</div>
            ) : queuePosition ? (
               <div className="text-center text-sm text-gray-500 mt-4">
                 Bạn đang ở vị trí số {queuePosition} trong hàng đợi. Vui lòng chờ ít phút...
               </div>
            ) : loading && chat.length === 0 ? (
              <div className="text-center text-sm text-gray-500 mt-4">Connecting...</div>
            ) : chat.length === 0 ? (
              <div className="text-center text-sm text-gray-500 mt-4">Gửi tin nhắn để bắt đầu!</div>
            ) : (
              chat.map((c, i) => {
                const isMe = c.senderId === myUserId;
                const isLastSeen = i === lastSeenIndex;
                return (
                  <div key={i} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${isMe ? 'bg-[#1a1a1a] text-white rounded-br-none' : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none'}`}>
                      {c.message}
                    </div>
                    {isLastSeen && staffInfo && staffInfo.avatar && (
                      <img 
                        src={staffInfo.avatar || "https://cdn-icons-png.flaticon.com/512/149/149071.png"} 
                        alt="seen" 
                        className="w-3 h-3 rounded-full mt-1 opacity-70"
                        title="Đã xem"
                      />
                    )}
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-gray-200 p-3 bg-white flex gap-2 items-center">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={!!queueFullMessage || queuePosition !== null}
              placeholder={queuePosition ? "Đang chờ..." : "Type your message..."}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-[#1a1a1a] disabled:bg-gray-100"
            />
            <button 
              onClick={sendMessage}
              disabled={!!queueFullMessage || queuePosition !== null}
              className="bg-[#1a1a1a] text-white px-4 py-2 rounded-md text-sm hover:bg-black transition-colors disabled:bg-gray-400"
            >
              Send
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-[#1a1a1a] text-white rounded-full shadow-lg flex items-center justify-center hover:bg-black transition-all transform hover:scale-105 z-[9999]"
        title="Chat with us"
      >
        {unreadCount > 0 && !isOpen && (
           <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
             {getUnreadBadge()}
           </span>
        )}
        {isOpen ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        )}
      </button>
    </>
  );
}