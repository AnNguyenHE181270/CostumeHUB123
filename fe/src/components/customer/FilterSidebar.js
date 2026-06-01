import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFilter } from "@fortawesome/free-solid-svg-icons";

const PRICE_OPTIONS = [
  { label: "Tất Cả Giá", min: "", max: "" },
  { label: "Dưới 150,000đ", min: "", max: "150000" },
  { label: "150,000 - 300,000đ", min: "150000", max: "300000" },
  { label: "Trên 300,000đ", min: "300000", max: "" },
];

const STATUS_OPTIONS = [
  { value: "available", label: "Còn Hàng" },
  { value: "rented", label: "Đang Thuê" },
  { value: "maintenance,dry_cleaning", label: "Bảo Trì / Đang Giặt" },
];

export default function FilterSidebar({
  allCategories = [],
  filters = {},
  onFilterChange,
}) {
  const {
    minPrice = "",
    maxPrice = "",
    status = "",
    subCategoryIds = [],
  } = filters;

  const handlePriceChange = (option) => {
    onFilterChange({
      ...filters,
      minPrice: option.min,
      maxPrice: option.max,
    });
  };

  const handleStatusChange = (statusValue) => {
    const currentStatuses = status ? status.split(",") : [];
    const statusValues = statusValue.split(",");

    let newStatuses;
    // Check if any of the status values are already selected
    const isSelected = statusValues.some((v) => currentStatuses.includes(v));

    if (isSelected) {
      newStatuses = currentStatuses.filter((s) => !statusValues.includes(s));
    } else {
      newStatuses = [...currentStatuses, ...statusValues];
    }

    onFilterChange({
      ...filters,
      status: newStatuses.filter(Boolean).join(","),
    });
  };

  const handleSubCategoryChange = (categoryId) => {
    const current = subCategoryIds || [];
    const newIds = current.includes(categoryId)
      ? current.filter((id) => id !== categoryId)
      : [...current, categoryId];

    onFilterChange({
      ...filters,
      subCategoryIds: newIds,
    });
  };

  const isPriceSelected = (option) => {
    return minPrice === option.min && maxPrice === option.max;
  };

  const isStatusSelected = (statusValue) => {
    const currentStatuses = status ? status.split(",") : [];
    const statusValues = statusValue.split(",");
    return statusValues.some((v) => currentStatuses.includes(v));
  };

  const clearFilters = () => {
    onFilterChange({
      minPrice: "",
      maxPrice: "",
      status: "",
      subCategoryIds: [],
    });
  };

  const hasActiveFilters = minPrice || maxPrice || status || (subCategoryIds && subCategoryIds.length > 0);

  return (
    <aside className="bg-white rounded-xl border border-[#f0ece8] p-5 sticky top-[160px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <FontAwesomeIcon icon={faFilter} className="text-[13px] text-[#1a1a1a]" />
          <h3 className="text-[14px] font-semibold text-[#1a1a1a]">Bộ Lọc</h3>
        </div>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-[11px] text-[#999] hover:text-[#1a1a1a] transition-colors underline"
          >
            Xóa bộ lọc
          </button>
        )}
      </div>

      {/* Category Tree */}
      {allCategories.length > 0 && (
        <div className="mb-6">
          <h4 className="text-[12px] uppercase tracking-[0.1em] font-semibold text-[#1a1a1a] mb-3">
            Danh Mục
          </h4>
          <div className="space-y-3">
            {allCategories
              .filter((c) => !c.parentId)
              .map((parent) => {
                const children = allCategories.filter(
                  (c) =>
                    c.parentId === parent._id ||
                    (typeof c.parentId === "object" && c.parentId?.$oid === parent._id)
                );
                return (
                  <div key={parent._id} className="space-y-1.5">
                    {/* Parent Checkbox */}
                    <label className="flex items-center gap-2.5 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={(subCategoryIds || []).includes(parent._id)}
                        onChange={() => handleSubCategoryChange(parent._id)}
                        className="w-4 h-4 rounded border-[#ddd] text-[#1a1a1a] focus:ring-[#1a1a1a] cursor-pointer"
                      />
                      <span className="text-[13px] font-medium text-[#1a1a1a] group-hover:text-[#666] transition-colors">
                        {parent.name}
                      </span>
                    </label>

                    {/* Children Checkboxes */}
                    {children.length > 0 && (
                      <div className="pl-6 space-y-1.5 mt-1.5">
                        {children.map((child) => (
                          <label
                            key={child._id}
                            className="flex items-center gap-2.5 cursor-pointer group"
                          >
                            <input
                              type="checkbox"
                              checked={(subCategoryIds || []).includes(child._id)}
                              onChange={() => handleSubCategoryChange(child._id)}
                              className="w-4 h-4 rounded border-[#ddd] text-[#1a1a1a] focus:ring-[#1a1a1a] cursor-pointer"
                            />
                            <span className="text-[13px] text-[#666] group-hover:text-[#1a1a1a] transition-colors">
                              {child.name}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Price Filter */}
      <div className="mb-6">
        <h4 className="text-[12px] uppercase tracking-[0.1em] font-semibold text-[#1a1a1a] mb-3">
          Giá Thuê
        </h4>
        <div className="space-y-2">
          {PRICE_OPTIONS.map((option, i) => (
            <label
              key={i}
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              <input
                type="radio"
                name="price"
                checked={isPriceSelected(option)}
                onChange={() => handlePriceChange(option)}
                className="w-4 h-4 border-[#ddd] text-[#1a1a1a] focus:ring-[#1a1a1a] cursor-pointer"
              />
              <span className="text-[13px] text-[#666] group-hover:text-[#1a1a1a] transition-colors">
                {option.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Status Filter */}
      <div>
        <h4 className="text-[12px] uppercase tracking-[0.1em] font-semibold text-[#1a1a1a] mb-3">
          Tình Trạng
        </h4>
        <div className="space-y-2">
          {STATUS_OPTIONS.map((option) => (
            <label
              key={option.value}
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              <input
                type="checkbox"
                checked={isStatusSelected(option.value)}
                onChange={() => handleStatusChange(option.value)}
                className="w-4 h-4 rounded border-[#ddd] text-[#1a1a1a] focus:ring-[#1a1a1a] cursor-pointer"
              />
              <span className="text-[13px] text-[#666] group-hover:text-[#1a1a1a] transition-colors">
                {option.label}
              </span>
            </label>
          ))}
        </div>
      </div>
    </aside>
  );
}
