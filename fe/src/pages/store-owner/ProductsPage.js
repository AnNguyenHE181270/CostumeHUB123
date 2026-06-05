import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faEdit, faEyeSlash, faEye, faSearch, faBoxes, faTimes } from "@fortawesome/free-solid-svg-icons";
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
  const [expandedRow, setExpandedRow] = useState(null);

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [viewingProduct, setViewingProduct] = useState(null);

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
    switch (status) {
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
            <th className="w-[35%] py-4 px-6 text-xs font-semibold text-[#999] uppercase tracking-wider">Sản phẩm</th>
            <th className="w-[15%] py-4 px-6 text-xs font-semibold text-[#999] uppercase tracking-wider">Danh mục</th>
            <th className="w-[15%] py-4 px-6 text-xs font-semibold text-[#999] uppercase tracking-wider">Giá thuê</th>
            <th className="w-[15%] py-4 px-6 text-xs font-semibold text-[#999] uppercase tracking-wider">Trạng thái</th>
            <th className="w-[20%] py-4 px-6 text-xs font-semibold text-[#999] uppercase tracking-wider text-right">Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => {
            const isLocked = product.status === "hidden" || product.status === "rented";
            const totalAvailableStock = product.variants?.reduce((sum, v) => sum + (v.availableStock || 0), 0) || 0;
            const displayStatus = totalAvailableStock === 0 ? "out_of_stock" : product.status;

            return (
              <React.Fragment key={product._id}>
                <tr className="border-border border-gray-50 hover:bg-[#faf9f7] transition-colors">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <img
                        src={product.images && product.images.length > 0 ? product.images[0] : "https://placehold.co/40x40"}
                        alt={product.name}
                        className="w-10 h-10 rounded object-cover bg-[#f5f5f5] border border-[#eaeaea]"
                      />
                      <div className="min-w-0 flex-1 cursor-pointer" onClick={() => setViewingProduct(product)}>
                        <p className="text-sm font-semibold text-[#1a1a1a] truncate hover:text-[#555] transition-colors">{product.name}</p>
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
                  <td className="py-4 px-6">
                    {product.status === "hidden" ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                        Đã ẩn
                      </span>
                    ) : displayStatus === "out_of_stock" ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                        Hết hàng
                      </span>
                    ) : displayStatus === "available" ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Sẵn sàng
                      </span>
                    ) : displayStatus === "dry_cleaning" ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                        Đang giặt
                      </span>
                    ) : displayStatus === "maintenance" ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-orange-50 text-orange-700 border border-orange-200">
                        Bảo trì
                      </span>
                    ) : displayStatus === "rented" ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
                        Đang thuê
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-700 border border-gray-200">
                        {displayStatus}
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setExpandedRow(expandedRow === product._id ? null : product._id)}
                        className={`w-8 h-8 rounded-lg hover:bg-[#eaeaea] ${expandedRow === product._id ? 'text-[#1a1a1a] bg-[#eaeaea]' : 'text-[#999]'} flex items-center justify-center transition-colors`}
                        title="Quản lý số lượng"
                      >
                        <FontAwesomeIcon icon={faBoxes} className="text-sm" />
                      </button>
                      {product.status === "hidden" ? (
                        <button
                          onClick={() => handleRestoreClick(product)}
                          className="w-8 h-8 rounded-lg hover:bg-[#eaeaea] text-[#999] hover:text-[#1a1a1a] flex items-center justify-center transition-colors"
                          title="Khôi phục"
                        >
                          <FontAwesomeIcon icon={faPlus} className="text-sm" />
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
                {expandedRow === product._id && (
                  <tr>
                    <td colSpan="5" className="p-0 border-b border-[#eaeaea]">
                      <div className="bg-[#faf9f7] px-6 py-5 shadow-inner">
                        <div className="max-w-4xl">
                          <h4 className="text-sm font-semibold text-[#1a1a1a] mb-4 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#1a1a1a]"></span>
                            Dashboard mini quản lý lượng tồn kho động
                          </h4>
                          <div className="bg-white border border-[#eaeaea] rounded-xl overflow-hidden shadow-sm">
                            <table className="w-full text-sm text-left">
                              <thead>
                                <tr className="text-[#999] bg-white border-b border-[#eaeaea]">
                                  <th className="py-3 px-4 font-medium uppercase text-xs tracking-wider">Size</th>
                                  <th className="py-3 px-4 font-medium uppercase text-xs tracking-wider">Mã Sản Phẩm</th>
                                  <th className="py-3 px-4 font-medium uppercase text-xs tracking-wider">Tổng sản phẩm </th>
                                  <th className="py-3 px-4 font-medium uppercase text-xs tracking-wider">Đã thuê</th>
                                  <th className="py-3 px-4 font-medium uppercase text-xs tracking-wider">Còn tồn </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-[#eaeaea]">
                                {product.variants && product.variants.length > 0 ? (
                                  product.variants.map(v => (
                                    <tr key={v._id || v.sku} className="hover:bg-gray-50/50">
                                      <td className="py-3 px-4 font-semibold text-[#1a1a1a]">Size {v.size}</td>
                                      <td className="py-3 px-4">
                                        <span className="px-2.5 py-1 bg-[#f5f5f5] rounded-md text-xs font-medium text-[#555] border border-[#eaeaea]">{v.sku}</span>
                                      </td>
                                      <td className="py-3 px-4 font-semibold text-[#1a1a1a] pl-8">{v.totalStock || 0}</td>
                                      <td className="py-3 px-4 text-[#555] pl-8">{(v.totalStock || 0) - (v.availableStock || 0)}</td>
                                      <td className="py-3 px-4 text-emerald-600 font-medium pl-8">{v.availableStock || 0}</td>
                                    </tr>
                                  ))
                                ) : (
                                  <tr>
                                    <td colSpan="5" className="py-4 text-center text-[#999] text-xs">Không có biến thể nào</td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
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

      {/* Product Detail Modal */}
      {viewingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-[#eaeaea]">
              <h3 className="text-lg font-semibold text-[#1a1a1a]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Chi tiết sản phẩm</h3>
              <button
                onClick={() => setViewingProduct(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              <div className="flex flex-col md:flex-row gap-8">
                <div className="w-full md:w-1/3 space-y-4">
                  <div className="aspect-[3/4] rounded-xl overflow-hidden bg-gray-100 border border-[#eaeaea]">
                    <img
                      src={viewingProduct.images && viewingProduct.images.length > 0 ? viewingProduct.images[0] : "https://placehold.co/400x533"}
                      alt={viewingProduct.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {viewingProduct.images && viewingProduct.images.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {viewingProduct.images.slice(1).map((img, idx) => (
                        <img key={idx} src={img} alt="thumbnail" className="w-16 h-16 rounded-lg object-cover border border-[#eaeaea] shrink-0" />
                      ))}
                    </div>
                  )}
                </div>

                <div className="w-full md:w-2/3 space-y-5">
                  <div>
                    <h2 className="text-2xl font-bold text-[#1a1a1a] leading-tight mb-2">{viewingProduct.name}</h2>
                    <p className="text-[#555] leading-relaxed text-sm">{viewingProduct.description}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 py-4 border-y border-[#eaeaea]">
                    <div>
                      <p className="text-xs text-[#999] uppercase tracking-wider mb-1">Danh mục</p>
                      <p className="font-medium text-[#1a1a1a]">{viewingProduct.categoryId?.name || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[#999] uppercase tracking-wider mb-1">Thương hiệu</p>
                      <p className="font-medium text-[#1a1a1a]">{viewingProduct.brand || "Không có"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[#999] uppercase tracking-wider mb-1">Tình trạng</p>
                      <p className="font-medium text-[#1a1a1a]">{viewingProduct.condition || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[#999] uppercase tracking-wider mb-1">Tổng Tồn Kho</p>
                      <p className="font-medium text-[#1a1a1a]">{viewingProduct.variants?.reduce((sum, v) => sum + (v.stock || 0), 0) || 0}</p>
                    </div>
                  </div>

                  <div className="bg-[#faf9f7] rounded-xl p-4 border border-[#eaeaea]">
                    <h4 className="text-sm font-semibold text-[#1a1a1a] mb-3">Thông tin thuê</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-[#555]">Giá thuê (1 ngày):</span>
                        <span className="font-semibold text-[#1a1a1a]">{viewingProduct.rentalRates?.pricePerDay?.toLocaleString("vi-VN")}đ</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-[#555]">Tiền cọc:</span>
                        <span className="font-semibold text-[#1a1a1a]">{viewingProduct.deposit?.toLocaleString("vi-VN")}đ</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-[#555]">Phí trễ (1 ngày):</span>
                        <span className="font-semibold text-[#1a1a1a]">{viewingProduct.lateFeePerDay?.toLocaleString("vi-VN")}đ</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-[#eaeaea] bg-gray-50 flex justify-end">
              <Button onClick={() => setViewingProduct(null)} variant="outline">
                Đóng
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}