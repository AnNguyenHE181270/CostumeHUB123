import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faEdit, faEyeSlash, faEye } from "@fortawesome/free-solid-svg-icons";
import Button from "../../components/ui/Button";
import ProductFormModal from "../../components/store-owner/ProductFormModal";
import ConfirmModal from "../../components/ui/ConfirmModal";
import Toast from "../../components/ui/Toast";

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null); // 'add', 'edit', 'delete'
  const [pendingData, setPendingData] = useState(null);

  const [toast, setToast] = useState({ isVisible: false, message: "", type: "success" });
  const showToast = (message, type = "success") => {
    setToast({ isVisible: true, message, type });
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:9999/api/costumes");
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
      const response = await fetch("http://localhost:9999/api/categories?all=true");
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
    fetchCategories();
  }, []);

  const handleOpenAddForm = () => {
    setEditingProduct(null);
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (product) => {
    setEditingProduct(product);
    setIsFormOpen(true);
  };

  const handleFormSubmit = (data) => {
    // Tạm thời lưu data lại và mở confirm modal
    setPendingData(data);
    setConfirmAction(editingProduct ? 'edit' : 'add');
    setIsFormOpen(false); // Ẩn form chính đi để hiện popup xác nhận
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

  const executeAdd = async (data) => {
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const response = await fetch("http://localhost:9999/api/costumes", {
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
      const response = await fetch(`http://localhost:9999/api/costumes/${editingProduct._id}`, {
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
      const response = await fetch(`http://localhost:9999/api/costumes/${product._id}`, {
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
        name: product.name,
        slug: product.slug,
        sku: product.sku,
        categoryId: product.categoryId?._id || product.categoryId,
        size: product.size,
        color: product.color,
        condition: product.condition,
        rentalRates: product.rentalRates,
        deposit: product.deposit,
        minRentalDays: product.minRentalDays,
        lateFeePerDay: product.lateFeePerDay,
        description: product.description,
        images: product.images,
        specifications: product.specifications,
        status: "available"
      };

      const response = await fetch(`http://localhost:9999/api/costumes/${product._id}`, {
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
    }

    setPendingData(null);
    setEditingProduct(null);
  };

  const handleCancelConfirm = () => {
    setIsConfirmOpen(false);
    // Nếu huỷ lưu/sửa, có thể cho mở lại form
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
    return "";
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý Sản phẩm</h1>
          <p className="text-sm text-gray-500 mt-1">
            Xem, thêm, sửa, hoặc ẩn sản phẩm
          </p>
        </div>
        <Button variant="primary" onClick={handleOpenAddForm}>
          <FontAwesomeIcon icon={faPlus} className="mr-2" />
          Thêm sản phẩm
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Đang tải dữ liệu...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-sm border-b">
                  <th className="py-4 px-6 font-medium">Sản phẩm</th>
                  <th className="py-4 px-6 font-medium">Danh mục</th>
                  <th className="py-4 px-6 font-medium">Giá thuê</th>
                  <th className="py-4 px-6 font-medium">Giá cọc</th>
                  <th className="py-4 px-6 font-medium">Trạng thái</th>
                  <th className="py-4 px-6 font-medium text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-gray-500">
                      Chưa có sản phẩm nào
                    </td>
                  </tr>
                ) : (
                  products.map((product) => (
                    <tr key={product._id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <img
                            src={product.images && product.images.length > 0 ? product.images[0] : "https://via.placeholder.com/40"}
                            alt={product.name}
                            className="w-10 h-10 rounded object-cover bg-gray-100 border"
                          />
                          <div>
                            <p className="font-medium text-gray-900">{product.name}</p>
                            <p className="text-xs text-gray-500 w-48 truncate">{product.description}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-500">
                        {product.categoryId?.name || "N/A"}
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-500">
                        {product.rentalRates?.pricePerDay ? product.rentalRates.pricePerDay.toLocaleString("vi-VN") : "0"}đ
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-500">
                        {product.deposit ? product.deposit.toLocaleString("vi-VN") : "0"}đ
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${product.status === "available"
                              ? "bg-green-100 text-green-700"
                              : product.status === "hidden"
                                ? "bg-red-100 text-red-700"
                                : "bg-yellow-100 text-yellow-700"
                            }`}
                        >
                          {product.status === "available" ? "Sẵn sàng" : product.status === "hidden" ? "Đã ẩn" : product.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex justify-end gap-2">
                          {product.status === "hidden" ? (
                            <button
                              onClick={() => handleRestoreClick(product)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded transition-colors"
                              title="Khôi phục"
                            >
                              <FontAwesomeIcon icon={faEye} />
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={() => handleOpenEditForm(product)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                title="Sửa"
                              >
                                <FontAwesomeIcon icon={faEdit} />
                              </button>
                              <button
                                onClick={() => handleDeleteClick(product)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                                title="Ẩn (Xóa mềm)"
                              >
                                <FontAwesomeIcon icon={faEyeSlash} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

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
