import React, { useEffect, useState, useRef } from "react";
import { socket } from "../../utils/socket";
import { useAuth } from "../../context/AuthContext";

export default function ChatBox() {
  const { user, token } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [roomId, setRoomId] = useState(null);
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [chat, isOpen]);

  // Load chat room and messages when opening
  useEffect(() => {
    if (!isOpen || !user || !token) return;

    let currentRoomId = roomId;

    const initChat = async () => {
      try {
        setLoading(true);
        if (!currentRoomId) {
          // Get or create room
          const roomRes = await fetch("http://localhost:9999/api/chat-rooms/room", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ userId: user.id || user._id })
          });
          
          if (!roomRes.ok) throw new Error("Could not initialize room");
          
          const roomData = await roomRes.json();
          currentRoomId = roomData.data._id;
          setRoomId(currentRoomId);
        }

        // Join socket room
        socket.emit("join_room", currentRoomId);

        // Fetch old messages
        const msgRes = await fetch(`http://localhost:9999/api/messages/${currentRoomId}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (msgRes.ok) {
          const msgData = await msgRes.json();
          if (msgData.success && msgData.data) {
            setChat(msgData.data);
          }
        }
      } catch (error) {
        console.error("Chat error:", error);
      } finally {
        setLoading(false);
      }
    };

    initChat();

    // Setup socket listener
    const handleReceive = (data) => {
      setChat((prev) => {
        // Prevent duplicate messages if sender is me (though we probably don't add optimistic UI yet)
        return [...prev, data];
      });
    };
    
    socket.on("receive_message", handleReceive);

    return () => {
      socket.off("receive_message", handleReceive);
    };
  }, [isOpen, user, token, roomId]); // Re-run if opened, but we want to keep roomId stable

  // Do not render for unauthenticated users or staff/admin
  if (!user || user.role === "admin" || user.role === "staff") return null;

  const sendMessage = async () => {
    if (!message.trim() || !roomId) return;
    
    const msgText = message;
    setMessage("");

    // Emit via socket. Backend will save to DB and broadcast back to room.
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

  return (
    <>
      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-80 bg-white border border-gray-200 rounded-lg shadow-2xl flex flex-col z-50 overflow-hidden">
          {/* Header */}
          <div className="bg-[#1a1a1a] text-white px-4 py-3 flex justify-between items-center">
            <h3 className="font-semibold">Chat Support</h3>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-gray-300 hover:text-white"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 p-4 h-80 overflow-y-auto bg-gray-50 flex flex-col gap-3">
            {loading && chat.length === 0 ? (
              <div className="text-center text-sm text-gray-500 mt-4">Connecting...</div>
            ) : chat.length === 0 ? (
              <div className="text-center text-sm text-gray-500 mt-4">Send a message to start chatting!</div>
            ) : (
              chat.map((c, i) => {
                const isMe = c.senderId === (user.id || user._id);
                return (
                  <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${isMe ? 'bg-[#1a1a1a] text-white rounded-br-none' : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none'}`}>
                      {c.message}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-gray-200 p-3 bg-white flex gap-2 items-center">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-[#1a1a1a]"
            />
            <button 
              onClick={sendMessage}
              className="bg-[#1a1a1a] text-white px-4 py-2 rounded-md text-sm hover:bg-black transition-colors"
            >
              Send
            </button>
          </div>
        </div>
      )}

      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-[#1a1a1a] text-white rounded-full shadow-lg flex items-center justify-center hover:bg-black transition-all transform hover:scale-105 z-50"
        title="Chat with us"
      >
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