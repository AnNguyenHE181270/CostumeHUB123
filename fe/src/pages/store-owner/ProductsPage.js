import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faEdit, faEyeSlash, faEye, faSearch } from "@fortawesome/free-solid-svg-icons";
import Button from "../../components/ui/Button";
import DataTable from "../../components/ui/DataTable";
import Pagination from "../../components/ui/Pagination";
import ProductFormModal from "../../components/store-owner/ProductFormModal";
import ConfirmModal from "../../components/ui/ConfirmModal";
import Toast from "../../components/ui/Toast";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:9999";

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filterCategory, setFilterCategory] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalItems: 0, limit: 10 });

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null); // 'add', 'edit', 'delete', 'restore', 'change_status'
  const [pendingData, setPendingData] = useState(null);

  const [toast, setToast] = useState({ isVisible: false, message: "", type: "success" });
  const showToast = (message, type = "success") => {
    setToast({ isVisible: true, message, type });
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterCategory) params.set("categoryId", filterCategory);
      if (filterStatus) {
        params.set("status", filterStatus);
      } else {
        // Fetch all including hidden
        params.set("status", "all");
      }
      if (searchQuery) params.set("search", searchQuery);
      params.set("page", page.toString());
      params.set("limit", "10");

      const response = await fetch(`${API_URL}/api/costumes?${params}`);
      const data = await response.json();
      if (response.ok) {
        setProducts(data.costumes || []);
        if (data.pagination) {
          setPagination(data.pagination);
        }
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_URL}/api/categories?all=true`);
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories || []);
      } else {
        console.error("Failed to fetch categories");
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [filterCategory, filterStatus, searchQuery, page]);

  useEffect(() => {
    fetchCategories();
  }, []);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchQuery(searchInput);
      setPage(1); // Reset to first page on search
    }, 500);
    return () => clearTimeout(handler);
  }, [searchInput]);

  const handleOpenAddForm = () => {
    setEditingProduct(null);
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (product) => {
    setEditingProduct(product);
    setIsFormOpen(true);
  };

  const handleFormSubmit = (data) => {
    setPendingData(data);
    setConfirmAction(editingProduct ? 'edit' : 'add');
    setIsFormOpen(false); 
    setIsConfirmOpen(true);
  };

  const handleDeleteClick = (product) => {
    setPendingData(product);
    setConfirmAction('delete');
    setIsConfirmOpen(true);
  };

  const handleRestoreClick = (product) => {
    setPendingData(product);
    setConfirmAction('restore');
    setIsConfirmOpen(true);
  };

  const handleStatusChangeClick = (product, newStatus) => {
    setPendingData({ product, newStatus });
    setConfirmAction('change_status');
    setIsConfirmOpen(true);
  };

  const executeAdd = async (data) => {
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/costumes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        fetchProducts();
        showToast("Thêm sản phẩm thành công!");
      } else {
        const err = await response.json();
        showToast(err.message || "Thêm sản phẩm thất bại", "error");
      }
    } catch (error) {
      console.error(error);
      showToast("Lỗi hệ thống", "error");
    }
  };

  const executeEdit = async (data) => {
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/costumes/${editingProduct._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        fetchProducts();
        showToast("Cập nhật sản phẩm thành công!");
      } else {
        const err = await response.json();
        showToast(err.message || "Cập nhật sản phẩm thất bại", "error");
      }
    } catch (error) {
      console.error(error);
      showToast("Lỗi hệ thống", "error");
    }
  };

  const executeDelete = async (product) => {
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/costumes/${product._id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        fetchProducts();
        showToast("Đã ẩn sản phẩm thành công!");
      } else {
        const err = await response.json();
        showToast(err.message || "Ẩn sản phẩm thất bại", "error");
      }
    } catch (error) {
      console.error(error);
      showToast("Lỗi hệ thống", "error");
    }
  };

  const executeRestore = async (product) => {
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const restoreData = {
        ...product,
        categoryId: product.categoryId?._id || product.categoryId,
        status: "available"
      };

      const response = await fetch(`${API_URL}/api/costumes/${product._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(restoreData),
      });

      if (response.ok) {
        fetchProducts();
        showToast("Khôi phục sản phẩm thành công!");
      } else {
        const err = await response.json();
        showToast(err.message || "Khôi phục sản phẩm thất bại", "error");
      }
    } catch (error) {
      console.error(error);
      showToast("Lỗi hệ thống", "error");
    }
  };

  const executeChangeStatus = async ({ product, newStatus }) => {
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const updateData = {
        ...product,
        categoryId: product.categoryId?._id || product.categoryId,
        status: newStatus
      };

      const response = await fetch(`${API_URL}/api/costumes/${product._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        fetchProducts();
        showToast("Cập nhật trạng thái thành công!");
      } else {
        const err = await response.json();
        showToast(err.message || "Cập nhật thất bại", "error");
      }
    } catch (error) {
      console.error(error);
      showToast("Lỗi hệ thống", "error");
    }
  };

  const handleConfirm = async () => {
    setIsConfirmOpen(false);

    if (confirmAction === 'add') {
      await executeAdd(pendingData);
    } else if (confirmAction === 'edit') {
      await executeEdit(pendingData);
    } else if (confirmAction === 'delete') {
      await executeDelete(pendingData);
    } else if (confirmAction === 'restore') {
      await executeRestore(pendingData);
    } else if (confirmAction === 'change_status') {
      await executeChangeStatus(pendingData);
    }

    setPendingData(null);
    setEditingProduct(null);
  };

  const handleCancelConfirm = () => {
    setIsConfirmOpen(false);
    if (confirmAction === 'add' || confirmAction === 'edit') {
      setIsFormOpen(true);
    } else {
      setPendingData(null);
    }
  };

  const getConfirmMessage = () => {
    if (confirmAction === 'add') return "Bạn có chắc chắn muốn thêm sản phẩm này?";
    if (confirmAction === 'edit') return "Bạn có chắc chắn muốn lưu thay đổi cho sản phẩm này?";
    if (confirmAction === 'delete') return "Bạn có chắc chắn muốn ẩn/xóa mềm sản phẩm này khỏi hệ thống?";
    if (confirmAction === 'restore') return "Bạn có chắc chắn muốn khôi phục lại sản phẩm này (trạng thái Sẵn sàng)?";
    if (confirmAction === 'change_status') return "Bạn có chắc chắn muốn cập nhật trạng thái hoạt động của sản phẩm này?";
    return "";
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'available': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'maintenance': return 'bg-[#faf9f7] text-orange-700 border-orange-200';
      case 'dry_cleaning': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'rented': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'hidden': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-[#faf9f7] text-[#555] border-[#eaeaea]';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-[#1a1a1a]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            Quản lý Sản phẩm
          </h2>
          <p className="text-sm text-[#999] mt-1">
            Xem, thêm, sửa, quản lý trạng thái, hoặc ẩn sản phẩm
          </p>
        </div>
        <div>
          <Button variant="primary" onClick={handleOpenAddForm} className="bg-[#1a1a1a] hover:bg-[#333]">
            <FontAwesomeIcon icon={faPlus} className="mr-2" />
            Thêm sản phẩm
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5 border border-[#f0f0f0] shadow-sm flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <FontAwesomeIcon
            icon={faSearch}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#999] text-sm"
          />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Tìm kiếm sản phẩm..."
            className="w-full pl-10 pr-4 py-2.5 border border-[#eaeaea] rounded-xl outline-none focus:ring-2 focus:ring-[#1a1a1a] focus:border-transparent text-sm"
          />
        </div>

        <select
          value={filterCategory}
          onChange={(e) => { setFilterCategory(e.target.value); setPage(1); }}
          className="w-full md:w-48 px-4 py-2.5 border border-[#eaeaea] rounded-xl outline-none focus:ring-2 focus:ring-[#1a1a1a] text-sm bg-white text-[#555]"
        >
          <option value="">Tất cả danh mục</option>
          {categories.map((cat) => (
            <option key={cat._id} value={cat._id}>{cat.name}</option>
          ))}
        </select>

        <select
          value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
          className="w-full md:w-48 px-4 py-2.5 border border-[#eaeaea] rounded-xl outline-none focus:ring-2 focus:ring-[#1a1a1a] text-sm bg-white text-[#555]"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="available">Sẵn sàng</option>
          <option value="rented">Đang thuê</option>
          <option value="maintenance">Bảo trì</option>
          <option value="dry_cleaning">Đang giặt</option>
          <option value="hidden">Đã ẩn</option>
        </select>
      </div>

      <DataTable
        isLoading={loading}
        isEmpty={!loading && products.length === 0}
        emptyMessage="Chưa có sản phẩm nào"
        footer={
          <Pagination
            displayCount={products.length}
            totalCount={pagination.totalItems}
            currentPage={page}
            totalPages={pagination.totalPages}
            onPageChange={setPage}
          />
        }
      >
        <thead>
          <tr className="border-border border-[#f0f0f0] bg-gray-50/50">
            <th className="w-[30%] py-4 px-6 text-xs font-semibold text-[#999] uppercase tracking-wider">Sản phẩm</th>
            <th className="w-[15%] py-4 px-6 text-xs font-semibold text-[#999] uppercase tracking-wider">Danh mục</th>
            <th className="w-[15%] py-4 px-6 text-xs font-semibold text-[#999] uppercase tracking-wider">Giá thuê</th>
            <th className="w-[15%] py-4 px-6 text-xs font-semibold text-[#999] uppercase tracking-wider">Giá cọc</th>
            <th className="w-[15%] py-4 px-6 text-xs font-semibold text-[#999] uppercase tracking-wider">Trạng thái</th>
            <th className="w-[10%] py-4 px-6 text-xs font-semibold text-[#999] uppercase tracking-wider text-right">Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => {
            const isLocked = product.status === "hidden" || product.status === "rented";
            return (
              <tr key={product._id} className="border-border border-gray-50 hover:bg-[#faf9f7] transition-colors">
                <td className="py-4 px-6">
                  <div className="flex items-center gap-3">
                    <img
                      src={product.images && product.images.length > 0 ? product.images[0] : "https://placehold.co/40x40"}
                      alt={product.name}
                      className="w-10 h-10 rounded object-cover bg-[#f5f5f5] border border-[#eaeaea]"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-[#1a1a1a] truncate">{product.name}</p>
                      <p className="text-xs text-[#999] w-48 truncate">{product.description}</p>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-6 text-sm text-[#555]">
                  {product.categoryId?.name || "N/A"}
                </td>
                <td className="py-4 px-6 text-sm font-medium text-[#1a1a1a]">
                  {product.rentalRates?.pricePerDay ? product.rentalRates.pricePerDay.toLocaleString("vi-VN") : "0"}đ
                </td>
                <td className="py-4 px-6 text-sm font-medium text-[#1a1a1a]">
                  {product.deposit ? product.deposit.toLocaleString("vi-VN") : "0"}đ
                </td>
                <td className="py-4 px-6">
                  {product.status === "hidden" ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                      Đã ẩn
                    </span>
                  ) : (
                    <select
                      value={product.status}
                      onChange={(e) => handleStatusChangeClick(product, e.target.value)}
                      disabled={isLocked}
                      className={`border px-2.5 py-1 rounded-full text-xs font-medium outline-none transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-80 ${getStatusColor(product.status)}`}
                    >
                      <option value="available">Sẵn sàng</option>
                      <option value="maintenance">Bảo trì</option>
                      <option value="dry_cleaning">Đang giặt</option>
                      <option value="rented" disabled>Đang thuê</option>
                    </select>
                  )}
                </td>
                <td className="py-4 px-6 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {product.status === "hidden" ? (
                      <button
                        onClick={() => handleRestoreClick(product)}
                        className="w-8 h-8 rounded-lg hover:bg-[#eaeaea] text-[#999] hover:text-[#1a1a1a] flex items-center justify-center transition-colors"
                        title="Khôi phục"
                      >
                        <FontAwesomeIcon icon={faEye} className="text-sm" />
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => handleOpenEditForm(product)}
                          className="w-8 h-8 rounded-lg hover:bg-[#eaeaea] text-[#999] hover:text-[#1a1a1a] flex items-center justify-center transition-colors"
                          title="Sửa thông tin"
                        >
                          <FontAwesomeIcon icon={faEdit} className="text-sm" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(product)}
                          className="w-8 h-8 rounded-lg hover:bg-red-50 text-red-500 hover:text-red-600 flex items-center justify-center transition-colors"
                          title="Ẩn khỏi cửa hàng"
                        >
                          <FontAwesomeIcon icon={faEyeSlash} className="text-sm" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </DataTable>

      <ProductFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={editingProduct}
        categories={categories}
      />

      <ConfirmModal
        isOpen={isConfirmOpen}
        title="Xác nhận thao tác"
        message={getConfirmMessage()}
        onConfirm={handleConfirm}
        onCancel={handleCancelConfirm}
      />

      <Toast 
        isVisible={toast.isVisible} 
        message={toast.message} 
        type={toast.type} 
        onClose={() => setToast(prev => ({ ...prev, isVisible: false }))} 
      />
    </div>
  );
}