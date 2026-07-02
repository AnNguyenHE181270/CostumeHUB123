import React, { useState, useEffect, useCallback, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSearch,
  faFilter,
  faSpinner,
  faBox,
  faChevronLeft,
  faChevronRight,
  faEye,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";
import CategoryDropdown from "../../components/ui/CategoryDropdown";
import costumeService from "../../services/costume.service";
import categoryService from "../../services/category.service";

// Trạng thái sản phẩm
const COSTUME_STATUSES = [
  { value: "",              label: "Tất cả trạng thái" },
  { value: "available",     label: "Còn trống",        bg: "bg-emerald-100", text: "text-emerald-700", dot: "bg-emerald-500" },
  { value: "rented",        label: "Đang thuê",        bg: "bg-blue-100",    text: "text-blue-700",    dot: "bg-blue-500" },
  { value: "maintenance",   label: "Bảo trì",          bg: "bg-yellow-100",  text: "text-yellow-700",  dot: "bg-yellow-500" },
  { value: "dry_cleaning",  label: "Giặt hấp",         bg: "bg-purple-100",  text: "text-purple-700",  dot: "bg-purple-500" },
  { value: "out_of_stock",  label: "Hết hàng",         bg: "bg-red-100",     text: "text-red-700",     dot: "bg-red-500" },
  { value: "hidden",        label: "Ẩn",               bg: "bg-gray-100",    text: "text-gray-500",    dot: "bg-gray-400" },
];

const getStatusStyle = (status) => {
  return COSTUME_STATUSES.find((s) => s.value === status) || { bg: "bg-gray-100", text: "text-gray-600", label: status, dot: "bg-gray-400" };
};

// Format tiền VNĐ
const formatPrice = (price) => {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price || 0);
};

