import React from 'react';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faCalendarAlt, faInfoCircle, faFolder, faSitemap } from "@fortawesome/free-solid-svg-icons";

const CategoryDetailModal = ({ isOpen, onClose, category, categories }) => {
  if (!isOpen || !category) return null;

  const parentCat = categories.find(c => c._id === category.parentId);
  const childCats = categories.filter(c => c.parentId === category._id);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#eaeaea] flex items-center justify-between bg-[#faf9f7]">
          <h2 className="text-xl font-semibold text-[#1a1a1a] flex items-center gap-2" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            <FontAwesomeIcon icon={faInfoCircle} className="text-[#999]" />
            Chi tiết danh mục
          </h2>
          <button onClick={onClose} className="text-[#999] hover:text-red-500 transition-colors">
            <FontAwesomeIcon icon={faTimes} className="text-lg" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 overflow-y-auto flex-1 space-y-6">
          
          {/* Header Info */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3">
              <h3 className="text-2xl font-bold text-[#1a1a1a]">{category.name}</h3>
              <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${category.isActive ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                {category.isActive ? "Đang hoạt động" : "Đã ẩn"}
              </span>
            </div>
            <p className="text-sm text-[#999] font-mono">ID: {category._id}</p>
          </div>

          {/* Description */}
          <div className="bg-[#faf9f7] rounded-lg p-4 border border-[#eaeaea]">
            <h4 className="text-sm font-semibold text-[#555] mb-2 uppercase tracking-wider">Mô tả</h4>
            <p className="text-[#1a1a1a] leading-relaxed">
              {category.description || <span className="text-[#999] italic">Không có mô tả cho danh mục này.</span>}
            </p>
          </div>

          {/* Hierarchy */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-[#555] uppercase tracking-wider flex items-center gap-2">
              <FontAwesomeIcon icon={faSitemap} className="text-[#999]" />
              Phân cấp danh mục
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="border border-[#eaeaea] rounded-lg p-3">
                <span className="block text-xs text-[#999] mb-1">Danh mục cha</span>
                <div className="flex items-center gap-2 text-[#1a1a1a]">
                  <FontAwesomeIcon icon={faFolder} className="text-[#999]" />
                  <span className="font-medium">{parentCat ? parentCat.name : <span className="italic text-[#999]">-- Danh mục gốc --</span>}</span>
                </div>
              </div>
              
              <div className="border border-[#eaeaea] rounded-lg p-3">
                <span className="block text-xs text-[#999] mb-1">Danh mục con ({childCats.length})</span>
                {childCats.length > 0 ? (
                  <div className="flex flex-col gap-1 mt-1 max-h-24 overflow-y-auto">
                    {childCats.map(child => (
                      <div key={child._id} className="text-sm text-[#1a1a1a] flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#ccc]"></div>
                        {child.name}
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="text-[#999] italic text-sm">Không có danh mục con</span>
                )}
              </div>
            </div>
          </div>

          {/* Timestamps */}
          <div className="border-t border-[#eaeaea] pt-4 grid grid-cols-2 gap-4">
            <div>
              <span className="flex items-center gap-1.5 text-xs text-[#999] mb-1">
                <FontAwesomeIcon icon={faCalendarAlt} /> Ngày tạo
              </span>
              <p className="text-sm font-medium text-[#1a1a1a]">{formatDate(category.createdAt)}</p>
            </div>
            <div>
              <span className="flex items-center gap-1.5 text-xs text-[#999] mb-1">
                <FontAwesomeIcon icon={faCalendarAlt} /> Cập nhật lần cuối
              </span>
              <p className="text-sm font-medium text-[#1a1a1a]">{formatDate(category.updatedAt)}</p>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#eaeaea] bg-white flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#1a1a1a] text-white rounded-lg hover:bg-black transition-colors font-medium text-sm"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default CategoryDetailModal;
