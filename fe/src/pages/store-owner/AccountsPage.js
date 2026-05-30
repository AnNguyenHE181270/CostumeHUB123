import { useState, useMemo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faSearch,
  faEdit,
  faTrash,
  faEllipsisV,
  faUserShield,
  faUserTie,
  faUser,
} from "@fortawesome/free-solid-svg-icons";

// --- MOCK DATA ---
const mockAccounts = [
  { id: 1, name: "Nguyễn Văn Owner", email: "owner@luxerent.com", role: "owner", status: "active", joinDate: "12/01/2023" },
  { id: 2, name: "Trần Thị Lễ Tân", email: "letan@luxerent.com", role: "receptionist", status: "active", joinDate: "05/03/2023" },
  { id: 3, name: "Lê Văn Khách", email: "khach@gmail.com", role: "customer", status: "active", joinDate: "20/06/2023" },
  { id: 4, name: "Phạm Thị Nghỉ", email: "nghiphep@luxerent.com", role: "receptionist", status: "inactive", joinDate: "15/08/2023" },
  { id: 5, name: "Hoàng Văn Khách 2", email: "hoangkhach@yahoo.com", role: "customer", status: "banned", joinDate: "01/10/2023" },
];

// --- HELPER FUNCTIONS ---
const getRoleInfo = (role) => {
  switch (role) {
    case "owner": return { label: "Chủ cửa hàng", color: "bg-purple-100 text-purple-700", icon: faUserShield };
    case "receptionist": return { label: "Lễ tân", color: "bg-blue-100 text-blue-700", icon: faUserTie };
    case "customer": return { label: "Khách hàng", color: "bg-gray-100 text-gray-700", icon: faUser };
    default: return { label: "Unknown", color: "bg-gray-100 text-gray-700", icon: faUser };
  }
};

const getStatusInfo = (status) => {
  switch (status) {
    case "active": return { label: "Hoạt động", color: "bg-green-50 text-green-600" };
    case "inactive": return { label: "Nghỉ phép", color: "bg-yellow-50 text-yellow-600" };
    case "banned": return { label: "Bị khóa", color: "bg-red-50 text-red-600" };
    default: return { label: "Unknown", color: "bg-gray-50 text-gray-600" };
  }
};

export default function AccountsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  // Logic lọc dữ liệu
  const filteredAccounts = useMemo(() => {
    return mockAccounts.filter((acc) => {
      const matchSearch = acc.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          acc.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchRole = filterRole === "all" || acc.role === filterRole;
      const matchStatus = filterStatus === "all" || acc.status === filterStatus;
      return matchSearch && matchRole && matchStatus;
    });
  }, [searchTerm, filterRole, filterStatus]);

  return (
    <div className="space-y-6">
      
      {/* === 1. HEADER === */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-gray-900">Quản lý Tài khoản</h2>
          <p className="text-gray-500 text-sm mt-1">Quản lý thông tin và quyền hạn của người dùng hệ thống</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-2.5 px-5 font-medium flex items-center justify-center gap-2 transition-colors shadow-sm shrink-0">
          <FontAwesomeIcon icon={faPlus} className="text-sm" />
          <span>Thêm tài khoản</span>
        </button>
      </div>

      {/* === 2. FILTER BAR (Bento Card Style) === */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <FontAwesomeIcon icon={faSearch} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
          <input
            type="text"
            placeholder="Tìm theo tên hoặc email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
        </div>
        
        <select 
          value={filterRole} 
          onChange={(e) => setFilterRole(e.target.value)}
          className="w-full md:w-48 px-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white text-gray-700"
        >
          <option value="all">Tất cả vai trò</option>
          <option value="owner">Chủ cửa hàng</option>
          <option value="receptionist">Lễ tân</option>
          <option value="customer">Khách hàng</option>
        </select>

        <select 
          value={filterStatus} 
          onChange={(e) => setFilterStatus(e.target.value)}
          className="w-full md:w-48 px-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white text-gray-700"
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="active">Hoạt động</option>
          <option value="inactive">Nghỉ phép</option>
          <option value="banned">Bị khóa</option>
        </select>
      </div>

      {/* === 3. TABLE (Bento Card Style) === */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Người dùng</th>
                <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Vai trò</th>
                <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Trạng thái</th>
                <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Ngày tham gia</th>
                <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {filteredAccounts.length > 0 ? (
                filteredAccounts.map((acc) => {
                  const roleInfo = getRoleInfo(acc.role);
                  const statusInfo = getStatusInfo(acc.status);
                  
                  return (
                    <tr key={acc.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          {/* Avatar Placeholder */}
                          <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
                            {acc.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-800">{acc.name}</p>
                            <p className="text-xs text-gray-500">{acc.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${roleInfo.color}`}>
                          <FontAwesomeIcon icon={roleInfo.icon} className="text-[10px]" />
                          {roleInfo.label}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${acc.status === 'active' ? 'bg-green-500' : acc.status === 'inactive' ? 'bg-yellow-500' : 'bg-red-500'}`}></span>
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-600">{acc.joinDate}</td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button className="w-8 h-8 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 flex items-center justify-center transition-colors" title="Chỉnh sửa">
                            <FontAwesomeIcon icon={faEdit} className="text-sm" />
                          </button>
                          <button className="w-8 h-8 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 flex items-center justify-center transition-colors" title="Xóa">
                            <FontAwesomeIcon icon={faTrash} className="text-sm" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="5" className="text-center py-12 text-gray-400 text-sm">
                    Không tìm thấy tài khoản nào phù hợp.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Placeholder */}
        <div className="p-4 border-t border-gray-100 flex items-center justify-between">
          <p className="text-sm text-gray-500">Hiển thị <span className="font-medium">{filteredAccounts.length}</span> trong <span className="font-medium">{mockAccounts.length}</span> kết quả</p>
          <div className="flex items-center gap-1">
            <button className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50">Trước</button>
            <button className="px-3 py-1.5 text-sm rounded-lg bg-blue-600 text-white shadow-sm">1</button>
            <button className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50">Sau</button>
          </div>
        </div>
      </div>
      
    </div>
  );
}