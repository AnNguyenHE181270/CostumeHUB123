import React, { useState } from 'react';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faFolder, faSitemap, faLayerGroup, faCheckCircle, faChevronRight, faChevronDown } from "@fortawesome/free-solid-svg-icons";

const CategoryDetailModal = ({ isOpen, onClose, category, categories, onSelectCategory }) => {
  const [openPanel, setOpenPanel] = useState(null);

  if (!isOpen || !category) return null;

  const parentCat = categories.find(c => c._id === category.parentId);
  const childCats = categories.filter(c => c.parentId === category._id);

  const togglePanel = (panel) => {
    setOpenPanel((prev) => (prev === panel ? null : panel));
  };

  const handleSelectCategory = (selectedCat) => {
    if (!selectedCat || !onSelectCategory) return;
    onSelectCategory(selectedCat);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 py-6">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh] relative border border-[#efefef]">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center text-gray-500 hover:text-[#1a1a1a] hover:bg-gray-100 rounded-full transition-colors z-10"
        >
          <FontAwesomeIcon icon={faTimes} />
        </button>

        <div className="px-7 py-7 overflow-y-auto flex-1 space-y-5">
          <div className="rounded-2xl bg-gradient-to-r from-[#1f2937] via-[#374151] to-[#4b5563] p-5 text-white shadow-lg">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-gray-300">
                  <FontAwesomeIcon icon={faLayerGroup} />
                  Chi tiết danh mục
                </div>
                <h3 className="mt-2 text-2xl font-semibold" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                  {category.name}
                </h3>
              </div>
              <span className={`px-3 py-1 text-[11px] font-semibold rounded-full border ${category.isActive ? 'bg-emerald-500/20 text-emerald-200 border-emerald-400/30' : 'bg-rose-500/20 text-rose-200 border-rose-400/30'}`}>
                {category.isActive ? 'Đang hoạt động' : 'Đã ẩn'}
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-[#ececec] bg-[#fafafa] p-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#666] mb-2">
              <FontAwesomeIcon icon={faCheckCircle} className="text-[#16a34a]" />
              Mô tả danh mục
            </div>
            <p className="text-sm leading-6 text-[#333]">
              {category.description || <span className="text-[#999] italic">Không có mô tả.</span>}
            </p>
          </div>

          <div className="flex flex-col gap-4">
            {parentCat && (
              <div className="rounded-xl border border-[#ececec] bg-white p-4 shadow-sm text-left transition hover:border-[#1f2937] hover:shadow-md">
                <div className="flex items-center justify-between gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#888] mb-3">
                  <span className="flex items-center gap-2">
                    <FontAwesomeIcon icon={faFolder} className="text-[#999]" />
                    Danh mục cha
                  </span>
                  <button
                    type="button"
                    onClick={() => togglePanel('parent')}
                    className="text-[#999] hover:text-[#1f2937] transition"
                    aria-label="Mở/đóng thông tin danh mục cha"
                  >
                    <FontAwesomeIcon icon={openPanel === 'parent' ? faChevronDown : faChevronRight} />
                  </button>
                </div>
                <div className="text-sm font-medium text-[#1a1a1a]">
                  {openPanel === 'parent' ? null : (
                    <span className="font-semibold text-[#111827]">{parentCat.name}</span>
                  )}
                </div>
                {openPanel === 'parent' && (
                  <div className="mt-3 rounded-lg bg-[#f8fafc] p-3 text-sm text-[#4b5563]">
                    <button
                      type="button"
                      onClick={() => handleSelectCategory(parentCat)}
                      className="w-full rounded-lg border border-[#d1d5db] bg-white p-3 text-left font-semibold text-[#111827] hover:border-[#1f2937] hover:bg-[#f3f4f6] transition"
                    >
                      <p>{parentCat.name}</p>
                      <p className="mt-1 text-xs leading-5 text-[#6b7280]">
                        {parentCat.description || 'Danh mục cha này chưa có mô tả.'}
                      </p>
                    </button>
                  </div>
                )}
              </div>
            )}

            {childCats.length > 0 && (
              <div className="rounded-xl border border-[#ececec] bg-white p-4 shadow-sm text-left transition hover:border-[#1f2937] hover:shadow-md">
                <div className="flex items-center justify-between gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#888] mb-3">
                  <span className="flex items-center gap-2">
                    <FontAwesomeIcon icon={faSitemap} className="text-[#999]" />
                    Danh mục con ({childCats.length})
                  </span>
                  <button
                    type="button"
                    onClick={() => togglePanel('child')}
                    className="text-[#999] hover:text-[#1f2937] transition"
                    aria-label="Mở/đóng thông tin danh mục con"
                  >
                    <FontAwesomeIcon icon={openPanel === 'child' ? faChevronDown : faChevronRight} />
                  </button>
                </div>
                <div className="flex flex-col gap-2 max-h-24 overflow-y-auto pr-1">
                  {childCats.slice(0, 3).map((child) => (
                    <div key={child._id} className="text-left text-sm text-[#1a1a1a] font-medium">
                      {openPanel === 'child' ? null : child.name}
                    </div>
                  ))}
                </div>
                {openPanel === 'child' && (
                  <div className="mt-3 rounded-lg bg-[#f8fafc] p-3 text-sm text-[#4b5563]">
                    <div className="space-y-2">
                      {childCats.map((child) => (
                        <button
                          key={child._id}
                          type="button"
                          onClick={() => handleSelectCategory(child)}
                          className="w-full rounded-md border border-[#e5e7eb] bg-white px-3 py-2 text-left hover:bg-[#f9fafb] transition"
                        >
                          <p className="font-semibold text-[#111827]">{child.name}</p>
                          <p className="mt-1 text-xs leading-5 text-[#6b7280]">
                            {child.description || 'Danh mục con chưa có mô tả.'}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryDetailModal;