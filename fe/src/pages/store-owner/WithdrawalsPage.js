import React, { useState, useEffect } from 'react';
import paymentService from '../../services/payment.service';
import { faCheck, faTimes, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Button from '../../components/ui/Button';

export default function WithdrawalsPage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  const fetchWithdrawals = async () => {
    try {
      setLoading(true);
      const res = await paymentService.getAllTransactions();
      if (res.success) {
        // Lọc ra các transaction rút tiền (WITHDRAW)
        const withdraws = res.data.filter(t => t.type === 'WITHDRAW');
        setTransactions(withdraws);
      }
    } catch (err) {
      console.error(err);
      setError('Không thể tải danh sách giao dịch');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (transactionId, status) => {
    if (!window.confirm(`Bạn chắc chắn muốn chuyển trạng thái yêu cầu này thành ${status === 'success' ? 'Đã duyệt' : 'Từ chối'}?`)) {
      return;
    }

    try {
      setProcessingId(transactionId);
      const res = await paymentService.updateWithdrawStatus(transactionId, status);
      if (res.success) {
        alert('Cập nhật thành công');
        fetchWithdrawals(); // refresh list
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">Đang xử lý</span>;
      case 'success':
        return <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">Đã duyệt</span>;
      case 'failed':
        return <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">Đã từ chối</span>;
      default:
        return <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">{status}</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <FontAwesomeIcon icon={faSpinner} spin className="text-3xl text-gray-400" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-lg">
          {error}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="py-4 px-4 font-semibold text-gray-700">Mã giao dịch</th>
              <th className="py-4 px-4 font-semibold text-gray-700">Người dùng</th>
              <th className="py-4 px-4 font-semibold text-gray-700">Số tiền</th>
              <th className="py-4 px-4 font-semibold text-gray-700">Ngân hàng</th>
              <th className="py-4 px-4 font-semibold text-gray-700">Trạng thái</th>
              <th className="py-4 px-4 font-semibold text-gray-700 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {transactions.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-8 text-center text-gray-500">
                  Không có yêu cầu rút tiền nào.
                </td>
              </tr>
            ) : (
              transactions.map((t) => (
                <tr key={t._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-4 text-sm font-mono text-gray-600">
                    {t.orderCode}
                    <div className="text-xs text-gray-400 mt-1">
                      {new Date(t.createdAt).toLocaleString('vi-VN')}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="font-medium text-gray-900">{t.user?.fullName || 'N/A'}</div>
                    <div className="text-sm text-gray-500">{t.user?.email || 'N/A'}</div>
                  </td>
                  <td className="py-4 px-4 font-semibold text-red-600">
                    -{t.amount.toLocaleString('vi-VN')}đ
                  </td>
                  <td className="py-4 px-4">
                    <div className="text-sm">
                      <span className="font-semibold">{t.bankName}</span>
                      <div>STK: {t.accountNumber}</div>
                      <div>Tên: {t.accountName}</div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    {getStatusBadge(t.status)}
                  </td>
                  <td className="py-4 px-4 text-right">
                    {t.status === 'pending' && (
                      <div className="flex items-center justify-end space-x-2">
                        <Button
                          variant="primary"
                          onClick={() => handleUpdateStatus(t._id, 'success')}
                          disabled={processingId === t._id}
                          className="!px-3 !py-1.5 !text-sm flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white"
                        >
                          {processingId === t._id ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faCheck} />}
                          Duyệt
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleUpdateStatus(t._id, 'failed')}
                          disabled={processingId === t._id}
                          className="!px-3 !py-1.5 !text-sm flex items-center gap-1 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                        >
                          {processingId === t._id ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faTimes} />}
                          Từ chối
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
