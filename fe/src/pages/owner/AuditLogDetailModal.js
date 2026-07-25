import React from 'react';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faUserCheck } from "@fortawesome/free-solid-svg-icons";
import { formatDate } from "../../utils/formatters";

const DAMAGE_TIERS = {
  none: "Bình thường hoặc bẩn nhẹ",
  heavy_stain: "Bẩn nặng, ố khó tẩy",
  minor_damage: "Hư nhẹ, sửa được",
  major_damage: "Hư nặng, không phục hồi",
  total_loss: "Mất trang phục hoặc hư hỏng toàn bộ"
};

export default function AuditLogDetailModal({ log, onClose }) {
  if (!log) return null;

  const getDamageText = (tier, percent) => {
    if (tier === 'none') return "Không hư hỏng (0%)";
    return `${DAMAGE_TIERS[tier] || tier} (${percent}%)`;
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-[900px] max-h-[85vh] flex flex-col md:flex-row overflow-hidden shadow-2xl relative">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-black flex items-center justify-center transition-colors"
        >
          <FontAwesomeIcon icon={faTimes} />
        </button>

        {/* LEFT SIDE: Order Details Summary */}
        <div className="w-full md:w-[45%] bg-[#faf9f7] border-r border-[#eaeaea] p-6 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300">
          <h2 className="text-xl font-bold text-[#1a1a1a] mb-6" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            Đơn Hàng #{log._id?.slice(-6).toUpperCase()}
          </h2>
          
          <div className="space-y-6">
            <div className="bg-white p-4 rounded-xl border border-[#eaeaea] shadow-sm">
              <h3 className="font-bold text-[#1a1a1a] mb-3 text-sm uppercase tracking-wider">Thông tin khách hàng</h3>
              <p className="text-sm mb-1"><span className="text-gray-500 w-20 inline-block">Tên:</span> <strong>{log.shippingAddress?.receiverName || log.customerId?.fullName || "Khách vãng lai"}</strong></p>
              <p className="text-sm mb-1"><span className="text-gray-500 w-20 inline-block">SĐT:</span> <strong>{log.shippingAddress?.receiverPhone || log.customerId?.phone || ""}</strong></p>
              <p className="text-sm flex"><span className="text-gray-500 w-20 shrink-0">Email:</span> <span className="flex-1">{log.customerId?.email || "Không có"}</span></p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-[#eaeaea] shadow-sm">
              <h3 className="font-bold text-[#1a1a1a] mb-3 text-sm uppercase tracking-wider">Sản phẩm thuê</h3>
              <div className="space-y-3">
                {log.items?.map((item, idx) => (
                  <div key={idx} className="flex gap-3 pb-3 border-b border-gray-100 last:border-0 last:pb-0">
                    <img src={item.costume?.images?.[0] || 'https://via.placeholder.com/60'} alt={item.costume?.name} className="w-16 h-16 object-cover rounded-lg border border-gray-200" />
                    <div className="flex-1">
                      <p className="font-semibold text-sm text-[#1a1a1a] line-clamp-1">{item.costume?.name}</p>
                      <p className="text-xs text-gray-500 mb-1">Size: {item.size} x{item.quantity}</p>
                      <p className="text-xs font-medium">Cọc: <span className="text-[#b8935a]">{(item.costume?.deposit || item.deposit || 0).toLocaleString('vi-VN')} đ</span></p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-xl border border-[#eaeaea] shadow-sm">
              <h3 className="font-bold text-[#1a1a1a] mb-3 text-sm uppercase tracking-wider">Tài chính đơn hàng</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Tiền thuê:</span> <strong>{(log.totalRentalPrice || 0).toLocaleString('vi-VN')} đ</strong></div>
                <div className="flex justify-between"><span className="text-gray-500">Tiền cọc ban đầu:</span> <strong className="text-[#b8935a]">{(log.totalDeposit || 0).toLocaleString('vi-VN')} đ</strong></div>
                <div className="flex justify-between mt-1"><span className="text-gray-800 font-bold">Tổng đã thu:</span> <strong className="text-red-500">{(log.totalAmount || 0).toLocaleString('vi-VN')} đ</strong></div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE: Inspection Details */}
        <div className="w-full md:w-[55%] p-6 md:p-8 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 bg-white flex flex-col relative">
          <h1 className="text-2xl font-bold text-[#1a1a1a] mb-1" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            Kết Quả Kiểm Tra Trả Đồ
          </h1>
          
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-6 bg-gray-50 p-3 rounded-lg border border-gray-100">
            <FontAwesomeIcon icon={faUserCheck} className="text-purple-500" />
            <span>Người kiểm tra: <strong>{log.inspectedBy?.fullName || log.inspectedBy?.email || "N/A"}</strong></span>
          </div>

          <div className="space-y-6 flex-1">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Ngày dự kiến trả</p>
                <p className="font-semibold text-gray-800">{formatDate(log.endDate)}</p>
              </div>
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                <p className="text-xs text-blue-600 uppercase tracking-wider mb-1">Ngày trả thực tế</p>
                <p className="font-semibold text-blue-900">{log.actualReturnDate ? formatDate(log.actualReturnDate) : '-'}</p>
              </div>
            </div>

            <div>
              <h3 className="font-bold text-[#1a1a1a] mb-2 text-sm uppercase tracking-wider">Đánh giá hư hỏng</h3>
              <div className="bg-[#faf9f7] border border-[#eaeaea] rounded-xl p-4">
                <p className="font-semibold text-gray-800 text-base">{getDamageText(log.damageTier, log.damagePercent)}</p>
                {log.missingNotes && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-xs text-gray-500 mb-1">Ghi chú của nhân viên:</p>
                    <p className="text-sm text-gray-700 italic bg-white p-3 rounded border border-gray-100">"{log.missingNotes}"</p>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="font-bold text-[#1a1a1a] mb-2 text-sm uppercase tracking-wider">Chi phí phát sinh & Hoàn tiền</h3>
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <div className="p-4 space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Phí phạt trễ hạn:</span>
                    <span className="font-medium text-orange-600">{(log.lateFee || 0).toLocaleString('vi-VN')} đ</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Phí đền bù hư hỏng:</span>
                    <span className="font-medium text-red-600">{(log.damageFee || 0).toLocaleString('vi-VN')} đ</span>
                  </div>
                  {log.replacementFee > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Phí bồi thường vượt cọc:</span>
                      <span className="font-medium text-red-600">{(log.replacementFee || 0).toLocaleString('vi-VN')} đ</span>
                    </div>
                  )}
                </div>
                <div className="bg-gray-50 p-4 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-gray-800">Số tiền hoàn trả (Refund):</span>
                    <span className="font-extrabold text-xl text-emerald-600">{(log.refundAmount || 0).toLocaleString('vi-VN')} đ</span>
                  </div>
                </div>
              </div>
            </div>

            {log.evidence && log.evidence.length > 0 && (
              <div>
                <h3 className="font-bold text-[#1a1a1a] mb-2 text-sm uppercase tracking-wider">Hình ảnh/Video bằng chứng</h3>
                <div className="flex flex-wrap gap-3">
                  {log.evidence.map((url, i) => (
                    <a key={i} href={url} target="_blank" rel="noreferrer" className="w-20 h-20 rounded-lg overflow-hidden border border-gray-200 bg-gray-50 shadow-sm block hover:opacity-90 transition-opacity">
                      {/\.(mp4|mov|webm)(\?|$)/i.test(url)
                        ? <div className="w-full h-full flex flex-col items-center justify-center text-[10px] text-gray-500 font-semibold bg-gray-100">
                            <span className="text-lg">▶</span>
                            <span>Video</span>
                          </div>
                        : <img src={url} alt={`evidence ${i}`} className="w-full h-full object-cover" />
                      }
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end">
             <button
                onClick={onClose}
                className="px-6 py-2.5 bg-[#1a1a1a] text-white rounded-xl text-sm font-bold hover:bg-black transition-colors shadow"
              >
                Đóng
              </button>
          </div>
        </div>
      </div>
    </div>
  );
}
