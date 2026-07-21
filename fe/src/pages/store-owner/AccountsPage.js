import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus, faEdit,
  faUserShield, faUserTie, faUser,
} from "@fortawesome/free-solid-svg-icons";
import { useMemo, useState, useEffect } from "react";
import Button from "../../components/ui/Button";
import SearchInput from "../../components/ui/SearchInput";
import DataTable from "../../components/ui/DataTable";
import Pagination from "../../components/ui/Pagination";
import { useNavigate } from "react-router-dom";
import userService from "../../services/user.service";

// Đã Việt hóa các Label
const getRoleInfo = (roleName) => {
  const name = roleName?.toLowerCase();
  if (name === "owner") return { label: "Chủ cửa hàng", color: "bg-purple-100 text-purple-700", icon: faUserShield };
  if (name === "staff") return { label: "Nhân viên", color: "bg-[#eaeaea] text-[#1a1a1a]", icon: faUserTie };
  if (name === "online-customer") return { label: "Khách hàng", color: "bg-gray-100 text-[#555]", icon: faUser };

  return { label: "Chưa rõ", color: "bg-surface text-[#555]", icon: faUser };
};

const getStatusInfo = (statusName) => {
  const name = statusName?.toLowerCase();
  if (name === "active") return { label: "Hoạt động", color: "bg-success-50 text-success-600", dot: "bg-success-500" };
  if (name === "pending") return { label: "Chờ xử lý", color: "bg-warning-50 text-warning-600", dot: "bg-warning-500" };
  if (name === "blocked") return { label: "Đã khóa", color: "bg-red-50 text-red-600", dot: "bg-red-500" };
  return { label: "Chưa rõ", color: "bg-[#faf9f7] text-[#555]", dot: "bg-gray-500" };
};

const PAGE_SIZE = 10;

export default function AccountsPage() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, filterRole, filterStatus]);

  useEffect(() => {
    const getAccounts = async () => {
      try {
        setLoading(true);
        setError("");
        const params = {
          page: currentPage,
          limit: PAGE_SIZE,
        };
        if (debouncedSearch) params.search = debouncedSearch;
        if (filterRole !== "all") params.role = filterRole;
        if (filterStatus !== "all") params.status = filterStatus;

        const data = await userService.getAllUsers(params);
        setAccounts(data.users || []);
        setTotalPages(data.totalPages || 1);
        setTotalCount(data.totalUsers || 0);
      } catch (err) {
        setError(err.message || "Lỗi kết nối. Vui lòng thử lại.");
      } finally {
        setLoading(false);
      }
    };

    getAccounts();
  }, [currentPage, debouncedSearch, filterRole, filterStatus]);

  const handleEdit = (user) => {
    navigate(`/owner/accounts/detail-account/${user.id}`);
  };

  return (
    <div className="space-y-6">

      <div className="flex flex-col md:flex-row items-center gap-4">
        <SearchInput
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm kiếm theo tên hoặc email..."
        />

        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="w-full md:w-48 px-4 py-2.5 border border-[#eaeaea] rounded-xl outline-none focus:ring-2 focus:ring-[#1a1a1a] text-sm bg-white text-[#555]"
        >
          <option value="all">Tất cả vai trò</option>
          <option value="owner">Chủ cửa hàng</option>
          <option value="staff">Nhân viên</option>
          <option value="online-customer">Khách hàng</option>
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="w-full md:w-48 px-4 py-2.5 border border-[#eaeaea] rounded-xl outline-none focus:ring-2 focus:ring-[#1a1a1a] text-sm bg-white text-[#555]"
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="active">Hoạt động (Active)</option>
          <option value="pending">Chờ xử lý (Pending)</option>
          <option value="blocked">Đã khóa (Blocked)</option>
        </select>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl border border-red-100">
          {error}
        </div>
      )}

      <DataTable
        isLoading={loading}
        isEmpty={!loading && accounts.length === 0}
        emptyMessage="Không tìm thấy tài khoản nào phù hợp."
        footer={
          <Pagination
            displayCount={accounts.length}
            totalCount={totalCount}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        }
      >
        <thead>
          <tr className="border-border border-[#f0f0f0] bg-gray-50/50">
            <th className="w-[35%] py-4 px-6 text-xs font-semibold text-[#999] uppercase tracking-wider text-left">Người Dùng</th>
            <th className="w-[20%] py-4 px-6 text-xs font-semibold text-[#999] uppercase tracking-wider text-left">Vai Trò</th>
            <th className="w-[15%] py-4 px-6 text-xs font-semibold text-[#999] uppercase tracking-wider text-left">Trạng Thái</th>
            <th className="w-[15%] py-4 px-6 text-xs font-semibold text-[#999] uppercase tracking-wider text-left">Ngày Tham Gia</th>
            <th className="w-[15%] py-4 px-6 text-xs font-semibold text-[#999] uppercase tracking-wider text-right">Thao Tác</th>
          </tr>
        </thead>
        <tbody>
          {accounts.map((acc) => {
            const roleInfo = getRoleInfo(acc.role);
            const statusInfo = getStatusInfo(acc.status);
            return (
              <tr key={acc.id} className="border-border border-gray-50 hover:bg-[#faf9f7] transition-colors">
                <td className="py-4 px-6 text-left">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#eaeaea] text-[#1a1a1a] flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden border border-[#eaeaea]">
                      {acc.avatar ? (
                        <img src={acc.avatar} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        acc.fullName ? acc.fullName.charAt(0).toUpperCase() : "U"
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-[#1a1a1a] truncate">{acc.fullName || "N/A"}</p>
                      <p className="text-xs text-[#999] truncate">{acc.email}</p>
                    </div>
                  </div>
                </td>

                <td className="py-4 px-6 text-left">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${roleInfo.color}`}>
                    <FontAwesomeIcon icon={roleInfo.icon} className="text-[10px]" />
                    {roleInfo.label}
                  </span>
                </td>

                <td className="py-4 px-6 text-left">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dot}`} />
                    {statusInfo.label}
                  </span>
                </td>

                <td className="py-4 px-6 text-sm text-[#555] whitespace-nowrap text-left">
                  {acc.createdAt ? new Date(acc.createdAt).toLocaleDateString("vi-VN") : "N/A"}
                </td>

                <td className="py-4 px-6 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleEdit(acc)}
                      className="w-8 h-8 rounded-lg hover:bg-[#eaeaea] text-[#999] hover:text-[#1a1a1a] flex items-center justify-center transition-colors"
                      title="Chỉnh sửa"
                    >
                      <FontAwesomeIcon icon={faEdit} className="text-sm" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </DataTable>
    </div>
  );
}