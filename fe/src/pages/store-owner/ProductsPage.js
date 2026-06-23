import React, { useState, useEffect, useMemo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faEdit, faEyeSlash, faEye, faSearch } from "@fortawesome/free-solid-svg-icons";
import Button from "../../components/ui/Button";
import ProductFormModal from "../../components/store-owner/ProductFormModal";
import ConfirmModal from "../../components/ui/ConfirmModal";
import Toast from "../../components/ui/Toast";
import Pagination from "../../components/ui/Pagination";

import Input from "../../components/ui/Input";
import DataTable from "../../components/ui/DataTable";
import CategoryDropdown from "../../components/ui/CategoryDropdown";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:9999";

const PAGE_SIZE = 10;
export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCatagory, setFilterCatagory] = useState("");
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null); // 'add', 'edit', 'delete', 'restore', 'change_status'
  const [pendingData, setPendingData] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const [toast, setToast] = useState({ isVisible: false, message: "", type: "success" });
  const showToast = (message, type = "success") => {
    setToast({ isVisible: true, message, type });
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/costumes`);
      const data = await response.json();
      if (response.ok) {
        setProducts(data.costumes || []);
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
        console.log(data.categories)
      } else {
        console.error("Failed to fetch categories");
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter((pro) => {
      const matchSearch =
        pro.name?.toLowerCase().includes(search.toLowerCase());
      const matchRole =
        !filterCatagory || filterCatagory === "all" ||
        (pro.categoryId?._id === filterCatagory || pro.categoryId === filterCatagory);
      const matchStatus =
        !filterStatus || filterStatus === "all" ||
        pro.status?.toLowerCase() === filterStatus.toLowerCase();
      return matchSearch && matchRole && matchStatus;
    });
  }, [products, search, filterCatagory, filterStatus]);

  useEffect(() => { setCurrentPage(1); }, [search, filterCatagory, filterStatus]);

  const paginatedProduct = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredProducts.slice(start, start + PAGE_SIZE);
  }, [filteredProducts, currentPage]);

  const totalPages = Math.ceil(filteredProducts.length / PAGE_SIZE);



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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-[#1a1a1a]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            Quản lý Sản phẩm
          </h2>
          <p className="text-[#999] text-sm mt-1">
            Xem, thêm, sửa, quản lý trạng thái, hoặc ẩn sản phẩm
          </p>
        </div>
        <div>
          <Button icon={faPlus} label="Thêm sản phẩm" variant="primary" onClick={handleOpenAddForm} />
        </div>
      </div>
      <div className="bg-white rounded-2xl p-5 border border-[#f0f0f0] shadow-sm flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <FontAwesomeIcon
            icon={faSearch}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#999] text-sm"
          />
          <Input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm sản phẩm..."
            className="!pl-10"
          />
        </div>

        <div className="relative z-20">
          <CategoryDropdown
            categories={categories}
            value={filterCatagory}
            onChange={setFilterCatagory}
          />
        </div>


        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="w-full md:w-48 px-4 py-2.5 border border-[#eaeaea] rounded-xl outline-none focus:ring-2 focus:ring-[#1a1a1a] text-sm bg-white text-[#555]"
        >
          <option value="all">All Statuses</option>
          <option value="available">Available</option>
          <option value="maintenance">Maintenance</option>
          <option value="Dry_cleaning">Dry cleaning</option>
          <option value="rented">Rented</option>

        </select>
      </div>

      <DataTable
        isLoading={loading}
        isEmpty={filteredProducts.length === 0}
        emptyMessage="Chưa có sản phẩm nào"
        footer={
          <div className="p-4 border-t border-[#f0f0f0]">
            <Pagination
              displayCount={paginatedProduct.length}
              totalCount={filteredProducts.length}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
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
        <tbody className="divide-y divide-[#f0f0f0]">
          {paginatedProduct.map((product) => {
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
                    <div>
                      <p className="font-semibold text-[14px] text-[#1a1a1a]">{product.name}</p>
                      <p className="text-[12px] text-[#999] w-48 truncate">{product.description}</p>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-6 text-[13px] text-[#555]">
                  {product.categoryId?.name || "N/A"}
                </td>
                <td className="py-4 px-6 text-[13px] font-medium text-[#1a1a1a]">
                  {(product.pricePerDay || product.price || 0).toLocaleString("vi-VN")}đ
                </td>
                <td className="py-4 px-6 text-[13px] font-medium text-[#1a1a1a]">
                  {product.deposit ? product.deposit.toLocaleString("vi-VN") : "0"}đ
                </td>
                <td className="py-4 px-6">
                  {product.status === "hidden" ? (
                    <span className="px-3 py-1.5 rounded-md text-[12px] font-semibold bg-red-50 text-red-700 border border-red-200">
                      Đã ẩn
                    </span>
                  ) : (
                    <select
                      value={product.status}
                      onChange={(e) => handleStatusChangeClick(product, e.target.value)}
                      disabled={isLocked}
                      className={`border px-2 py-1.5 rounded-md text-[12px] font-semibold outline-none transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-80 ${getStatusColor(product.status)}`}
                    >
                      <option value="available">Sẵn sàng</option>
                      <option value="maintenance">Bảo trì</option>
                      <option value="dry_cleaning">Đang giặt</option>
                      <option value="rented" disabled>Đang thuê</option>
                    </select>
                  )}
                </td>
                <td className="py-4 px-6 text-right">
                  <div className="flex justify-end gap-2">
                    {product.status === "hidden" ? (
                      <button
                        onClick={() => handleRestoreClick(product)}
                        className="w-8 h-8 flex items-center justify-center text-[#1a1a1a] hover:bg-[#eaeaea] rounded transition-colors"
                        title="Khôi phục"
                      >
                        <FontAwesomeIcon icon={faEye} />
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => handleOpenEditForm(product)}
                          className="w-8 h-8 flex items-center justify-center text-[#1a1a1a] hover:bg-[#eaeaea] rounded transition-colors"
                          title="Sửa thông-tin"
                        >
                          <FontAwesomeIcon icon={faEdit} />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(product)}
                          className="w-8 h-8 flex items-center justify-center text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Ẩn khỏi cửa hàng"
                        >
                          <FontAwesomeIcon icon={faEyeSlash} />
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