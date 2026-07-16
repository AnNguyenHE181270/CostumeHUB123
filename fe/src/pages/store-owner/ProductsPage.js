import React, { useState, useEffect, useMemo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faEdit, faEyeSlash, faEye } from "@fortawesome/free-solid-svg-icons";
import Button from "../../components/ui/Button";
import ProductFormModal from "../../components/store-owner/ProductFormModal";
import ProductDetailModal from "../../components/store-owner/ProductDetailModal";
import ConfirmModal from "../../components/ui/ConfirmModal";
import Toast from "../../components/ui/Toast";
import Pagination from "../../components/ui/Pagination";

import Input from "../../components/ui/Input";
import SearchInput from "../../components/ui/SearchInput";
import DataTable from "../../components/ui/DataTable";
import CategoryDropdown from "../../components/ui/CategoryDropdown";
import costumeService from "../../services/costume.service";
import categoryService from "../../services/category.service";

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
  const [sortOrder, setSortOrder] = useState("newest");
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null); // 'add', 'edit', 'delete', 'restore', 'change_status'
  const [pendingData, setPendingData] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const [detailProduct, setDetailProduct] = useState(null);

  const [toast, setToast] = useState({ isVisible: false, message: "", type: "success" });
  const showToast = (message, type = "success") => {
    setToast({ isVisible: true, message, type });
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await costumeService.getAll({ limit: 1000, status: "available,out_of_stock,maintenance,dry_cleaning,rented,hidden" });
      setProducts(data.costumes || []);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await categoryService.getAll({ all: true });
      setCategories(data.categories || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const filteredProducts = useMemo(() => {
    const result = products.filter((pro) => {
      const matchSearch =
        pro.name?.toLowerCase().includes(search.toLowerCase());
      
      let matchRole = true;
      if (filterCatagory && filterCatagory !== "all") {
        const proCatId = pro.categoryId?._id || pro.categoryId;
        if (proCatId === filterCatagory) {
           matchRole = true;
        } else {
           const proCat = categories.find(c => c._id === proCatId);
           if (proCat && proCat.parentId === filterCatagory) {
               matchRole = true;
           } else {
               matchRole = false;
           }
        }
      }

      let matchStatus = false;
      if (!filterStatus || filterStatus === "all") {
        matchStatus = true;
      } else if (filterStatus === "out_of_stock") {
        const totalAvail = pro.variants ? pro.variants.reduce((acc, v) => acc + (v.availableStock || 0), 0) : 0;
        matchStatus = pro.status === "out_of_stock" || totalAvail === 0;
      } else {
        matchStatus = pro.status?.toLowerCase() === filterStatus.toLowerCase();
      }
      return matchSearch && matchRole && matchStatus;
    });

    if (sortOrder === "price_asc") {
      result.sort((a, b) => (a.pricePerDay || a.price || 0) - (b.pricePerDay || b.price || 0));
    } else if (sortOrder === "price_desc") {
      result.sort((a, b) => (b.pricePerDay || b.price || 0) - (a.pricePerDay || a.price || 0));
    } else {
      result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    return result;
  }, [products, search, filterCatagory, filterStatus, sortOrder, categories]);

  useEffect(() => { setCurrentPage(1); }, [search, filterCatagory, filterStatus, sortOrder]);

  const paginatedProduct = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredProducts.slice(start, start + PAGE_SIZE);
  }, [filteredProducts, currentPage]);

  const totalPages = Math.ceil(filteredProducts.length / PAGE_SIZE);

  const stats = useMemo(() => {
    const total = filteredProducts.length;
    const hidden = filteredProducts.filter((product) => product.status === "hidden").length;
    const outOfStock = filteredProducts.filter((product) => {
      if (product.status === "out_of_stock") return true;
      const totalAvail = product.variants ? product.variants.reduce((acc, v) => acc + (v.availableStock || 0), 0) : 0;
      return totalAvail === 0;
    }).length;
    return { total, hidden, outOfStock };
  }, [filteredProducts]);



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
      await costumeService.create(data);
      fetchProducts();
      showToast("Thêm sản phẩm thành công!");
    } catch (err) {
      showToast(err.message || "Thêm sản phẩm thất bại", "error");
    }
  };

  const executeEdit = async (data) => {
    try {
      await costumeService.update(editingProduct._id, data);
      fetchProducts();
      showToast("Cập nhật sản phẩm thành công!");
    } catch (err) {
      showToast(err.message || "Cập nhật sản phẩm thất bại", "error");
    }
  };

  const executeDelete = async (product) => {
    try {
      await costumeService.delete(product._id);
      fetchProducts();
      showToast("Đã ẩn sản phẩm thành công!");
    } catch (err) {
      showToast(err.message || "Ẩn sản phẩm thất bại", "error");
    }
  };

  const executeRestore = async (product) => {
    try {
      await costumeService.update(product._id, {
        ...product,
        categoryId: product.categoryId?._id || product.categoryId,
        status: "available"
      });
      fetchProducts();
      showToast("Khôi phục sản phẩm thành công!");
    } catch (err) {
      showToast(err.message || "Khôi phục sản phẩm thất bại", "error");
    }
  };

  const executeChangeStatus = async ({ product, newStatus }) => {
    try {
      await costumeService.update(product._id, {
        ...product,
        categoryId: product.categoryId?._id || product.categoryId,
        status: newStatus
      });
      fetchProducts();
      showToast("Cập nhật trạng thái thành công!");
    } catch (err) {
      showToast(err.message || "Cập nhật thất bại", "error");
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
      case 'available':    return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'maintenance':  return 'bg-[#faf9f7] text-orange-700 border-orange-200';
      case 'dry_cleaning': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'rented':       return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'out_of_stock': return 'bg-gray-100 text-gray-500 border-gray-300';
      case 'hidden':       return 'bg-red-50 text-red-700 border-red-200';
      default:             return 'bg-[#faf9f7] text-[#555] border-[#eaeaea]';
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-6 gap-4 items-center">
        {/* Search — đầu dòng, 1/6 */}
        <SearchInput
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm kiếm sản phẩm..."
          wrapperClassName="col-span-1"
        />

        {/* Category filter */}
        <div className="relative z-20 col-span-1">
          <CategoryDropdown
            categories={categories}
            value={filterCatagory}
            onChange={setFilterCatagory}
          />
        </div>

        {/* Status filter */}
        <div className="col-span-1">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full px-4 py-2.5 border border-[#eaeaea] rounded-xl outline-none focus:ring-2 focus:ring-[#1a1a1a] text-sm bg-white text-[#555]"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="available">Sẵn sàng</option>
            <option value="out_of_stock">Hết hàng</option>
            <option value="maintenance">Bảo trì</option>
            <option value="dry_cleaning">Bảo trì</option>
            <option value="rented">Đang thuê</option>
            <option value="hidden">Đã ẩn</option>
          </select>
        </div>

        {/* Sort filter */}
        <div className="col-span-1">
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="w-full px-4 py-2.5 border border-[#eaeaea] rounded-xl outline-none focus:ring-2 focus:ring-[#1a1a1a] text-sm bg-white text-[#555]"
          >
            <option value="newest">Mới nhất</option>
            <option value="price_asc">Giá thuê: Thấp đến Cao</option>
            <option value="price_desc">Giá thuê: Cao đến Thấp</option>
          </select>
        </div>

        {/* Spacer */}
        <div className="col-span-1" />

        {/* Button — cuối dòng, 1/6 */}
        <div className="col-span-1">
          <Button icon={faPlus} label="Thêm sản phẩm" variant="primary" onClick={handleOpenAddForm} />
        </div>
      </div>


      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-[#eaeaea] rounded-2xl p-4 shadow-sm">
          <p className="text-sm text-[#777]">Tổng sản phẩm</p>
          <p className="mt-2 text-3xl font-semibold text-[#1a1a1a]">{stats.total}</p>
        </div>
        <div className="bg-white border border-[#eaeaea] rounded-2xl p-4 shadow-sm">
          <p className="text-sm text-[#777]">Sản phẩm đã ẩn</p>
          <p className="mt-2 text-3xl font-semibold text-[#1a1a1a]">{stats.hidden}</p>
        </div>
        <div className="bg-white border border-[#eaeaea] rounded-2xl p-4 shadow-sm">
          <p className="text-sm text-[#777]">Sản phẩm hết hàng</p>
          <p className="mt-2 text-3xl font-semibold text-[#1a1a1a]">{stats.outOfStock}</p>
        </div>
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
            <th className="w-[30%] py-4 px-6 text-xs font-semibold text-[#999] uppercase tracking-wider sticky top-0 bg-white/95 backdrop-blur-sm border-b border-[#f0f0f0] z-10">Sản phẩm</th>
            <th className="w-[15%] py-4 px-6 text-xs font-semibold text-[#999] uppercase tracking-wider sticky top-0 bg-white/95 backdrop-blur-sm border-b border-[#f0f0f0] z-10">Danh mục</th>
            <th className="w-[10%] py-4 px-6 text-xs font-semibold text-[#999] uppercase tracking-wider sticky top-0 bg-white/95 backdrop-blur-sm border-b border-[#f0f0f0] z-10">Tồn kho</th>
            <th className="w-[15%] py-4 px-6 text-xs font-semibold text-[#999] uppercase tracking-wider sticky top-0 bg-white/95 backdrop-blur-sm border-b border-[#f0f0f0] z-10">Giá & Cọc</th>
            <th className="w-[15%] py-4 px-6 text-xs font-semibold text-[#999] uppercase tracking-wider sticky top-0 bg-white/95 backdrop-blur-sm border-b border-[#f0f0f0] z-10">Trạng thái</th>
            <th className="w-[15%] py-4 px-6 text-xs font-semibold text-[#999] uppercase tracking-wider text-right sticky top-0 bg-white/95 backdrop-blur-sm border-b border-[#f0f0f0] z-10">Thao tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#f0f0f0]">
          {paginatedProduct.map((product) => {
            const isLocked = product.status === "hidden" || product.status === "rented";
            return (
              <tr
                key={product._id}
                className="border-border border-gray-50 hover:bg-[#faf9f7] transition-colors cursor-pointer"
                onClick={() => setDetailProduct(product)}
              >
                <td className="py-4 px-6">
                  <div className="flex items-center gap-4">
                    <img
                      src={product.images && product.images.length > 0 ? product.images[0] : "https://placehold.co/56x56"}
                      alt={product.name}
                      className="w-14 h-14 rounded-lg object-cover bg-[#f5f5f5] border border-[#eaeaea]"
                    />
                    <div>
                      <p className="font-semibold text-[15px] text-[#1a1a1a]">{product.name}</p>
                      <p className="text-[13px] text-[#999] w-48 truncate mt-0.5">{product.description}</p>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-6 text-[14px] text-[#555]">
                  <span className="bg-gray-100 px-2.5 py-1 rounded-md border border-gray-200">
                    {product.categoryId?.name || "N/A"}
                  </span>
                </td>
                <td className="py-4 px-6 text-[14px] text-[#555]">
                  {product.variants && product.variants.length > 0 ? (
                    (() => {
                      const totalAvail = product.variants.reduce((acc, v) => acc + (v.availableStock || 0), 0);
                      return totalAvail === 0 ? (
                        <span className="bg-red-50 text-red-600 px-2.5 py-1 rounded-md border border-red-200 font-medium text-[13px]">
                          Hết hàng
                        </span>
                      ) : (
                        <span className="font-medium text-[#1a1a1a]">
                          {totalAvail}
                          <span className="text-[#999] font-normal text-[12px] ml-1">cái</span>
                        </span>
                      );
                    })()
                  ) : (
                    <span className="text-[#999]">-</span>
                  )}
                </td>
                <td className="py-4 px-6 text-[14px]">
                  <div className="flex flex-col">
                    <span className="font-bold text-[#f94a00]">
                      {(product.pricePerDay || product.price || 0).toLocaleString("vi-VN")}<span className="text-xs font-medium ml-0.5">đ</span>
                    </span>
                    <span className="text-[12px] text-[#999]">
                      Cọc: {(product.deposit || 0).toLocaleString("vi-VN")}đ
                    </span>
                  </div>
                </td>
                <td className="py-4 px-6" onClick={(e) => e.stopPropagation()}>
                  {product.status === "hidden" ? (
                    <span className="px-3 py-1.5 rounded-md text-[12px] font-semibold bg-red-50 text-red-700 border border-red-200">
                      Đã ẩn
                    </span>
                  ) : product.status === "out_of_stock" ? (
                    <span
                      className="px-3 py-1.5 rounded-md text-[12px] font-semibold bg-gray-100 text-gray-500 border border-gray-300 cursor-default"
                      title="Tự động đặt khi tồn kho = 0. Vào Quản lý Kho để bổ sung hàng."
                    >
                      Hết hàng
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
                      <option value="dry_cleaning">Bảo trì</option>
                      <option value="rented" disabled>Đang thuê</option>
                    </select>
                  )}
                </td>
                <td className="py-4 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => handleOpenEditForm(product)}
                      className="w-8 h-8 flex items-center justify-center text-[#1a1a1a] hover:bg-[#eaeaea] rounded transition-colors"
                      title="Sửa thông-tin"
                    >
                      <FontAwesomeIcon icon={faEdit} />
                    </button>
                    {product.status === "hidden" ? (
                      <button
                        onClick={() => handleRestoreClick(product)}
                        className="w-8 h-8 flex items-center justify-center text-[#1a1a1a] hover:bg-[#eaeaea] rounded transition-colors"
                        title="Khôi phục"
                      >
                        <FontAwesomeIcon icon={faEye} />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleDeleteClick(product)}
                        className="w-8 h-8 flex items-center justify-center text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Ẩn khỏi cửa hàng"
                      >
                        <FontAwesomeIcon icon={faEyeSlash} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </DataTable>

      <ProductDetailModal
        product={detailProduct}
        onClose={() => setDetailProduct(null)}
        onEdit={() => {
          handleOpenEditForm(detailProduct);
          setDetailProduct(null);
        }}
      />

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