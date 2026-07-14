import React, { useState, useEffect, useMemo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faEdit, faEyeSlash, faEye, faFolder, faFolderOpen, faChevronRight, faChevronDown, faSearch, faInfoCircle } from "@fortawesome/free-solid-svg-icons";
import Button from "../../components/ui/Button";
import ConfirmModal from "../../components/ui/ConfirmModal";
import CategoryDetailModal from "../../components/store-owner/CategoryDetailModal";
import Input from "../../components/ui/Input";

import Toast from "../../components/ui/Toast";
import categoryService from "../../services/category.service";

const CategoriesPage = () => {
  const [categories, setCategories] = useState([]);
  const [tree, setTree] = useState([]);
  const [expandedNodes, setExpandedNodes] = useState({});

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({ name: "", description: "", parentId: "" });
  const [isRootMode, setIsRootMode] = useState(false);

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState("");
  const [pendingData, setPendingData] = useState(null);
  const [viewingCategory, setViewingCategory] = useState(null);
  const [search, setSearch] = useState("");
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
      const data = await categoryService.getAll({ all: true });
      setCategories(data.categories || []);
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

    const initialExpanded = {};
    roots.forEach(r => initialExpanded[r._id] = true);
    setExpandedNodes(initialExpanded);

    setTree(roots);
  };

  const toggleNode = (nodeId) => {
    setExpandedNodes(prev => ({
      ...prev,
      [nodeId]: !prev[nodeId]
    }));
  };

  const filteredCategories = useMemo(() => {
    if (!search.trim()) return categories;
    return categories.filter((cat) => {
      const matchSearch =
        cat.name?.toLowerCase().includes(search.toLowerCase()) ||
        cat.description?.toLowerCase().includes(search.toLowerCase());
      return matchSearch;
    });
  }, [categories, search]);

  useEffect(() => {
    buildTree(filteredCategories);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredCategories]);

  // ---- Form Handlers ----
  const handleOpenAddRoot = () => {
    setEditingCategory(null);
    setFormData({ name: "", description: "", parentId: "" });
    setIsRootMode(true);
    setIsFormOpen(true);
  };

  const handleOpenAddChild = (parentCat) => {
    setExpandedNodes(prev => ({ ...prev, [parentCat._id]: true }));
    setEditingCategory(null);
    setFormData({ name: "", description: "", parentId: parentCat._id });
    setIsRootMode(false);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (cat) => {
    setEditingCategory(cat);
    setFormData({ name: cat.name, description: cat.description, parentId: cat.parentId || "" });
    setIsRootMode(false);
    setIsFormOpen(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    // Issue 1: Chuyển alert thành thông báo Toast tiếng Việt
    if (!formData.name) {
      showToast("Vui lòng nhập tên danh mục!", "error");
      return;
    }

    setPendingData(formData);
    setConfirmAction(editingCategory ? 'edit' : 'add');
    setIsFormOpen(false);
    setIsConfirmOpen(true);
  };

  const handleToggleStatusClick = (cat) => {
    if (!cat.isActive && cat.parentId) {
      const parent = categories.find(c => c._id === cat.parentId);
      if (parent && !parent.isActive) {
        showToast("Không thể khôi phục danh mục con khi danh mục cha đang bị ẩn!", "error");
        return;
      }
    }

    setPendingData(cat);
    setConfirmAction('toggleStatus');
    setIsConfirmOpen(true);
  };

  // ---- API Executors ----
  const executeAdd = async (data) => {
    try {
      await categoryService.create({ name: data.name, description: data.description, parentId: data.parentId || null });
      fetchCategories();
      showToast("Thêm danh mục thành công!");
    } catch (err) {
      showToast(err.message || "Lỗi khi thêm danh mục", "error");
    }
  };

  const executeEdit = async (data) => {
    try {
      await categoryService.update(editingCategory._id, { name: data.name, description: data.description, parentId: data.parentId || null });
      fetchCategories();
      showToast("Cập nhật danh mục thành công!");
    } catch (err) {
      showToast(err.message || "Lỗi khi cập nhật danh mục", "error");
    }
  };

  const executeToggleStatus = async (cat) => {
    try {
      await categoryService.toggle(cat._id, !cat.isActive);
      fetchCategories();
      showToast("Thay đổi trạng thái thành công!");
    } catch (err) {
      showToast(err.message || "Lỗi khi thay đổi trạng thái", "error");
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
    return nodes.map(node => {
      const isExpanded = !!expandedNodes[node._id];
      const hasChildren = node.children && node.children.length > 0;

      return (
        <React.Fragment key={node._id}>
          <div
            className={`group flex items-center justify-between p-3 border-b hover:bg-[#faf9f7] transition-colors ${!node.isActive ? 'bg-[#faf9f7] opacity-60' : 'bg-white'}`}
            style={{ paddingLeft: `${level * 2 + 1}rem` }}
          >
            <div
              className={`flex items-center gap-3 ${hasChildren ? 'cursor-pointer' : ''}`}
              onClick={() => hasChildren && toggleNode(node._id)}
            >
              <div className="w-5 flex justify-center">
                {hasChildren && (
                  <FontAwesomeIcon
                    icon={isExpanded ? faChevronDown : faChevronRight}
                    className="text-[#999] hover:text-[#1a1a1a] transition-colors"
                  />
                )}
              </div>

              <FontAwesomeIcon
                icon={isExpanded || !hasChildren ? faFolderOpen : faFolder}
                className={node.isActive ? "text-[#1a1a1a]" : "text-[#999]"}
              />

              <span className={`font-medium ${!node.isActive ? 'line-through text-[#999]' : 'text-[#1a1a1a]'}`}>
                {node.name}
              </span>
            </div>
                  
            <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => { e.stopPropagation(); setViewingCategory(node); }}
                className="p-2 text-[#1a1a1a] hover:bg-[#eaeaea] rounded-full transition-colors flex items-center justify-center w-8 h-8"
                title="Xem chi tiết"
              >
                <FontAwesomeIcon icon={faInfoCircle} />
              </button>
              
              {/* Issue 7: Đưa nút Sửa (Edit) ra khỏi cụm kiểm tra node.isActive để có thể sửa danh mục bị ẩn */}
              <button
                onClick={(e) => { e.stopPropagation(); handleOpenEdit(node); }}
                className="p-2 text-[#1a1a1a] hover:bg-[#eaeaea] rounded-full transition-colors flex items-center justify-center w-8 h-8"
                title="Sửa danh mục"
              >
                <FontAwesomeIcon icon={faEdit} />
              </button>

              {node.isActive && (
                <button
                  onClick={(e) => { e.stopPropagation(); handleOpenAddChild(node); }}
                  className="p-2 text-[#1a1a1a] hover:bg-[#eaeaea] rounded-full transition-colors flex items-center justify-center w-8 h-8"
                  title="Thêm danh mục con"
                >
                  <FontAwesomeIcon icon={faPlus} />
                </button>
              )}
              
              <button
                onClick={(e) => { e.stopPropagation(); handleToggleStatusClick(node); }}
                className={`p-2 rounded-full transition-colors flex items-center justify-center w-8 h-8 ${node.isActive ? 'text-red-600 hover:bg-red-100' : 'text-green-600 hover:bg-green-100'}`}
                title={node.isActive ? 'Ẩn danh mục' : 'Khôi phục'}
              >
                <FontAwesomeIcon icon={node.isActive ? faEyeSlash : faEye} />
              </button>
            </div>
          </div>
          {hasChildren && isExpanded && (
            <div className="animate-fade-in">
              {renderTree(node.children, level + 1)}
            </div>
          )}
        </React.Fragment>
      );
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-[#1a1a1a]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            Quản lý Danh mục
          </h2>
          <p className="text-[#999] text-sm mt-1">
            Xem, thêm, sửa, quản lý trạng thái, hoặc ẩn danh mục
          </p>
        </div>
        <div>
          <Button icon={faPlus} label="Thêm danh mục gốc" variant="primary" onClick={handleOpenAddRoot} />
        </div>
      </div>
      
      <div className="bg-white rounded-2xl p-5 border border-[#eaeaea] shadow-sm flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <FontAwesomeIcon icon={faSearch} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#999] text-sm" />
          <Input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm theo tên danh mục..."
            className="!pl-10"
          />
        </div>
      </div>
      
      <div className="bg-white rounded-2xl p-5 border border-[#eaeaea] shadow-sm">
        {tree.length > 0 ? (
          <div className="border border-[#eaeaea] rounded-xl overflow-hidden">
            {renderTree(tree)}
          </div>
        ) : (
          <p className="text-center text-[#999] py-10">Chưa có danh mục nào.</p>
        )}
      </div>

      {/* Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-40 px-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 m-auto">
            <h2 className="text-xl font-bold mb-5 border-b border-[#eaeaea] pb-3 text-[#1a1a1a]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
              {editingCategory ? "Sửa danh mục" : (formData.parentId ? "Thêm danh mục con" : "Thêm danh mục gốc")}
            </h2>
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <Input label="Tên danh mục" name="name" value={formData.name} onChange={handleChange} required />

              {!isRootMode && (
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700">Danh mục cha</label>
                  <select
                    name="parentId"
                    value={formData.parentId}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-[#eaeaea] rounded-lg focus:border-[#1a1a1a] outline-none transition-colors bg-white text-sm"
                  >
                    <option value="">-- Không có (Danh mục gốc) --</option>
                    {categories
                      .filter(c => !editingCategory || c._id !== editingCategory._id) // Tránh tự chọn bản thân làm cha
                      .map(c => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <Input label="Mô tả" name="description" value={formData.description} onChange={handleChange} />

              <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-[#eaeaea]">
                <button 
                  type="button" 
                  onClick={() => setIsFormOpen(false)}
                  className="px-5 py-2 border border-[#eaeaea] text-gray-700 rounded-lg hover:bg-[#faf9f7] font-medium text-sm transition-colors"
                >
                  Hủy
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2 bg-[#1a1a1a] text-white rounded-lg hover:bg-[#333] font-medium text-sm transition-colors"
                >
                  Xác nhận
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={isConfirmOpen}
        onCancel={handleCancelConfirm}
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

      <CategoryDetailModal
        isOpen={!!viewingCategory}
        onClose={() => setViewingCategory(null)}
        category={viewingCategory}
        categories={categories}
        onSelectCategory={setViewingCategory}
      />
    </div>
  );
};

export default CategoriesPage;