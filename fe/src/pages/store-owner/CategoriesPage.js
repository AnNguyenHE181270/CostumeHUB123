import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faEdit, faEyeSlash, faEye, faFolder, faFolderOpen } from "@fortawesome/free-solid-svg-icons";
import Button from "../../components/ui/Button";
import ConfirmModal from "../../components/ui/ConfirmModal";
import Input from "../../components/ui/Input";

import Toast from "../../components/ui/Toast";

const CategoriesPage = () => {
  const [categories, setCategories] = useState([]);
  const [tree, setTree] = useState([]);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({ name: "", description: "", parentId: "" });
  
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState("");
  const [pendingData, setPendingData] = useState(null);

  const [toast, setToast] = useState({ isVisible: false, message: "", type: "success" });
  const showToast = (message, type = "success") => {
    setToast({ isVisible: true, message, type });
  };

  useEffect(() => {
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch(`http://localhost:9999/api/categories?all=true`);
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories);
        buildTree(data.categories);
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  };

  const buildTree = (cats) => {
    const map = {};
    const roots = [];

    cats.forEach(cat => {
      map[cat._id] = { ...cat, children: [] };
    });

    cats.forEach(cat => {
      if (cat.parentId && map[cat.parentId]) {
        map[cat.parentId].children.push(map[cat._id]);
      } else {
        roots.push(map[cat._id]);
      }
    });

    setTree(roots);
  };

  // ---- Form Handlers ----
  const handleOpenAddRoot = () => {
    setEditingCategory(null);
    setFormData({ name: "", description: "", parentId: "" });
    setIsFormOpen(true);
  };

  const handleOpenAddChild = (parentCat) => {
    setEditingCategory(null);
    setFormData({ name: "", description: "", parentId: parentCat._id });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (cat) => {
    setEditingCategory(cat);
    setFormData({ name: cat.name, description: cat.description, parentId: cat.parentId || "" });
    setIsFormOpen(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!formData.name) return alert("Vui lòng nhập tên danh mục!");
    
    setPendingData(formData);
    setConfirmAction(editingCategory ? 'edit' : 'add');
    setIsFormOpen(false);
    setIsConfirmOpen(true);
  };

  const handleToggleStatusClick = (cat) => {
    setPendingData(cat);
    setConfirmAction('toggleStatus');
    setIsConfirmOpen(true);
  };

  // ---- API Executors ----
  const executeAdd = async (data) => {
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const res = await fetch(`http://localhost:9999/api/categories`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: data.name,
          description: data.description,
          parentId: data.parentId || null
        })
      });
      if (res.ok) {
        fetchCategories();
        showToast("Thêm danh mục thành công!");
      } else {
        const err = await res.json();
        showToast(err.message || "Failed to add category", "error");
      }
    } catch (error) {
      console.error(error);
      showToast("Lỗi hệ thống", "error");
    }
  };

  const executeEdit = async (data) => {
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const res = await fetch(`http://localhost:9999/api/categories/${editingCategory._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: data.name,
          description: data.description,
          parentId: data.parentId || null
        })
      });
      if (res.ok) {
        fetchCategories();
        showToast("Cập nhật danh mục thành công!");
      } else {
        const err = await res.json();
        showToast(err.message || "Failed to edit category", "error");
      }
    } catch (error) {
      console.error(error);
      showToast("Lỗi hệ thống", "error");
    }
  };

  const executeToggleStatus = async (cat) => {
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const res = await fetch(`http://localhost:9999/api/categories/${cat._id}/toggle`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ isActive: !cat.isActive })
      });
      if (res.ok) {
        fetchCategories();
        showToast("Thay đổi trạng thái thành công!");
      } else {
        const err = await res.json();
        showToast(err.message || "Failed to toggle status", "error");
      }
    } catch (error) {
      console.error(error);
      showToast("Lỗi hệ thống", "error");
    }
  };

  // ---- Confirm Modal Handlers ----
  const handleConfirm = async () => {
    setIsConfirmOpen(false);
    if (confirmAction === 'add') await executeAdd(pendingData);
    else if (confirmAction === 'edit') await executeEdit(pendingData);
    else if (confirmAction === 'toggleStatus') await executeToggleStatus(pendingData);
    
    setPendingData(null);
    setEditingCategory(null);
  };

  const handleCancelConfirm = () => {
    setIsConfirmOpen(false);
    if (confirmAction === 'add' || confirmAction === 'edit') setIsFormOpen(true);
    else setPendingData(null);
  };

  // ---- Render Tree ----
  const renderTree = (nodes, level = 0) => {
    return nodes.map(node => (
      <React.Fragment key={node._id}>
        <div className={`flex items-center justify-between p-3 border-b hover:bg-gray-50 transition-colors ${!node.isActive ? 'bg-gray-100 opacity-60' : ''}`} style={{ paddingLeft: `${level * 2 + 1}rem` }}>
          <div className="flex items-center gap-3">
            <FontAwesomeIcon icon={node.children.length > 0 ? faFolderOpen : faFolder} className="text-[#f94a00]" />
            <span className={`font-medium ${!node.isActive ? 'line-through text-gray-500' : 'text-gray-800'}`}>{node.name}</span>
            {node.description && <span className="text-sm text-gray-500">- {node.description}</span>}
          </div>
          <div className="flex items-center gap-2">
            {node.isActive && (
              <>
                <button onClick={() => handleOpenAddChild(node)} className="p-1.5 text-xs text-[#f94a00] hover:bg-orange-50 rounded" title="Thêm danh mục con">
                  <FontAwesomeIcon icon={faPlus} className="mr-1" /> Con
                </button>
                <button onClick={() => handleOpenEdit(node)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="Sửa">
                  <FontAwesomeIcon icon={faEdit} />
                </button>
              </>
            )}
            <button onClick={() => handleToggleStatusClick(node)} className={`p-1.5 rounded ${node.isActive ? 'text-red-600 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}`} title={node.isActive ? 'Ẩn danh mục' : 'Khôi phục'}>
              <FontAwesomeIcon icon={node.isActive ? faEyeSlash : faEye} />
            </button>
          </div>
        </div>
        {node.children.length > 0 && renderTree(node.children, level + 1)}
      </React.Fragment>
    ));
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="flex justify-between items-center p-6 border-b">
        <h2 className="text-xl font-bold text-gray-800">Quản lý Danh mục</h2>
        <Button onClick={handleOpenAddRoot} className="flex items-center gap-2">
          <FontAwesomeIcon icon={faPlus} />
          <span>Thêm danh mục gốc</span>
        </Button>
      </div>

      <div className="p-4">
        {tree.length > 0 ? (
          <div className="border rounded-lg overflow-hidden">
            {renderTree(tree)}
          </div>
        ) : (
          <p className="text-center text-gray-500 py-10">Chưa có danh mục nào.</p>
        )}
      </div>

      {/* Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 m-4">
            <h2 className="text-xl font-bold mb-4 border-b pb-2">
              {editingCategory ? "Sửa danh mục" : (formData.parentId ? "Thêm danh mục con" : "Thêm danh mục gốc")}
            </h2>
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <Input label="Tên danh mục" name="name" value={formData.name} onChange={handleChange} required />
              
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Danh mục cha</label>
                <select
                  name="parentId"
                  value={formData.parentId}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#f94a00] outline-none"
                  disabled={editingCategory} // Tạm khóa đổi cha để tránh vòng lặp đệ quy lỗi
                >
                  <option value="">-- Không có (Danh mục gốc) --</option>
                  {categories.filter(c => c._id !== editingCategory?._id).map(c => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <Input label="Mô tả" name="description" value={formData.description} onChange={handleChange} />

              <div className="flex justify-end gap-3 mt-6">
                <Button variant="secondary" type="button" onClick={() => setIsFormOpen(false)}>Hủy</Button>
                <Button variant="primary" type="submit">Xác nhận</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={handleCancelConfirm}
        onConfirm={handleConfirm}
        title="Xác nhận"
        message={
          confirmAction === 'add' ? "Bạn có chắc chắn muốn thêm danh mục này?" :
          confirmAction === 'edit' ? "Bạn có chắc chắn muốn lưu thay đổi?" :
          confirmAction === 'toggleStatus' ? (pendingData?.isActive ? "Ẩn danh mục này sẽ ẩn luôn các danh mục con và sản phẩm bên trong. Bạn có chắc không?" : "Bạn có muốn khôi phục danh mục này?") : ""
        }
      />

      <Toast 
        isVisible={toast.isVisible} 
        message={toast.message} 
        type={toast.type} 
        onClose={() => setToast(prev => ({ ...prev, isVisible: false }))} 
      />
    </div>
  );
};

export default CategoriesPage;
