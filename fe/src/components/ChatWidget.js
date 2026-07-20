import React, { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faPaperPlane, faUserTie, faCheckCircle, faEdit } from '@fortawesome/free-solid-svg-icons';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import chatbotIcon from '../assets/chatbot.png';
import { useAuth } from '../context/AuthContext';
import rentalService from '../services/rental.service';
import { getRentalDays, getRentalPriceFactor, formatDateNoHours } from '../utils/formatters';

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'model', text: 'Xin chào! Mình là Tư vấn viên AI của CostumeHUB. Mình có thể giúp gì cho bạn?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();

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

      setMessages(prev => [...prev, { role: 'model', text: response.data.reply, product: response.data.product, rentNowData: response.data.rentNowData }]);
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

  const handleConfirmRent = async (rentData) => {
    setIsLoading(true);
    try {
      const defaultAddress = user?.addresses?.find(a => a.isDefault) || user?.addresses?.[0];
      const addressDetail = defaultAddress 
        ? `${defaultAddress.addressDetail}, ${defaultAddress.ward}, ${defaultAddress.district}, ${defaultAddress.province}` 
        : "Nhận tại cửa hàng";
      
      const payload = {
        startDate: new Date(rentData.startDate).toISOString(),
        endDate: new Date(rentData.endDate).toISOString(),
        items: [{
          costume: rentData.costumeId,
          size: rentData.size,
          color: "Mặc định",
          quantity: 1,
          cartStartDate: rentData.startDate,
          cartEndDate: rentData.endDate,
        }],
        shippingFee: 0,
        paymentMethod: "WALLET",
        shippingAddress: {
          receiverName: defaultAddress?.receiverName || user?.fullName || "Khách",
          receiverPhone: defaultAddress?.receiverPhone || user?.phone || "",
          addressDetail: addressDetail,
          provinceId: defaultAddress?.provinceId || null,
          districtId: defaultAddress?.districtId || null,
          wardCode: defaultAddress?.wardCode || null,
          province: defaultAddress?.province || null,
          district: defaultAddress?.district || null,
          ward: defaultAddress?.ward || null,
        }
      };

      await rentalService.createOrder(payload);
      if (refreshProfile) await refreshProfile();
      setMessages(prev => [...prev, { role: 'model', text: 'Thanh toán thành công! Đơn hàng của bạn đã được tạo tự động. Vui lòng vào Lịch sử đơn hàng để xem chi tiết.'}]);
      setTimeout(() => navigate('/rental-history'), 1500);
    } catch(err) {
      setMessages(prev => [...prev, { role: 'model', text: `Rất tiếc, có lỗi xảy ra: ${err.response?.data?.message || err.message || 'Số dư có thể không đủ hoặc lỗi hệ thống.'}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Chat Box */}
      {isOpen && (
        <div className="w-[380px] h-[580px] bg-white rounded-3xl shadow-[0_15px_50px_-10px_rgba(201,168,105,0.2)] flex flex-col mb-4 border border-[#c9a869]/30 overflow-hidden transform transition-all duration-300 ease-in-out">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#2e2a22] to-[#1a1814] text-white p-5 flex justify-between items-center relative overflow-hidden border-b border-[#c9a869]/30">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#c9a869] opacity-5 rounded-full -mr-10 -mt-10"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-[#c9a869] opacity-5 rounded-full -ml-10 -mb-10"></div>
            
            <div className="flex items-center gap-3 z-10">
              <div className="w-12 h-12 rounded-full flex items-center justify-center border-2 border-[#c9a869] shadow-inner bg-white overflow-hidden p-0.5">
                 <img src={chatbotIcon} alt="Chatbot" className="w-full h-full object-cover rounded-full" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-[#f5e6ca] leading-tight tracking-wide">Tư vấn viên AI</h3>
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
                  {msg.rentNowData && msg.product ? (
                    <div className="mt-4 p-4 bg-white rounded-xl border border-[#c9a869]/30 shadow-md flex flex-col w-full text-[13px] text-gray-700">
                       <div className="font-bold text-[#b8935a] mb-2 text-[14px] flex items-center gap-1.5 border-b border-gray-100 pb-2">
                         Xác nhận đơn thuê tự động
                       </div>
                       <div className="flex gap-3 items-center mb-3">
                         <img src={msg.product.images?.[0] || 'https://via.placeholder.com/150'} alt={msg.product.name} className="w-16 h-16 object-cover rounded-md border border-gray-100" />
                         <div className="flex-1">
                           <p className="font-bold text-gray-900 leading-tight mb-1">{msg.product.name}</p>
                           <p>Size: <b>{msg.rentNowData.size}</b></p>
                         </div>
                       </div>
                       
                       <div className="bg-gray-50 p-2 rounded-lg mb-3">
                         <p className="flex justify-between mb-1"><span>Thời gian:</span> <b>{formatDateNoHours(msg.rentNowData.startDate)} - {formatDateNoHours(msg.rentNowData.endDate)}</b></p>
                         <p className="flex justify-between"><span>Số ngày thuê:</span> <b>{getRentalDays(msg.rentNowData.startDate, msg.rentNowData.endDate)} ngày</b></p>
                       </div>

                       <div className="bg-gray-50 p-2 rounded-lg mb-3">
                         <p className="font-semibold text-gray-800 mb-1">Thông tin nhận hàng:</p>
                         <p>{(user?.addresses?.find(a => a.isDefault) || user?.addresses?.[0])?.receiverName || user?.fullName}</p>
                         <p>{(user?.addresses?.find(a => a.isDefault) || user?.addresses?.[0])?.receiverPhone || user?.phone}</p>
                         <p className="line-clamp-2 text-xs">{(user?.addresses?.find(a => a.isDefault) || user?.addresses?.[0]) ? `${(user?.addresses?.find(a => a.isDefault) || user?.addresses?.[0]).addressDetail}, ${(user?.addresses?.find(a => a.isDefault) || user?.addresses?.[0]).ward}, ${(user?.addresses?.find(a => a.isDefault) || user?.addresses?.[0]).district}, ${(user?.addresses?.find(a => a.isDefault) || user?.addresses?.[0]).province}` : "Nhận tại cửa hàng"}</p>
                       </div>

                       <div className="flex justify-between items-center mb-4 border-t border-gray-100 pt-3">
                         <span className="font-semibold text-gray-800">Tổng thanh toán:</span>
                         <span className="font-bold text-red-500 text-[15px]">
                           {((msg.product.pricePerDay || msg.product.price) * getRentalPriceFactor(getRentalDays(msg.rentNowData.startDate, msg.rentNowData.endDate)) + msg.product.deposit).toLocaleString('vi-VN')}đ
                         </span>
                       </div>

                       <div className="flex gap-2">
                         <button onClick={() => navigate('/checkout', { state: { buyNow: msg.rentNowData }})} className="flex-1 py-2 border border-gray-300 text-gray-700 font-bold text-xs rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-1">
                           <FontAwesomeIcon icon={faEdit} /> Chỉnh sửa
                         </button>
                         <button onClick={() => handleConfirmRent(msg.rentNowData)} className="flex-[1.5] py-2 bg-gradient-to-r from-[#d4af37] to-[#b8935a] text-white font-bold text-xs rounded-lg hover:brightness-110 shadow-md transition-all flex items-center justify-center gap-1">
                           <FontAwesomeIcon icon={faCheckCircle} /> T.Toán Ngay
                         </button>
                       </div>
                    </div>
                  ) : msg.product && (
                    <div className="mt-4 p-3 bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col items-center transform hover:scale-[1.02] transition-transform duration-200">
                       <img src={msg.product.images?.[0] || 'https://via.placeholder.com/150'} alt={msg.product.name} className="w-28 h-28 object-cover rounded-lg mb-3 shadow-sm border border-gray-50" />
                       <span className="font-semibold text-sm text-center mb-1.5 leading-snug">{msg.product.name}</span>
                       <span className="text-red-500 font-bold text-[15px] mb-3">{(msg.product.pricePerDay || msg.product.price).toLocaleString('vi-VN')}đ/ngày</span>
                       <a href={`/product/${msg.product._id}`} className="w-full py-2.5 bg-gray-900 text-white text-xs font-bold rounded-lg hover:bg-black transition-colors text-center block shadow-md">
                          Xem & Đặt thuê
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
            <div className="relative flex items-center">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Nhập câu hỏi của bạn..."
                className="w-full outline-none pl-5 pr-14 py-3 text-sm bg-gray-50 hover:bg-gray-100 transition-colors rounded-full border border-gray-200 focus:border-[#c9a869] focus:ring-1 focus:ring-[#c9a869] focus:bg-white"
                disabled={isLoading}
              />
              <button 
                type="submit" 
                className="absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 bg-gradient-to-r from-[#d4af37] to-[#b8935a] text-white rounded-full hover:brightness-110 disabled:opacity-50 flex items-center justify-center transition-all shadow-md transform active:scale-95"
                disabled={isLoading || !input.trim()}
              >
                <FontAwesomeIcon icon={faPaperPlane} className="text-[14px] -ml-0.5" />
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
        <div className="relative flex items-center justify-end group cursor-pointer" onClick={toggleChat}>
          {/* Animated Text Bubble */}
          <div className="absolute right-[calc(100%+12px)] opacity-0 translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 ease-out pointer-events-none z-10 whitespace-nowrap">
            <div className="bg-white px-4 py-2.5 rounded-2xl rounded-tr-sm shadow-[0_5px_15px_rgba(201,168,105,0.2)] border border-[#c9a869]/20 text-[#2e2a22] font-semibold text-[13px] flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_5px_#4ade80]"></span>
              Nếu cần mình giúp đỡ hãy báo cho mình biết nhé!
            </div>
          </div>

          <button 
            className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-[0_8px_30px_rgb(201,168,105,0.3)] transition-all duration-300 transform group-hover:-translate-y-1 group-hover:shadow-[0_12px_40px_rgba(201,168,105,0.4)] relative border-2 border-[#c9a869] overflow-hidden p-0.5 z-20 shrink-0"
          >
            <img src={chatbotIcon} className="w-full h-full rounded-full transition-transform duration-300 object-cover" alt="Chatbot" />
          </button>
        </div>
      )}
    </div>
  );
};

export default ChatWidget;
