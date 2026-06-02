import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus, faSearch, faEdit, faTrash,
  faUserShield, faUserTie, faUser,
} from "@fortawesome/free-solid-svg-icons";
import { useMemo, useState, useEffect } from "react";
import Button from "../../components/ui/Button";
import DataTable from "../../components/ui/DataTable";
import Pagination from "../../components/ui/Pagination";
import { useNavigate } from "react-router-dom";

const getRoleInfo = (roleName) => {
  const name = roleName?.toLowerCase();
  if (name === "owner") return { label: "Owner", color: "bg-purple-100 text-purple-700", icon: faUserShield };
  if (name === "staff") return { label: "Staff", color: "bg-primary-100 text-primary-700", icon: faUserTie }; // ← blue → primary
  if (name === "customer") return { label: "Online Customer", color: "bg-gray-100 text-gray-700", icon: faUser };

  return { label: "Unknown", color: "bg-surface text-gray-700", icon: faUser };
};

const getStatusInfo = (statusName) => {
  const name = statusName?.toLowerCase();
  if (name === "active") return { label: "Active", color: "bg-success-50 text-success-600", dot: "bg-success-500" };
  if (name === "pending") return { label: "Pending", color: "bg-warning-50 text-warning-600", dot: "bg-warning-500" };
  if (name === "blocked") return { label: "Blocked", color: "bg-red-50 text-red-600", dot: "bg-red-500" };
  return { label: "Unknown", color: "bg-gray-50 text-gray-600", dot: "bg-gray-500" };
};

const PAGE_SIZE = 10;

export default function AccountsPage() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();
  const getAccounts = async () => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const response = await fetch("http://localhost:9999/api/users/get-users", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (!response.ok) { setError(data.message); return; }
      setAccounts(data.users);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { getAccounts(); }, []);

  useEffect(() => { setCurrentPage(1); }, [search, filterRole, filterStatus]);

  const filteredAccounts = useMemo(() => {
    return accounts.filter((acc) => {
      const matchSearch =
        acc.fullName?.toLowerCase().includes(search.toLowerCase()) ||
        acc.email?.toLowerCase().includes(search.toLowerCase());
      const matchRole =
        filterRole === "all" ||
        acc?.role?.toLowerCase() === filterRole.toLowerCase();
      const matchStatus =
        filterStatus === "all" ||
        acc.status?.toLowerCase() === filterStatus.toLowerCase();
      return matchSearch && matchRole && matchStatus;
    });
  }, [accounts, search, filterRole, filterStatus]);

  const paginatedAccounts = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredAccounts.slice(start, start + PAGE_SIZE);
  }, [filteredAccounts, currentPage]);

  const totalPages = Math.ceil(filteredAccounts.length / PAGE_SIZE);

  const handleEdit = (user) => {
    navigate(`/owner/accounts/detail-account/${user.id}`)}
  const handleDelete = (user) => console.log("Deleting:", user);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-gray-900">
            Account Management
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Manage user information and system permissions
          </p>
        </div>
        <div><Button
          icon={faPlus}
          label="Add Account"
          variant="primary"
          onClick={() => console.log("Open Add Modal")}
        /></div>

      </div>

      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <FontAwesomeIcon
            icon={faSearch}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
          />
        </div>

        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="w-full md:w-48 px-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 text-sm bg-white text-gray-700"
        >
          <option value="all">All Roles</option>
          <option value="owner">Owner</option>
          <option value="staff">Staff</option>
          <option value="customer">Online Customer</option>
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="w-full md:w-48 px-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 text-sm bg-white text-gray-700"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="pending">Pending</option>
          <option value="blocked">Blocked</option>
        </select>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl border border-red-100">
          {error}
        </div>
      )}

      <DataTable
        isLoading={loading}
        isEmpty={!loading && filteredAccounts.length === 0}
        emptyMessage="No matching accounts found."
        footer={
          <Pagination
            displayCount={paginatedAccounts.length}
            totalCount={filteredAccounts.length}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        }
      >
        <thead>
          <tr className="border-border border-gray-100 bg-gray-50/50">
            <th className="w-[35%] py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
            <th className="w-[20%] py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
            <th className="w-[15%] py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
            <th className="w-[15%] py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Join Date</th>
            <th className="w-[15%] py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
          </tr>
        </thead>
        <tbody>

          {paginatedAccounts.map((acc) => {
            const roleInfo = getRoleInfo(acc.role);
            const statusInfo = getStatusInfo(acc.status);
            return (
              <tr key={acc.id} className="border-border border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="py-4 px-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-bold text-sm shrink-0">
                      {acc.fullName?.charAt(0).toUpperCase() || "?"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-800 truncate">{acc.fullName}</p>
                      <p className="text-xs text-gray-500 truncate">{acc.email}</p>
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
                    <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dot}`} />
                    {statusInfo.label}
                  </span>
                </td>

                <td className="py-4 px-6 text-sm text-gray-600 whitespace-nowrap">
                  {acc.createdAt ? new Date(acc.createdAt).toLocaleDateString("en-GB") : "N/A"}
                </td>

                <td className="py-4 px-6 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleEdit(acc)}
                      className="w-8 h-8 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 flex items-center justify-center transition-colors"
                      title="Edit"
                    >
                      <FontAwesomeIcon icon={faEdit} className="text-sm" />
                    </button>
                    <button
                      onClick={() => handleDelete(acc)}
                      className="w-8 h-8 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 flex items-center justify-center transition-colors"
                      title="Delete"
                    >
                      <FontAwesomeIcon icon={faTrash} className="text-sm" />
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