import React, { useState, useEffect } from 'react';
import Toast from '../../components/ui/Toast';
import rentalService from '../../services/rental.service';
import AuditLogDetailModal from './AuditLogDetailModal';

const AuditLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ isVisible: false, message: '', type: 'success' });
  const [selectedLog, setSelectedLog] = useState(null);

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      // Fetch all orders and filter those with inspectedBy
      const orders = await rentalService.getAllOrders();
      const auditLogs = orders.filter(o => o.inspectedBy && o.status === 'completed');
      setLogs(auditLogs);
    } catch (err) {
      console.error(err);
      setToast({ isVisible: true, message: 'Lỗi khi tải nhật ký kiểm tra hàng', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-6 text-center text-gray-500">Đang tải dữ liệu...</div>;

  return (
    <div className="p-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-800">Nhật ký kiểm tra đồ trả</h2>
          <p className="text-sm text-gray-500 mt-1">Lịch sử nhân viên kiểm tra hàng khi khách trả đồ</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                <th className="p-4 font-semibold border-b">Mã đơn</th>
                <th className="p-4 font-semibold border-b">Khách hàng</th>
                <th className="p-4 font-semibold border-b">Ngày trả thực tế</th>
                <th className="p-4 font-semibold border-b">Mức độ hư hỏng</th>
                <th className="p-4 font-semibold border-b">Tiền đền bù</th>
                <th className="p-4 font-semibold border-b">Nhân viên kiểm tra</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-gray-100">
              {logs.length > 0 ? logs.map(log => (
                <tr 
                  key={log._id} 
                  className="hover:bg-gray-50/50 transition-colors cursor-pointer"
                  onClick={() => setSelectedLog(log)}
                >
                  <td className="p-4">
                    <span className="font-mono text-blue-600 font-medium">#{log._id?.slice(-6).toUpperCase()}</span>
                  </td>
                  <td className="p-4">
                    <div className="font-medium text-gray-900">{log.customerId?.fullName || 'Khách vãng lai'}</div>
                    <div className="text-xs text-gray-500">{log.customerId?.email}</div>
                  </td>
                  <td className="p-4 text-gray-600">
                    {log.actualReturnDate ? new Date(log.actualReturnDate).toLocaleDateString('vi-VN') : '-'}
                  </td>
                  <td className="p-4">
                    {log.damageTier === 'none' ? <span className="text-green-600">Bình thường</span>
                      : log.damageTier === 'minor' ? <span className="text-yellow-600">Hư hỏng nhẹ ({log.damagePercent}%)</span>
                      : log.damageTier === 'major' ? <span className="text-orange-600">Hư hỏng nặng ({log.damagePercent}%)</span>
                      : log.damageTier === 'total_loss' ? <span className="text-red-600">Mất/Hư hỏng toàn bộ</span>
                      : '-'}
                  </td>
                  <td className="p-4 font-medium text-red-600">
                    {((log.damageFee || 0) + (log.replacementFee || 0)).toLocaleString('vi-VN')} đ
                  </td>
                  <td className="p-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-100">
                      <span className="font-semibold text-xs">{log.inspectedBy?.fullName || log.inspectedBy?.email}</span>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-gray-500">
                    Chưa có nhật ký kiểm tra hàng nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {selectedLog && (
        <AuditLogDetailModal
          log={selectedLog}
          onClose={() => setSelectedLog(null)}
        />
      )}

      <Toast 
        isVisible={toast.isVisible} 
        message={toast.message} 
        type={toast.type} 
        onClose={() => setToast(prev => ({ ...prev, isVisible: false }))} 
      />
    </div>
  );
};

export default AuditLogsPage;
