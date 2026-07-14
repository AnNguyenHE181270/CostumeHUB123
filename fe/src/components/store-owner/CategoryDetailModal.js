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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 px-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] relative">
        
        {/* Nút đóng */}
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-[#1a1a1a] hover:bg-gray-100 rounded-full transition-colors z-10"
        >
          <FontAwesomeIcon icon={faTimes} />
        </button>

        {/* Body */}
        <div className="px-8 py-8 overflow-y-auto flex-1 space-y-6">
          
          {/* Header Info */}
          <div className="flex flex-col gap-2 border-b border-[#eaeaea] pb-4">
            <div className="flex items-center gap-3">
              <h3 className="text-2xl font-bold text-[#1a1a1a]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                {category.name}
              </h3>
              <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full border ${category.isActive ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                {category.isActive ? "Đang hoạt động" : "Đã ẩn"}
              </span>
            </div>
            <p className="text-xs text-[#999] font-mono flex items-center gap-1">
              <FontAwesomeIcon icon={faInfoCircle} /> ID: {category._id}
            </p>
          </div>

          {/* Description */}
          <div className="bg-[#faf9f7] rounded-lg p-5 border border-[#eaeaea]">
            <h4 className="text-xs font-bold text-[#555] mb-2 uppercase tracking-wider">Mô tả danh mục</h4>
            <p className="text-[#1a1a1a] text-sm leading-relaxed">
              {category.description || <span className="text-[#999] italic">Không có mô tả.</span>}
            </p>
          </div>

          {/* Hierarchy */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-[#555] uppercase tracking-wider flex items-center gap-2">
              <FontAwesomeIcon icon={faSitemap} className="text-[#999]" />
              Phân cấp cây danh mục
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="border border-[#eaeaea] rounded-lg p-4 bg-white shadow-sm">
                <span className="block text-[10px] font-semibold text-[#999] uppercase tracking-wider mb-2">Danh mục cha</span>
                <div className="flex items-center gap-2 text-[#1a1a1a] text-sm">
                  <FontAwesomeIcon icon={faFolder} className="text-[#999]" />
                  <span className="font-medium">{parentCat ? parentCat.name : <span className="italic text-[#999]">-- Gốc --</span>}</span>
                </div>
              </div>
              
              <div className="border border-[#eaeaea] rounded-lg p-4 bg-white shadow-sm">
                <span className="block text-[10px] font-semibold text-[#999] uppercase tracking-wider mb-2">Danh mục con ({childCats.length})</span>
                {childCats.length > 0 ? (
                  <div className="flex flex-col gap-1.5 mt-1 max-h-24 overflow-y-auto">
                    {childCats.map(child => (
                      <div key={child._id} className="text-sm text-[#1a1a1a] flex items-center gap-2 font-medium">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#1a1a1a]"></div>
                        {child.name}
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="text-[#999] italic text-sm">Không có nhánh con</span>
                )}
              </div>
            </div>
          </div>

          {/* Timestamps */}
          <div className="border-t border-[#eaeaea] pt-5 grid grid-cols-2 gap-4">
            <div>
              <span className="flex items-center gap-1.5 text-[10px] font-semibold text-[#999] uppercase tracking-wider mb-1">
                <FontAwesomeIcon icon={faCalendarAlt} /> Ngày tạo
              </span>
              <p className="text-sm font-medium text-[#1a1a1a]">{formatDate(category.createdAt)}</p>
            </div>
            <div>
              <span className="flex items-center gap-1.5 text-[10px] font-semibold text-[#999] uppercase tracking-wider mb-1">
                <FontAwesomeIcon icon={faCalendarAlt} /> Cập nhật lần cuối
              </span>
              <p className="text-sm font-medium text-[#1a1a1a]">{formatDate(category.updatedAt)}</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default CategoryDetailModal;