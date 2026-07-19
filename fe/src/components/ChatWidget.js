import React, { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCommentDots, faTimes, faPaperPlane } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'model', text: 'Xin chào! Mình là AI trợ lý của CostumeHUB. Mình có thể giúp gì cho bạn?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

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
      const response = await axios.post('http://localhost:9999/api/chat', {
        message: userMessage,
        history: messages
      });

      setMessages(prev => [...prev, { role: 'model', text: response.data.reply }]);
    } catch (error) {
      console.error('Lỗi khi gọi API Chat:', error);
      setMessages(prev => [...prev, { role: 'model', text: 'Xin lỗi, hệ thống đang bận hoặc chưa cấu hình API Key. Vui lòng thử lại sau.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Chat Box */}
      {isOpen && (
        <div className="w-[350px] h-[450px] bg-white rounded-lg shadow-2xl flex flex-col mb-4 border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-blue-600 text-white p-4 flex justify-between items-center shadow-md">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <h3 className="font-semibold text-lg">AI Assistant</h3>
            </div>
            <button onClick={toggleChat} className="text-white hover:text-gray-200 transition-colors">
              <FontAwesomeIcon icon={faTimes} size="lg" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto bg-gray-50 flex flex-col gap-3">
            {messages.map((msg, index) => (
              <div key={index} className={`max-w-[85%] p-3 rounded-xl text-[15px] shadow-sm ${msg.role === 'user' ? 'bg-blue-600 text-white self-end rounded-tr-none' : 'bg-white text-gray-800 self-start border border-gray-200 rounded-tl-none'}`}>
                {msg.text}
              </div>
            ))}
            {isLoading && (
              <div className="bg-white text-gray-800 self-start border border-gray-200 p-3 rounded-xl rounded-tl-none text-[15px] shadow-sm flex gap-1 items-center">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="border-t p-3 bg-white flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Nhập tin nhắn..."
              className="flex-1 outline-none px-3 py-2 text-sm bg-gray-100 rounded-full border border-gray-200 focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
              disabled={isLoading}
            />
            <button 
              type="submit" 
              className="bg-blue-600 text-white w-10 h-10 rounded-full hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center transition-colors shadow-sm"
              disabled={isLoading}
            >
              <FontAwesomeIcon icon={faPaperPlane} />
            </button>
          </form>
        </div>
      )}

      {/* Chat Button */}
      {!isOpen && (
        <button 
          onClick={toggleChat}
          className="w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center shadow-lg transition-transform transform hover:scale-110 group relative"
        >
          <FontAwesomeIcon icon={faCommentDots} size="xl" />
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full animate-bounce">1</span>
        </button>
      )}
    </div>
  );
};

export default ChatWidget;
