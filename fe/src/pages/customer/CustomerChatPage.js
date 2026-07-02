import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { io } from "socket.io-client";
import { formatTime } from "../../utils/formatters";

export default function CustomerChatPage() {
  const { user, token } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [socket, setSocket] = useState(null);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [queuePosition, setQueuePosition] = useState(null);
  const [queueFullMessage, setQueueFullMessage] = useState("");
  const chatContainerRef = useRef(null);

  // Initialize socket
  useEffect(() => {
    if (!user || !token) return;
    const newSocket = io(process.env.REACT_APP_API_URL || "http://localhost:9999");
    setSocket(newSocket);

    newSocket.emit("register", { userId: user.id || user._id, role: "customer" });

    newSocket.on("chat_assigned", (room) => {
      setQueuePosition(null);
      setQueueFullMessage("");
      setActiveRoom(room);
      setRooms((prev) => {
        const exists = prev.find(r => r._id === room._id);
        if (exists) return prev.map(r => r._id === room._id ? room : r);
        return [room, ...prev];
      });
    });

    newSocket.on("queue_update", (data) => setQueuePosition(data.position));
    newSocket.on("queue_full", (data) => setQueueFullMessage(data.message));
    
    newSocket.on("chat_closed", (data) => {
      setRooms((prev) => 
        prev.map(r => r._id === data.roomId ? { ...r, status: "closed", isActive: false } : r)
      );
      if (activeRoom && activeRoom._id === data.roomId) {
        setActiveRoom(prev => ({ ...prev, status: "closed", isActive: false }));
      }
      alert("Đoạn chat đã được kết thúc.");
    });

    return () => newSocket.disconnect();
  }, [user, token]);

  // Fetch rooms
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const res = await fetch(`http://localhost:9999/api/chat-rooms/user/${user.id || user._id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok && data.data) {
          setRooms(data.data);
          // Auto select active room if exists
          const active = data.data.find(r => r.status === "active");
          if (active) setActiveRoom(active);
        }
      } catch (error) {
        console.error("Error fetching rooms:", error);
      } finally {
        setLoadingRooms(false);
      }
    };
    if (user && token) fetchRooms();
  }, [user, token]);

  // Load messages when room changes
  useEffect(() => {
    if (!activeRoom || !socket) return;
    const roomId = activeRoom._id;

    const fetchMessages = async () => {
      setLoadingMessages(true);
      try {
        const res = await fetch(`http://localhost:9999/api/messages/${roomId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setMessages(data.data);
          socket.emit("seen_message", { roomId, userId: user.id || user._id });
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
        socket.emit("seen_message", { roomId, userId: user.id || user._id });
      }
      
      setRooms((prevRooms) => 
        prevRooms.map((r) => 
          r._id === data.roomId ? { ...r, lastMessage: data.message, lastMessageAt: data.createdAt || new Date() } : r
        ).sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt))
      );
    };

    const handleSeen = (data) => {
      if (data.roomId === roomId) {
        setMessages((prev) => prev.map(m => {
          if (m.senderId !== data.byUserId) {
            return { ...m, status: "seen" };
          }
          return m;
        }));
      }
    };

    socket.on("receive_message", handleReceive);
    socket.on("message_seen", handleSeen);

    return () => {
      socket.off("receive_message", handleReceive);
      socket.off("message_seen", handleSeen);
    };
  }, [activeRoom, socket, user, token]);

  // Scroll to bottom
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeRoom || activeRoom.status === "closed") return;

    socket.emit("send_message", {
      roomId: activeRoom._id,
      message: newMessage,
      senderId: user.id || user._id,
    });

    setNewMessage("");
  };

  const startNewChat = () => {
    if (!socket) return;
    setActiveRoom(null);
    setMessages([]);
    socket.emit("request_chat", user.id || user._id);
  };

  const closeChat = () => {
    if (!activeRoom || !socket) return;
    if (window.confirm("Kết thúc phiên trò chuyện này?")) {
      socket.emit("close_chat", { roomId: activeRoom._id });
    }
  };

  const roleStr = (typeof user?.role === "string" ? user.role : (user?.role?.name || "")).toLowerCase();
  
  if (!user || (roleStr !== "customer" && roleStr !== "online-customer")) {
    return <div className="text-center p-10 mt-20">Truy cập bị từ chối. Chỉ dành cho khách hàng.</div>;
  }

  return (
    <div className="pt-24 pb-12 px-4 max-w-7xl mx-auto min-h-screen">
      <div className="flex h-[calc(100vh-150px)] bg-white rounded-xl shadow-xl overflow-hidden border border-gray-100">
        
        {/* Sidebar */}
        <div className="w-1/3 border-r border-gray-200 flex flex-col bg-gray-50">
          <div className="p-4 border-b border-gray-200 bg-white flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-800">Chat với Shop</h2>
            <button 
              onClick={startNewChat}
              className="bg-black text-white text-xs px-3 py-1.5 rounded-full hover:bg-gray-800 transition-colors shadow-sm font-medium"
            >
              + Chat mới
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {loadingRooms ? (
              <div className="p-4 text-center text-gray-500 text-sm">Đang tải...</div>
            ) : rooms.length === 0 ? (
              <div className="p-10 text-center flex flex-col items-center justify-center h-full">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                  <i className="fa-regular fa-comment-dots text-gray-400 text-2xl"></i>
                </div>
                <p className="text-gray-500 text-sm mb-4">Bạn chưa có phiên chat nào.</p>
                <button 
                  onClick={startNewChat}
                  className="bg-black text-white text-sm px-5 py-2 rounded-lg hover:bg-gray-800 transition-colors shadow-md"
                >
                  Bắt đầu chat ngay
                </button>
              </div>
            ) : (
              <>
                {/* Active Rooms */}
                {rooms.filter(r => r.status === "active").length > 0 && (
                  <>
                    <div className="px-4 py-2 bg-gray-200 text-[10px] font-bold text-gray-600 uppercase tracking-wider">
                      Đang hỗ trợ
                    </div>
                    {rooms.filter(r => r.status === "active").map((room) => {
                      const staff = room.staffId;
                      const isActive = activeRoom?._id === room._id;
                      
                      return (
                        <div 
                          key={room._id} 
                          onClick={() => setActiveRoom(room)}
                          className={`flex items-center p-4 border-b border-gray-100 cursor-pointer transition-colors ${isActive ? 'bg-blue-50' : 'hover:bg-gray-100 bg-white'}`}
                        >
                          <div className="relative">
                            <img 
                              src={staff?.avatar || "https://cdn-icons-png.flaticon.com/512/149/149071.png"} 
                              alt={staff?.fullName} 
                              className="w-12 h-12 rounded-full object-cover mr-3 border border-gray-200"
                            />
                            <div className="absolute bottom-0 right-3 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-baseline mb-1">
                              <h3 className="text-sm font-medium text-gray-900 truncate">
                                {staff?.fullName || "Nhân viên"}
                              </h3>
                              <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                                {formatTime(room.lastMessageAt)}
                              </span>
                            </div>
                            <p className={`text-sm truncate ${isActive ? 'text-blue-600' : 'text-gray-500'}`}>
                              {room.lastMessage || "Chưa có tin nhắn"}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}

                {/* Closed Rooms */}
                {rooms.filter(r => r.status === "closed").length > 0 && (
                  <>
                    <div className="px-4 py-2 bg-gray-100 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-t border-gray-200">
                      Lịch sử chat
                    </div>
                    {rooms.filter(r => r.status === "closed").map((room) => {
                      const staff = room.staffId;
                      const isActive = activeRoom?._id === room._id;
                      
                      return (
                        <div 
                          key={room._id} 
                          onClick={() => setActiveRoom(room)}
                          className={`flex items-center p-4 border-b border-gray-100 cursor-pointer transition-colors ${isActive ? 'bg-gray-200' : 'hover:bg-gray-50 bg-white opacity-70 hover:opacity-100'}`}
                        >
                          <div className="relative">
                            <img 
                              src={staff?.avatar || "https://cdn-icons-png.flaticon.com/512/149/149071.png"} 
                              alt={staff?.fullName} 
                              className="w-10 h-10 rounded-full object-cover mr-3 border border-gray-200 grayscale"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-baseline mb-1">
                              <h3 className="text-sm font-medium text-gray-600 truncate">
                                {staff?.fullName || "Nhân viên"}
                              </h3>
                              <span className="text-[10px] text-gray-400 whitespace-nowrap ml-2">
                                {formatTime(room.lastMessageAt)}
                              </span>
                            </div>
                            <p className="text-xs truncate text-gray-400">
                              {room.lastMessage || "Chưa có tin nhắn"}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}
              </>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="w-2/3 flex flex-col bg-white">
          {!activeRoom && !queuePosition && !queueFullMessage ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-gray-50/50">
              <img src="https://cdn-icons-png.flaticon.com/512/1041/1041916.png" className="w-24 h-24 mb-6 opacity-20" alt="Chat" />
              <p className="text-lg font-medium text-gray-500">Chọn một đoạn chat để bắt đầu</p>
              <button 
                onClick={startNewChat}
                className="mt-4 bg-black text-white px-6 py-2 rounded-lg shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
              >
                Tạo tin nhắn mới
              </button>
            </div>
          ) : queuePosition || queueFullMessage ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-500 bg-blue-50/30">
              <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              {queueFullMessage ? (
                <p className="text-red-500 font-medium px-10 text-center">{queueFullMessage}</p>
              ) : (
                <div className="text-center">
                  <p className="text-lg font-semibold text-gray-800 mb-1">Đang tìm nhân viên hỗ trợ...</p>
                  <p className="text-blue-600 font-medium bg-blue-100 inline-block px-4 py-1 rounded-full text-sm">
                    Bạn đang ở vị trí số {queuePosition} trong hàng đợi
                  </p>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="p-4 border-b border-gray-200 flex justify-between items-center shadow-sm z-10">
                <div className="flex items-center">
                  <img 
                    src={activeRoom?.staffId?.avatar || "https://cdn-icons-png.flaticon.com/512/149/149071.png"} 
                    alt="Avatar" 
                    className={`w-10 h-10 rounded-full mr-3 object-cover shadow-sm ${activeRoom.status === 'closed' ? 'grayscale' : ''}`}
                  />
                  <div>
                    <div className="font-semibold text-gray-800 flex items-center gap-2">
                      {activeRoom?.staffId?.fullName || "Nhân viên hỗ trợ"}
                      {activeRoom.status === "closed" && (
                        <span className="bg-gray-200 text-gray-600 text-[10px] px-2 py-0.5 rounded-md border border-gray-300 font-bold uppercase">
                          Đã đóng
                        </span>
                      )}
                    </div>
                    {activeRoom.status === "active" && (
                      <div className="text-xs text-green-500 flex items-center mt-0.5">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-1.5 animate-pulse"></span>
                        Đang hoạt động
                      </div>
                    )}
                  </div>
                </div>
                {activeRoom.status === "active" && (
                  <button 
                    onClick={closeChat} 
                    className="text-xs font-medium bg-red-50 text-red-600 hover:bg-red-500 hover:text-white px-3 py-1.5 rounded-lg border border-red-100 transition-all shadow-sm"
                  >
                    Kết thúc Chat
                  </button>
                )}
              </div>

              {/* Messages */}
              <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-6 bg-[#f8f9fa] space-y-4">
                {loadingMessages ? (
                  <div className="text-center text-gray-400 py-4">Đang tải tin nhắn...</div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-gray-400 py-10 bg-white rounded-lg border border-gray-100 shadow-sm mx-10">
                    <p className="mb-2">👋 Xin chào!</p>
                    <p className="text-sm">Hãy gửi tin nhắn đầu tiên để bắt đầu trò chuyện.</p>
                  </div>
                ) : (
                  messages.map((msg, index) => {
                    const isMe = msg.senderId === (user.id || user._id);
                    return (
                      <div key={index} className={`flex ${isMe ? "justify-end" : "justify-start"} group`}>
                        <div className={`max-w-[70%] px-4 py-2.5 rounded-2xl shadow-sm ${
                          isMe ? "bg-black text-white rounded-tr-sm" : "bg-white text-gray-800 border border-gray-100 rounded-tl-sm"
                        }`}>
                          <p className="text-[14px] leading-relaxed break-words">{msg.message}</p>
                          <div className={`text-[10px] mt-1 flex items-center ${isMe ? "text-gray-400 justify-end" : "text-gray-400 justify-start"}`}>
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            {isMe && msg.status === "seen" && (
                              <span className="ml-1.5 text-blue-400"><i className="fa-solid fa-check-double"></i></span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Input */}
              {activeRoom.status === "active" ? (
                <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-gray-200">
                  <div className="flex relative items-center">
                    <input
                      type="text"
                      className="flex-1 border border-gray-300 rounded-full pl-5 pr-12 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent bg-gray-50 transition-all"
                      placeholder="Nhập tin nhắn của bạn..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                    />
                    <button 
                      type="submit" 
                      disabled={!newMessage.trim()}
                      className={`absolute right-2 w-10 h-10 flex items-center justify-center rounded-full transition-all ${
                        newMessage.trim() ? "bg-black text-white hover:scale-105 shadow-md" : "bg-gray-200 text-gray-400"
                      }`}
                    >
                      <i className="fa-solid fa-paper-plane text-sm -ml-0.5"></i>
                    </button>
                  </div>
                </form>
              ) : (
                <div className="p-4 bg-gray-50 border-t border-gray-200 text-center">
                  <p className="text-gray-500 text-sm mb-3">Cuộc trò chuyện này đã kết thúc.</p>
                  <button 
                    onClick={startNewChat}
                    className="bg-white border border-gray-300 text-black text-sm px-6 py-2 rounded-full hover:bg-gray-100 transition-colors shadow-sm font-medium"
                  >
                    Tạo phiên chat mới
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