export default function StaffProductsPage() {
  const [costumes, setCostumes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalItems: 0 });

  // Filters
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);

  // Detail modal
  const [selectedCostume, setSelectedCostume] = useState(null);
  
  // Search Autocomplete State
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchWrapperRef = useRef(null);

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await categoryService.getAll({ all: true });
        setCategories(data.categories || []);
      } catch (err) {
        console.error("Lỗi tải danh mục:", err);
      }
    };
    fetchCategories();
  }, []);

  // Fetch costumes
  const fetchCostumes = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 12, status: selectedStatus || "all" };
      if (search) params.search = search;
      if (selectedCategory) params.categoryId = selectedCategory;
      if (sort) params.sort = sort;

      const data = await costumeService.getAll(params);
      setCostumes(data.costumes || []);
      setPagination(data.pagination || { currentPage: 1, totalPages: 1, totalItems: 0 });
    } catch (err) {
      console.error("Lỗi tải sản phẩm:", err);
    } finally {
      setLoading(false);
    }
  }, [search, selectedCategory, selectedStatus, sort, page]);

  useEffect(() => {
    fetchCostumes();
  }, [fetchCostumes]);

  // Reset page khi filter thay đổi
  useEffect(() => {
    setPage(1);
  }, [search, selectedCategory, selectedStatus, sort]);

  // Handle click outside for suggestions
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchWrapperRef.current && !searchWrapperRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced fetch suggestions
  useEffect(() => {
    if (!searchInput.trim()) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const data = await costumeService.getAll({ search: encodeURIComponent(searchInput), limit: 5 });
        setSuggestions(data.costumes || []);
      } catch (err) {
        console.error("Lỗi lấy gợi ý:", err);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // Search submit
  const handleSearch = (e) => {
    if (e) e.preventDefault();
    setSearch(searchInput);
    setShowSuggestions(false);
  };

  // Tổng stock tính từ variants
  const getTotalStock = (costume) => {
    if (!costume.variants || costume.variants.length === 0) return 0;
    return costume.variants.reduce((sum, v) => sum + (v.availableStock || 0), 0);
  };

  const getTotalCapacity = (costume) => {
    if (!costume.variants || costume.variants.length === 0) return 0;
    return costume.variants.reduce((sum, v) => sum + (v.totalStock || 0), 0);
  };

  return (
    <div className="bg-[#faf9f7] min-h-screen flex flex-col">

      {/* === TOOLBAR === */}
      <div className="bg-white border-b border-[#eaeaea] px-6 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold text-[#1a1a1a]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            Tra cứu sản phẩm
          </h1>
          <span className="text-xs bg-[#f5f5f5] text-[#555] px-2 py-1 rounded">
            {pagination.totalItems} sản phẩm
          </span>
        </div>
      </div>

      {/* === CONTENT === */}
      <div className="flex-1 p-6 overflow-y-auto">

        {/* --- Filters Bar --- */}
        <div className="mb-6">
          <div className="flex flex-wrap items-center gap-4">

            {/* Search */}
            <form onSubmit={handleSearch} ref={searchWrapperRef} className="flex-1 min-w-[200px] relative z-30">
              <FontAwesomeIcon icon={faSearch} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#999] text-sm" />
              <input
                type="text"
                placeholder="Tìm kiếm sản phẩm..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSearch(e);
                }}
                className="w-full bg-white border border-[#eaeaea] rounded-lg py-2.5 pl-10 pr-4 text-sm outline-none focus:border-[#1a1a1a] transition-colors"
              />
              
              {showSuggestions && searchInput.trim() && (
                <div className="absolute top-full left-0 w-full mt-2 bg-white border border-[#eaeaea] rounded-lg shadow-xl overflow-hidden">
                  {isSearching ? (
                    <div className="flex items-center justify-center p-4 text-[#999]">
                      <FontAwesomeIcon icon={faSpinner} spin />
                    </div>
                  ) : suggestions.length > 0 ? (
                    <ul>
                      {suggestions.map(s => (
                        <li 
                          key={s._id}
                          className="px-4 py-3 hover:bg-[#fafafa] cursor-pointer flex items-center gap-3 border-b border-[#f5f5f5] last:border-0"
                          onClick={() => {
                            setSearchInput(s.name);
                            setSearch(s.name);
                            setShowSuggestions(false);
                            setSelectedCostume(s);
                          }}
                        >
                          <img src={s.images?.[0] || "https://via.placeholder.com/40"} alt={s.name} className="w-10 h-10 object-cover rounded bg-[#f5f5f5]" />
                          <div className="flex flex-col overflow-hidden">
                            <span className="text-sm text-[#1a1a1a] truncate font-medium">{s.name}</span>
                            <span className="text-xs text-[#999]">{s.sku || "N/A"}</span>
                          </div>
                        </li>
                      ))}
                      <li 
                        className="px-4 py-3 text-center bg-[#fafafa] text-[12px] font-semibold text-[#666] hover:text-[#1a1a1a] cursor-pointer"
                        onClick={handleSearch}
                      >
                        Xem tất cả kết quả &rarr;
                      </li>
                    </ul>
                  ) : (
                    <div className="p-4 text-sm text-[#999] text-center">
                      Không tìm thấy "{searchInput}"
                    </div>
                  )}
                </div>
              )}
            </form>

            {/* Category Filter */}
            <div className="relative z-20">
              <CategoryDropdown 
                categories={categories} 
                value={selectedCategory} 
                onChange={setSelectedCategory} 
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="appearance-none bg-white border border-[#eaeaea] rounded-lg px-4 py-2.5 pr-8 text-sm text-[#555] outline-none focus:border-[#1a1a1a] transition-colors cursor-pointer"
              >
                {COSTUME_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
              <FontAwesomeIcon icon={faFilter} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#999] text-xs pointer-events-none" />
            </div>

            {/* Sort */}
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="appearance-none bg-white border border-[#eaeaea] rounded-lg px-4 py-2.5 pr-8 text-sm text-[#555] outline-none focus:border-[#1a1a1a] transition-colors cursor-pointer"
            >
              <option value="newest">Mới nhất</option>
              <option value="oldest">Cũ nhất</option>
              <option value="price_asc">Giá tăng dần</option>
              <option value="price_desc">Giá giảm dần</option>
            </select>

            {/* Clear filters */}
            {(search || selectedCategory || selectedStatus) && (
              <button
                onClick={() => { setSearch(""); setSearchInput(""); setSelectedCategory(""); setSelectedStatus(""); }}
                className="text-sm text-[#999] hover:text-red-500 transition-colors flex items-center gap-1"
              >
                <FontAwesomeIcon icon={faTimes} className="text-xs" /> Xóa bộ lọc
              </button>
            )}
          </div>
        </div>

        {/* --- Product Grid --- */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <FontAwesomeIcon icon={faSpinner} className="text-2xl text-[#1a1a1a] animate-spin" />
          </div>
        ) : costumes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-[#999]">
            <FontAwesomeIcon icon={faBox} className="text-4xl mb-3" />
            <p className="text-sm">Không tìm thấy sản phẩm nào</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 mb-8">
            {costumes.map((costume) => {
              const statusStyle = getStatusStyle(costume.status);
              const available = getTotalStock(costume);
              const total = getTotalCapacity(costume);

              return (
                <div
                  key={costume._id}
                  className="bg-white border border-[#eaeaea] rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow group cursor-pointer"
                  onClick={() => setSelectedCostume(costume)}
                >
                  {/* Image */}
                  <div className="relative aspect-[3/4] bg-[#f5f5f5] overflow-hidden">
                    {costume.images?.[0] ? (
                      <img
                        src={costume.images[0]}
                        alt={costume.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#ccc]">
                        <FontAwesomeIcon icon={faBox} className="text-4xl" />
                      </div>
                    )}

                    {/* Status Badge */}
                    <span className={`absolute top-3 left-3 ${statusStyle.bg} ${statusStyle.text} px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1.5`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
                      {statusStyle.label}
                    </span>

                    {/* Quick view */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <span className="bg-white text-[#1a1a1a] px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 shadow-lg">
                        <FontAwesomeIcon icon={faEye} /> Xem chi tiết
                      </span>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    {/* Category */}
                    <p className="text-[10px] uppercase tracking-wider text-[#999] mb-1">
                      {costume.categoryId?.name || "Chưa phân loại"}
                    </p>

                    {/* Name */}
                    <h3 className="text-sm font-semibold text-[#1a1a1a] line-clamp-1 mb-2" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                      {costume.name}
                    </h3>

                    <p className="text-sm font-bold text-[#1a1a1a] mb-3">
                      {formatPrice(costume.rentalRates?.pricePerDay || costume.pricePerDay || costume.price)}
                      <span className="text-xs font-normal text-[#999]"> /ngày</span>
                    </p>

                    {/* Stock bar */}
                    <div className="flex items-center justify-between text-xs text-[#999] mb-1.5">
                      <span>Tồn kho</span>
                      <span className="font-medium text-[#555]">{available}/{total}</span>
                    </div>
                    <div className="w-full h-1.5 bg-[#f0f0f0] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          available === 0 ? "bg-red-400" : available <= 2 ? "bg-yellow-400" : "bg-emerald-400"
                        }`}
                        style={{ width: `${total > 0 ? (available / total) * 100 : 0}%` }}
                      />
                    </div>

                    {/* Sizes */}
                    {costume.variants && costume.variants.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {costume.variants.map((v, i) => (
                          <span
                            key={i}
                            className={`px-2 py-0.5 rounded text-[10px] font-medium border ${
                              v.availableStock > 0
                                ? "border-[#eaeaea] text-[#555] bg-white"
                                : "border-red-200 text-red-400 bg-red-50 line-through"
                            }`}
                          >
                            {v.size}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* --- Pagination --- */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pb-4">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="w-9 h-9 flex items-center justify-center rounded-lg border border-[#eaeaea] text-[#555] hover:bg-[#f5f5f5] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <FontAwesomeIcon icon={faChevronLeft} className="text-xs" />
            </button>

            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === pagination.totalPages || Math.abs(p - page) <= 1)
              .reduce((acc, p, i, arr) => {
                if (i > 0 && p - arr[i - 1] > 1) acc.push("...");
                acc.push(p);
                return acc;
              }, [])
              .map((p, i) =>
                p === "..." ? (
                  <span key={`dots-${i}`} className="px-2 text-[#999] text-sm">...</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                      p === page
                        ? "bg-[#1a1a1a] text-white"
                        : "border border-[#eaeaea] text-[#555] hover:bg-[#f5f5f5]"
                    }`}
                  >
                    {p}
                  </button>
                )
              )}

            <button
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={page >= pagination.totalPages}
              className="w-9 h-9 flex items-center justify-center rounded-lg border border-[#eaeaea] text-[#555] hover:bg-[#f5f5f5] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <FontAwesomeIcon icon={faChevronRight} className="text-xs" />
            </button>
          </div>
        )}
      </div>

      {/* === DETAIL MODAL === */}
      {selectedCostume && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setSelectedCostume(null)}>
          <div
            className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#eaeaea] sticky top-0 bg-white rounded-t-xl z-10">
              <h2 className="text-lg font-semibold text-[#1a1a1a]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                Chi tiết sản phẩm
              </h2>
              <button onClick={() => setSelectedCostume(null)} className="text-[#999] hover:text-[#1a1a1a] transition-colors p-1">
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <div className="flex flex-col md:flex-row gap-6">

                {/* Image */}
                <div className="md:w-2/5 flex-shrink-0">
                  <div className="aspect-[3/4] rounded-lg overflow-hidden bg-[#f5f5f5]">
                    {selectedCostume.images?.[0] ? (
                      <img src={selectedCostume.images[0]} alt={selectedCostume.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#ccc]">
                        <FontAwesomeIcon icon={faBox} className="text-5xl" />
                      </div>
                    )}
                  </div>
                  {/* Thumbnail strip */}
                  {selectedCostume.images?.length > 1 && (
                    <div className="flex gap-2 mt-3">
                      {selectedCostume.images.slice(0, 4).map((img, i) => (
                        <div key={i} className="w-14 h-14 rounded-md overflow-hidden border border-[#eaeaea] flex-shrink-0">
                          <img src={img} alt="" className="w-full h-full object-cover" />
                        </div>
                      ))}
                      {selectedCostume.images.length > 4 && (
                        <div className="w-14 h-14 rounded-md border border-[#eaeaea] flex items-center justify-center text-xs text-[#999]">
                          +{selectedCostume.images.length - 4}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 space-y-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-[#999] mb-1">{selectedCostume.categoryId?.name}</p>
                    <h3 className="text-xl font-bold text-[#1a1a1a]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                      {selectedCostume.name}
                    </h3>
                  </div>

                  {/* Status */}
                  {(() => {
                    const s = getStatusStyle(selectedCostume.status);
                    return (
                      <span className={`${s.bg} ${s.text} px-3 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1.5`}>
                        <span className={`w-2 h-2 rounded-full ${s.dot}`} />
                        {s.label}
                      </span>
                    );
                  })()}

                  {/* Pricing */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-[#faf9f7] rounded-lg p-3">
                      <p className="text-xs text-[#999] mb-1">Giá thuê / ngày</p>
                      <p className="text-lg font-bold text-[#1a1a1a]">{formatPrice(selectedCostume.rentalRates?.pricePerDay || selectedCostume.pricePerDay || selectedCostume.price)}</p>
                    </div>
                    <div className="bg-[#faf9f7] rounded-lg p-3">
                      <p className="text-xs text-[#999] mb-1">Tiền cọc</p>
                      <p className="text-lg font-bold text-[#1a1a1a]">{formatPrice(selectedCostume.deposit)}</p>
                    </div>
                  </div>

                  {/* Phạt trễ */}
                  {selectedCostume.lateFeePerDay > 0 && (
                    <div className="bg-red-50 rounded-lg p-3 flex items-center justify-between">
                      <p className="text-xs text-red-600">Phạt trễ / ngày</p>
                      <p className="text-sm font-bold text-red-600">{formatPrice(selectedCostume.lateFeePerDay)}</p>
                    </div>
                  )}

                  {/* Variants table */}
                  {selectedCostume.variants?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-[#555] uppercase tracking-wider mb-2">Biến thể & Tồn kho</p>
                      <div className="border border-[#eaeaea] rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-[#faf9f7] text-[#999] text-xs uppercase tracking-wider">
                              <th className="px-3 py-2 text-left">Size</th>
                              <th className="px-3 py-2 text-center">Còn</th>
                              <th className="px-3 py-2 text-center">Tổng</th>
                              <th className="px-3 py-2 text-center">Trạng thái</th>
                            </tr>
                          </thead>
                          <tbody className="text-[#555]">
                            {selectedCostume.variants.map((v, i) => {
                              const vs = getStatusStyle(v.status);
                              return (
                                <tr key={i} className="border-t border-[#f0f0f0]">
                                  <td className="px-3 py-2.5 font-medium text-[#1a1a1a]">{v.size}</td>
                                  <td className="px-3 py-2.5 text-center font-semibold">{v.availableStock || 0}</td>
                                  <td className="px-3 py-2.5 text-center">{v.totalStock || 0}</td>
                                  <td className="px-3 py-2.5 text-center">
                                    <span className={`${vs.bg} ${vs.text} px-2 py-0.5 rounded-full text-[10px] font-medium`}>{vs.label}</span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Specs */}
                  {selectedCostume.specifications && (
                    <div className="space-y-2">
                      {selectedCostume.specifications.material && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-[#999]">Chất liệu:</span>
                          <span className="text-[#555]">{selectedCostume.specifications.material}</span>
                        </div>
                      )}
                      {selectedCostume.specifications.includedAccessories && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-[#999]">Phụ kiện:</span>
                          <span className="text-[#555]">{selectedCostume.specifications.includedAccessories}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Description */}
                  {selectedCostume.description && (
                    <div>
                      <p className="text-xs font-semibold text-[#555] uppercase tracking-wider mb-1">Mô tả</p>
                      <p className="text-sm text-[#555] leading-relaxed">{selectedCostume.description}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
