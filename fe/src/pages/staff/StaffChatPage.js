import React, { useEffect, useState, useRef } from "react";
import { socket } from "../../utils/socket";
import { useAuth } from "../../context/AuthContext";

export default function StaffChatPage() {
  const { user, token } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [messageInput, setMessageInput] = useState("");
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load list of chat rooms
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        setLoadingRooms(true);
        const res = await fetch(`http://localhost:9999/api/chat-rooms/staff/${user.id || user._id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok && data.data) {
          setRooms(data.data);
        }
      } catch (error) {
        console.error("Error fetching rooms:", error);
      } finally {
        setLoadingRooms(false);
      }
    };

    if (user && token) {
      fetchRooms();
    }
  }, [user, token]);

  // Load messages and join socket room when activeRoom changes
  useEffect(() => {
    if (!activeRoom || !token) return;

    const roomId = activeRoom._id;
    
    const fetchMessages = async () => {
      try {
        setLoadingMessages(true);
        const res = await fetch(`http://localhost:9999/api/messages/${roomId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setMessages(data.data);
        }
      } catch (error) {
        console.error("Error fetching messages:", error);
      } finally {
        setLoadingMessages(false);
      }
    };

    fetchMessages();
    socket.emit("join_room", roomId);

    const handleReceive = (data) => {
      if (data.roomId === roomId) {
        setMessages((prev) => [...prev, data]);
      }
      
      // Update the room's last message in the sidebar
      setRooms((prevRooms) => 
        prevRooms.map((r) => 
          r._id === data.roomId ? { ...r, lastMessage: data.message, lastMessageAt: data.createdAt || new Date() } : r
        ).sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt))
      );
    };

    socket.on("receive_message", handleReceive);

    return () => {
      socket.off("receive_message", handleReceive);
    };
  }, [activeRoom, token]);

  const sendMessage = () => {
    if (!messageInput.trim() || !activeRoom) return;

    socket.emit("send_message", {
      roomId: activeRoom._id,
      message: messageInput,
      senderId: user.id || user._id,
    });

    setMessageInput("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex h-[calc(100vh-120px)] bg-white rounded-lg shadow-md overflow-hidden">
      {/* Cột trái: Danh sách khách hàng */}
      <div className="w-1/3 border-r border-gray-200 flex flex-col bg-gray-50">
        <div className="p-4 border-b border-gray-200 bg-white">
          <h2 className="text-lg font-semibold text-gray-800">Tin nhắn hỗ trợ</h2>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {loadingRooms ? (
            <div className="p-4 text-center text-gray-500">Đang tải...</div>
          ) : rooms.length === 0 ? (
            <div className="p-4 text-center text-gray-500">Chưa có khách hàng nào</div>
          ) : (
            rooms.map((room) => {
              const customer = room.userId;
              const isActive = activeRoom?._id === room._id;
              
              return (
                <div 
                  key={room._id} 
                  onClick={() => setActiveRoom(room)}
                  className={`flex items-center p-4 border-b border-gray-100 cursor-pointer transition-colors ${isActive ? 'bg-blue-50' : 'hover:bg-gray-100 bg-white'}`}
                >
                  <img 
                    src={customer?.avatar || "https://cdn-icons-png.flaticon.com/512/149/149071.png"} 
                    alt={customer?.fullName} 
                    className="w-12 h-12 rounded-full object-cover mr-3 border border-gray-200"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-1">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {customer?.fullName || "Khách hàng"}
                      </h3>
                      <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                        {formatTime(room.lastMessageAt)}
                      </span>
                    </div>
                    <p className={`text-sm truncate ${isActive ? 'text-blue-600' : 'text-gray-500'}`}>
                      {room.lastMessage || "Bắt đầu trò chuyện"}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Cột phải: Khung chat */}
      <div className="w-2/3 flex flex-col bg-white">
        {activeRoom ? (
          <>
            {/* Header phòng chat */}
            <div className="p-4 border-b border-gray-200 flex items-center shadow-sm z-10">
              <img 
                src={activeRoom.userId?.avatar || "https://cdn-icons-png.flaticon.com/512/149/149071.png"} 
                alt="Avatar" 
                className="w-10 h-10 rounded-full mr-3 object-cover"
              />
              <h2 className="text-lg font-semibold text-gray-800">
                {activeRoom.userId?.fullName || "Khách hàng"}
              </h2>
            </div>

            {/* Nội dung chat */}
            <div className="flex-1 p-4 overflow-y-auto bg-gray-50 flex flex-col gap-4">
              {loadingMessages ? (
                <div className="text-center text-gray-500 mt-4">Đang tải tin nhắn...</div>
              ) : messages.length === 0 ? (
                <div className="text-center text-gray-500 mt-4">Hãy gửi tin nhắn đầu tiên để hỗ trợ khách hàng</div>
              ) : (
                messages.map((msg, idx) => {
                  const isMe = msg.senderId === (user.id || user._id);
                  return (
                    <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] rounded-2xl px-4 py-2 ${isMe ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm shadow-sm'}`}>
                        <p className="text-sm">{msg.message}</p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input chat */}
            <div className="p-4 border-t border-gray-200 bg-white">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Nhập tin nhắn hỗ trợ..."
                  className="flex-1 px-4 py-2 bg-gray-100 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-full text-sm transition-all outline-none"
                />
                <button
                  onClick={sendMessage}
                  className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition-colors shadow-md"
                >
                  <svg className="w-4 h-4 ml-1" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                  </svg>
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 text-gray-400">
            <svg className="w-20 h-20 mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-lg font-medium text-gray-500">Chọn một khách hàng để bắt đầu hỗ trợ</p>
          </div>
        )}
      </div>
    </div>
  );
}
