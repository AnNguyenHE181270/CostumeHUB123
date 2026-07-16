import React from 'react';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheckCircle,
  faTimesCircle,
} from "@fortawesome/free-solid-svg-icons";
import Modal from "../Modal";



const CategoryDetailModal = ({ isOpen, onClose, category, categories }) => {
  if (!category) return null;

  const parentCat = categories?.find(c => c._id === category.parentId) || null;
  const childCats = categories?.filter(c => c.parentId === category._id) || [];
  const isActive = !!category.isActive;

  const fieldCls = "w-full px-4 py-2.5 border border-[#eaeaea] rounded-lg bg-[#faf9f7] text-sm text-[#1a1a1a] min-h-[42px] flex items-center";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Chi tiết danh mục"
      size="md"
      footer={
        <button
          onClick={onClose}
          className="px-5 py-2 bg-[#1a1a1a] text-white rounded-lg hover:bg-[#333] font-medium text-sm transition-colors"
        >
          Đóng
        </button>
      }
    >
      <div className="space-y-4">

        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2 flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Tên danh mục</label>
            <div className={fieldCls}>
              <span className="font-semibold truncate">{category.name}</span>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Trạng thái</label>
            <span className={`w-fit px-3 py-3 inline-flex items-center gap-2 text-xs font-semibold rounded-full border ${isActive
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-rose-50 text-rose-700 border-rose-200'
              }`}>
              <FontAwesomeIcon icon={isActive ? faCheckCircle : faTimesCircle} />
              {isActive ? 'Đang hoạt động' : 'Đã ẩn'}
            </span>
          </div>
        </div>



        {parentCat && (
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Danh mục cha</label>
            <div className={fieldCls}>
              <span className="font-medium truncate">{parentCat.name}</span>
            </div>
          </div>
        )}

        {childCats.length > 0 && (
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Danh mục con ({childCats.length})</label>
            <div className="flex flex-col gap-2">
              {childCats.map(child => (
                <div key={child._id} className={fieldCls}>
                  <span className="font-medium truncate">{child.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Mô tả</label>
          <div className={fieldCls}>
            {category.description
              ? <span>{category.description}</span>
              : <em className="text-[#bbb]">Chưa có mô tả.</em>
            }
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default CategoryDetailModal;