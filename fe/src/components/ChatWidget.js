import React, { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faPaperPlane, faUserTie } from '@fortawesome/free-solid-svg-icons';
import { useLocation } from 'react-router-dom';
import axios from 'axios';

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'model', text: 'Xin chào! Mình là Tư vấn viên AI của CostumeHUB. Mình có thể giúp gì cho bạn?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const location = useLocation();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const toggleChat = () => setIsOpen(!isOpen);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      const historyForAPI = messages.map(msg => ({ role: msg.role, text: msg.text }));
      const response = await axios.post('http://localhost:9999/api/chat', {
        message: userMessage,
        history: historyForAPI
      });

      setMessages(prev => [...prev, { role: 'model', text: response.data.reply, product: response.data.product }]);
    } catch (error) {
      console.error('Lỗi khi gọi API Chat:', error);
      setMessages(prev => [...prev, { role: 'model', text: 'Xin lỗi, hệ thống đang bận hoặc chưa cấu hình API Key. Vui lòng thử lại sau.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Chỉ ẩn khung chat ở các trang đặc biệt (đăng nhập, profile, lịch sử, trang quản lý)
  const excludePaths = [
    '/login', '/register', '/verify', '/forgot-password', '/reset-password',
    '/user', '/rental-history', '/owner', '/staff'
  ];
  const isExcluded = excludePaths.some(path => location.pathname.startsWith(path));
  if (isExcluded) return null;

  const formatMessageText = (text) => {
    if (!text) return '';
    // Replace **bold** with <strong>bold</strong>
    let formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Replace *italic* with <em>italic</em>
    formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
    // Replace newlines with <br/>
    formatted = formatted.replace(/\n/g, '<br/>');
    return formatted;
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Chat Box */}
      {isOpen && (
        <div className="w-[380px] h-[580px] bg-white rounded-3xl shadow-[0_15px_50px_-10px_rgba(0,0,0,0.3)] flex flex-col mb-4 border border-gray-100 overflow-hidden transform transition-all duration-300 ease-in-out">
          {/* Header */}
          <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white p-5 flex justify-between items-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -mr-10 -mt-10"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-5 rounded-full -ml-10 -mb-10"></div>
            
            <div className="flex items-center gap-3 z-10">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/30 shadow-inner">
                 <FontAwesomeIcon icon={faUserTie} size="lg" className="text-white" />
              </div>
              <div>
                <h3 className="font-bold text-lg leading-tight tracking-wide">Tư vấn viên AI</h3>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-[0_0_5px_#4ade80]"></span>
                  <span className="text-xs text-gray-300 font-medium tracking-wide">Đang hoạt động</span>
                </div>
              </div>
            </div>
            <button onClick={toggleChat} className="text-gray-300 hover:text-white hover:bg-white/10 w-9 h-9 flex items-center justify-center rounded-full transition-all z-10">
              <FontAwesomeIcon icon={faTimes} size="lg" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 p-5 overflow-y-auto bg-gray-50 flex flex-col gap-4 scrollbar-thin scrollbar-thumb-gray-300">
            {messages.map((msg, index) => (
              <div key={index} className={`max-w-[85%] flex flex-col ${msg.role === 'user' ? 'self-end items-end' : 'self-start items-start'}`}>
                <div className={`px-4 py-3 text-[15px] shadow-sm leading-relaxed ${
                  msg.role === 'user' 
                  ? 'bg-gradient-to-br from-gray-900 to-gray-700 text-white rounded-2xl rounded-tr-sm' 
                  : 'bg-white text-gray-800 border border-gray-100 rounded-2xl rounded-tl-sm shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)]'
                }`}>
                  <div dangerouslySetInnerHTML={{ __html: formatMessageText(msg.text) }} />
                  {msg.product && (
                    <div className="mt-4 p-3 bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col items-center transform hover:scale-[1.02] transition-transform duration-200">
                       <img src={msg.product.images?.[0] || 'https://via.placeholder.com/150'} alt={msg.product.name} className="w-28 h-28 object-cover rounded-lg mb-3 shadow-sm border border-gray-50" />
                       <span className="font-semibold text-sm text-center mb-1.5 leading-snug">{msg.product.name}</span>
                       <span className="text-red-500 font-bold text-[15px] mb-3">{(msg.product.pricePerDay || msg.product.price).toLocaleString('vi-VN')}đ/ngày</span>
                       <a href={`/product/${msg.product._id}`} className="w-full py-2.5 bg-gray-900 text-white text-xs font-bold rounded-lg hover:bg-black transition-colors text-center block shadow-md">
                          Thuê ngay
                       </a>
                    </div>
                  )}
                </div>
                <span className="text-[10px] text-gray-400 mt-1.5 px-1 font-medium">
                  {msg.role === 'user' ? 'Bạn' : 'Tư vấn viên AI'}
                </span>
              </div>
            ))}
            {isLoading && (
              <div className="bg-white text-gray-800 self-start border border-gray-100 px-4 py-3.5 rounded-2xl rounded-tl-sm shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] flex gap-1.5 items-center">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="p-4 bg-white border-t border-gray-100 shadow-[0_-5px_15px_rgba(0,0,0,0.02)]">
            <div className="flex gap-2 relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Nhập câu hỏi của bạn..."
                className="flex-1 outline-none pl-5 pr-14 py-3.5 text-sm bg-gray-50 hover:bg-gray-100 transition-colors rounded-full border border-gray-200 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 focus:bg-white"
                disabled={isLoading}
              />
              <button 
                type="submit" 
                className="absolute right-1.5 top-1.5 bottom-1.5 w-11 h-11 bg-gray-900 text-white rounded-full hover:bg-gray-800 disabled:opacity-50 disabled:hover:bg-gray-900 flex items-center justify-center transition-all shadow-md transform active:scale-95"
                disabled={isLoading || !input.trim()}
              >
                <FontAwesomeIcon icon={faPaperPlane} className="ml-[-2px] text-[15px]" />
              </button>
            </div>
            <div className="text-center mt-3 mb-1">
              <span className="text-[10px] text-gray-400 font-medium tracking-wide">Được cung cấp bởi AI của CostumeHUB</span>
            </div>
          </form>
        </div>
      )}

      {/* Chat Button */}
      {!isOpen && (
        <button 
          onClick={toggleChat}
          className="w-16 h-16 bg-gradient-to-r from-gray-900 to-gray-800 hover:from-black hover:to-gray-900 text-white rounded-full flex items-center justify-center shadow-[0_8px_30px_rgb(0,0,0,0.3)] transition-all duration-300 transform hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(0,0,0,0.4)] group relative"
        >
          <FontAwesomeIcon icon={faUserTie} size="xl" className="group-hover:scale-110 transition-transform duration-300" />
          <span className="absolute top-0 right-0 bg-red-500 border-2 border-white text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full animate-bounce shadow-sm">1</span>
        </button>
      )}
    </div>
  );
};

export default ChatWidget;
