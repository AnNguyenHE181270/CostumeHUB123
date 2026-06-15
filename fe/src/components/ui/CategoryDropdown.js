import React, { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilter, faChevronRight, faCheck } from '@fortawesome/free-solid-svg-icons';

export default function CategoryDropdown({ categories, value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const map = {};
  const roots = [];
  const childMap = {};

  categories.forEach(cat => {
    map[cat._id] = { ...cat };
  });

  categories.forEach(cat => {
    if (cat.parentId && map[cat.parentId]) {
      if (!childMap[cat.parentId]) childMap[cat.parentId] = [];
      childMap[cat.parentId].push(cat);
    } else {
      roots.push(cat);
    }
  });

  const parentCategories = roots;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (categoryId) => {
    onChange(categoryId);
    setIsOpen(false);
  };

  const getCategoryName = (id) => {
    if (!id) return "Tất cả danh mục";
    const cat = categories.find(c => c._id === id);
    return cat ? cat.name : "Tất cả danh mục";
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={`appearance-none bg-white border rounded-lg px-4 py-2.5 pr-8 text-sm outline-none cursor-pointer flex items-center justify-between min-w-[200px] transition-colors ${isOpen ? 'border-[#1a1a1a]' : 'border-[#eaeaea] hover:border-[#1a1a1a]'} text-[#1a1a1a] font-medium`}
      >
        <span className="truncate">{getCategoryName(value)}</span>
        <FontAwesomeIcon icon={faFilter} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#999] text-xs pointer-events-none" />
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-[#eaeaea] rounded-lg shadow-xl z-50 py-1 animate-fade-in">
          <div 
            className={`px-4 py-2.5 text-sm cursor-pointer hover:bg-gray-50 flex items-center justify-between transition-colors ${!value ? 'text-[#f94a00] font-semibold bg-[#fff5f0]' : 'text-[#555]'}`}
            onClick={() => handleSelect("")}
          >
            Tất cả danh mục
            {!value && <FontAwesomeIcon icon={faCheck} className="text-[#f94a00]" />}
          </div>
          
          {parentCategories.map(parent => {
            const children = childMap[parent._id] || [];
            const isSelected = value === parent._id;
            const hasChildren = children.length > 0;
            
            return (
              <div key={parent._id} className="relative group">
                <div 
                  className={`px-4 py-2.5 text-sm cursor-pointer hover:bg-gray-50 flex items-center justify-between transition-colors ${isSelected ? 'text-[#f94a00] font-semibold bg-[#fff5f0]' : 'text-[#555]'}`}
                  onClick={() => handleSelect(parent._id)}
                >
                  <span className="truncate pr-2">{parent.name}</span>
                  {hasChildren ? (
                    <FontAwesomeIcon icon={faChevronRight} className="text-xs text-[#999] group-hover:text-[#f94a00] transition-colors" />
                  ) : (
                    isSelected && <FontAwesomeIcon icon={faCheck} className="text-[#f94a00]" />
                  )}
                </div>

                {hasChildren && (
                  <div className="absolute top-0 left-[98%] w-56 bg-white border border-[#eaeaea] rounded-lg shadow-xl py-1 hidden group-hover:block animate-fade-in-right z-50 before:content-[''] before:absolute before:-left-2 before:top-0 before:w-2 before:h-full">
                    {children.map(child => {
                      const isChildSelected = value === child._id;
                      return (
                        <div 
                          key={child._id}
                          className={`px-4 py-2.5 text-sm cursor-pointer hover:bg-gray-50 flex items-center justify-between transition-colors ${isChildSelected ? 'text-[#f94a00] font-semibold bg-[#fff5f0]' : 'text-[#555]'}`}
                          onClick={() => handleSelect(child._id)}
                        >
                          <span className="truncate">{child.name}</span>
                          {isChildSelected && <FontAwesomeIcon icon={faCheck} className="text-[#f94a00]" />}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
