import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSpinner, faChevronDown, faChevronRight, faHouse, faTag,
  faTableCellsLarge, faList,
  faMagnifyingGlass, faXmark, faGem, faCrown, faCheck,
} from "@fortawesome/free-solid-svg-icons";
import ProductCard from "../../components/customer/ProductCard";
import costumeService from "../../services/costume.service";
import categoryService from "../../services/category.service";
import rentalService from "../../services/rental.service";
import Pagination from "../../components/ui/Pagination";
import boutiqueImg from "../../assets/login-boutique.png";

const SERIF = { fontFamily: "'Cormorant Garamond', serif" };

export default function CategoryPage() {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const [costumes, setCostumes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState("newest");
  const [viewMode, setViewMode] = useState("grid");
  const [bestSellerIds, setBestSellerIds] = useState(new Set());
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const [searchInput, setSearchInput] = useState(query);

  // Sync searchInput when URL query changes
  useEffect(() => {
    setSearchInput(query);
  }, [query]);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [paginationData, setPaginationData] = useState({ totalPages: 1, totalItems: 0 });
  const LIMIT = 12;

  // Sort Options
  const sortOptions = [
    { label: "Mặc định (Mới nhất)", value: "newest" },
    { label: "Giá tăng dần", value: "price_asc" },
    { label: "Giá giảm dần", value: "price_desc" },
    { label: "Theo cũ nhất", value: "oldest" },
  ];

  // Search Submit Handler
  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    const trimmed = searchInput.trim();
    const newParams = new URLSearchParams(searchParams);
    if (trimmed) {
      newParams.set("q", trimmed);
    } else {
      newParams.delete("q");
    }
    setSearchParams(newParams);
  };

  // Clear Search Handler
  const handleClearSearch = () => {
    setSearchInput("");
    const newParams = new URLSearchParams(searchParams);
    newParams.delete("q");
    setSearchParams(newParams);
  };

  const [rentalCountMap, setRentalCountMap] = useState(new Map());

  // Sản phẩm bán chạy (theo số lượt thuê > 10) — dùng để gắn mác BEST SELLER
  useEffect(() => {
    (async () => {
      try {
        const res = await rentalService.getTopRented(50);
        const map = new Map();
        const bestSellerSet = new Set();
        (res.items || []).forEach((it) => {
          const costumeId = (it.costume?._id || it.costume || "").toString();
          const count = it.rentalCount || it.count || 0;
          if (costumeId) {
            map.set(costumeId, count);
            if (count > 10) {
              bestSellerSet.add(costumeId);
            }
          }
        });
        setRentalCountMap(map);
        setBestSellerIds(bestSellerSet);
      } catch (err) {
        console.error("Failed to fetch top rented:", err);
      }
    })();
  }, []);

  // Fetch Categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await categoryService.getAll();
        const cats = data.categories || [];
        const parents = cats.filter(c => !c.parentId);
        const tree = parents.map(p => ({
          ...p,
          children: cats.filter(c => c.parentId === p._id || (c.parentId && c.parentId.$oid === p._id))
        }));
        setCategories(tree);
        if (categoryId) {
          const current = cats.find(c => c._id === categoryId);
          setCategory(current);
        } else {
          setCategory(null);
        }
      } catch (err) {
        console.error("Failed to fetch categories:", err);
      }
    };
    fetchCategories();
  }, [categoryId]);

  useEffect(() => {
    setCurrentPage(1);
  }, [categoryId, sort, query]);

  useEffect(() => {
    const fetchCostumes = async () => {
      setLoading(true);
      try {
        const params = { limit: LIMIT, page: currentPage };
        if (categoryId) params.categoryId = categoryId;
        if (sort) params.sort = sort;
        if (query) params.search = query;

        const costData = await costumeService.getAll(params);
        setCostumes(costData.costumes || []);
        if (costData.pagination) {
          setPaginationData({
            totalPages: costData.pagination.totalPages,
            totalItems: costData.pagination.totalItems,
          });
        }
      } catch (err) {
        console.error("Failed to fetch costumes:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCostumes();
  }, [categoryId, sort, currentPage, query]);

  const handleSortChange = (e) => {
    setSort(e.target.value);
  };

  const heading = query ? `Kết quả tìm kiếm: "${query}"` : (category ? category.name : "Tất Cả Bộ Sưu Tập");

  return (
    <div className="bg-[#faf6f0] min-h-screen pb-20">

      {/* ── HERO BANNER SANG TRỌNG ── */}
      <div className="relative min-h-[175px] lg:min-h-[200px] py-8 lg:py-10 overflow-hidden flex items-center border-b border-[#e8dfcd]">
        <img
          src={boutiqueImg}
          alt=""
          className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none opacity-40"
          style={{ objectPosition: "50% 25%" }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#f7f2e8]/98 via-[#f5efe3]/92 to-[#f5efe3]/75 backdrop-blur-[2px]" />

        <div className="relative z-10 w-full max-w-[1400px] mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-xl"
          >
            <div className="flex items-center gap-2 mb-1.5">
              <FontAwesomeIcon icon={faGem} className="text-[11px] text-[#d4af37]" />
              <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#b8935a]">
                Haute Couture Catalog
              </span>
            </div>
            <h1 className="text-[#1a1a1a] text-[32px] lg:text-[42px] font-bold leading-tight" style={SERIF}>
              <span className="text-shine-black">{heading}</span>
            </h1>
            <p className="text-[#665a45] text-[13px] lg:text-[14px] mt-1 font-light leading-relaxed">
              Khám phá những thiết kế thời thượng & kiêu sa — Tôn vinh khí chất riêng của bạn
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <div className="flex flex-col lg:flex-row gap-8 mt-6 pb-4">

          {/* ── SIDEBAR CATEGORIES & GUARANTEE WIDGET ── */}
          <aside className="w-full lg:w-[280px] flex-shrink-0 space-y-6">
            {/* Category Tree Box */}
            <div className="bg-white border border-[#e6dcab]/80 p-6 shadow-md rounded-3xl">
              <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-[#f0e9d5]">
                <span className="w-8 h-8 rounded-full bg-gradient-to-br from-[#f8f3ea] to-[#efe5d3] flex items-center justify-center text-[#b8935a] shadow-sm">
                  <FontAwesomeIcon icon={faTag} className="text-[12px]" />
                </span>
                <div>
                  <h3 className="text-[13px] font-bold text-[#1a1a1a] uppercase tracking-wider">
                    Danh mục sản phẩm
                  </h3>
                  <span className="text-[10px] text-[#b8935a] tracking-widest font-medium">Boutique Collection</span>
                </div>
              </div>

              <ul className="space-y-1.5">
                <li>
                  <button
                    onClick={() => navigate("/collections")}
                    className={`w-full text-left py-2.5 px-3.5 text-[12px] uppercase tracking-wider font-bold rounded-xl transition-all ${!categoryId && !query
                      ? "bg-gradient-to-r from-[#faf1dd] to-[#f7ebd4] text-[#8a6a3c] border-l-3 border-[#b8935a] shadow-sm"
                      : "text-gray-600 hover:bg-[#faf6f0] hover:text-[#b8935a]"
                      }`}
                  >
                    Tất cả sản phẩm
                  </button>
                </li>

                {categories.map((cat) => {
                  const isActiveParent = categoryId === cat._id;
                  return (
                    <li key={cat._id} className="relative group">
                      <div className="flex items-center">
                        <button
                          onClick={() => navigate(`/category/${cat._id}`)}
                          className={`flex-1 text-left py-2.5 px-3.5 text-[12px] uppercase tracking-wider font-bold rounded-xl transition-all ${isActiveParent
                            ? "bg-gradient-to-r from-[#faf1dd] to-[#f7ebd4] text-[#8a6a3c] border-l-3 border-[#b8935a] shadow-sm"
                            : "text-gray-600 hover:bg-[#faf6f0] hover:text-[#b8935a]"
                            }`}
                        >
                          {cat.name}
                        </button>
                      </div>

                      {cat.children && cat.children.length > 0 && (
                        <ul className="pl-4 mt-1 mb-2 space-y-1 border-l-2 border-[#eee2c8] ml-4">
                          {cat.children.map((child) => (
                            <li key={child._id}>
                              <button
                                onClick={() => navigate(`/category/${child._id}`)}
                                className={`w-full text-left py-2 px-3 text-[11px] uppercase tracking-wider transition-all rounded-lg ${categoryId === child._id
                                  ? "text-[#8a6a3c] font-bold bg-[#faf1dd]/60"
                                  : "text-gray-500 hover:text-[#b8935a] hover:bg-gray-50"
                                  }`}
                              >
                                {categoryId === child._id ? "✦ " : ""}{child.name}
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* ── CAM KẾT CHẤT LƯỢNG (Thay thế cho Promo Card Giảm 20%) ── */}
            <div className="bg-gradient-to-br from-[#1a1a1a] via-[#2d2d2d] to-[#121212] rounded-3xl p-6 text-white border border-[#c9a869]/40 shadow-xl relative overflow-hidden">
              <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-[#c9a869]/10 blur-xl pointer-events-none" />

              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#d4af37] to-[#8a6a2f] flex items-center justify-center text-white text-xs shadow-md shrink-0">
                  <FontAwesomeIcon icon={faCrown} />
                </div>
                <div>
                  <h4 className="text-[13px] font-bold text-[#f5e6ca] uppercase tracking-wider" style={SERIF}>
                    Cam Kết Chất Lượng
                  </h4>
                  <span className="text-[10px] text-[#e8c471] uppercase tracking-widest block font-semibold">CostumeHUB Guarantee</span>
                </div>
              </div>

              <ul className="space-y-2.5 text-[12px] text-gray-300 font-light mb-5 border-t border-[#c9a869]/20 pt-4">
                <li className="flex items-center gap-2.5">
                  <FontAwesomeIcon icon={faCheck} className="text-[#d4af37] text-[11px] shrink-0" />
                  <span>100% Giặt khô & Khử trùng</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <FontAwesomeIcon icon={faCheck} className="text-[#d4af37] text-[11px] shrink-0" />
                  <span>Chuẩn phom dáng nhà thiết kế</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <FontAwesomeIcon icon={faCheck} className="text-[#d4af37] text-[11px] shrink-0" />
                  <span>Hỗ trợ đổi size & giao nhanh</span>
                </li>
              </ul>

              <button
                onClick={() => navigate("/about")}
                className="w-full py-2.5 bg-gradient-to-r from-[#d4af37] via-[#c9a35f] to-[#8a6a2f] text-white text-[11px] font-bold uppercase tracking-widest rounded-xl hover:brightness-110 transition-all text-center shadow-md luxury-btn-gold-shine border border-[#c9a869]/30"
              >
                Chính sách minh bạch
              </button>
            </div>
          </aside>

          {/* ── MAIN CONTENT ── */}
          <main className="flex-1">

            {/* Top Toolbar */}
            <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
              {/* Search input inside toolbar */}
              <form onSubmit={handleSearchSubmit} className="flex-1 min-w-[240px]">
                <div className="search-bar-luxury rounded-full pl-4 pr-1.5 py-1.5 flex items-center gap-2.5 border border-[#e2d5bd] bg-[#faf9f7] focus-within:border-[#c9a869] transition-colors">
                  <FontAwesomeIcon icon={faMagnifyingGlass} className="text-[#b8935a] text-[14px] shrink-0" />
                  <input
                    type="text"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Tìm kiếm trang phục trong bộ sưu tập..."
                    className="flex-1 min-w-0 text-[13px] text-[#1a1a1a] placeholder-gray-400 bg-transparent border-none outline-none focus:ring-0 font-medium"
                  />
                  {searchInput && (
                    <button
                      type="button"
                      onClick={handleClearSearch}
                      className="w-5 h-5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center text-[10px] transition-colors shrink-0"
                      title="Xóa tìm kiếm"
                    >
                      <FontAwesomeIcon icon={faXmark} />
                    </button>
                  )}
                  <button
                    type="submit"
                    className="shrink-0 bg-gradient-to-r from-[#1a1a1a] to-[#2d2d2d] text-[#f5e6ca] px-5 py-2 rounded-full font-bold text-[10px] uppercase tracking-[0.12em] luxury-btn-gold-shine border border-[#c9a869]/30 shadow-sm hover:shadow-[0_4px_14px_rgba(184,147,90,0.3)] transition-all whitespace-nowrap"
                  >
                    Tìm kiếm
                  </button>
                </div>
              </form>

              {/* Sắp xếp & View mode */}
              <div className="flex items-center gap-2 ml-auto">
                <label className="text-[12px] text-gray-500 font-semibold uppercase tracking-wider">Sắp xếp:</label>
                <div className="relative">
                  <select
                    value={sort}
                    onChange={handleSortChange}
                    className="appearance-none bg-[#faf9f7] p-6 border-2 border-[#e2d5bd] text-[#1a1a1a] text-[12px] font-semibold py-2 pl-3 pr-8 rounded-xl focus:outline-none focus:border-[#b8935a] cursor-pointer shadow-sm"
                  >
                    {sortOptions.map(opt => (
                      <option key={opt.value + opt.label} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <FontAwesomeIcon icon={faChevronDown} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-[10px] pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Product Grid */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-32 text-[#999]">
                <FontAwesomeIcon icon={faSpinner} spin className="text-4xl mb-4 text-[#b8935a]" />
                <p className="text-[12px] uppercase tracking-[0.15em] font-bold text-[#b8935a]">Đang tải bộ sưu tập...</p>
              </div>
            ) : costumes.length > 0 ? (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  className={viewMode === "grid" ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6" : "grid grid-cols-1 sm:grid-cols-2 gap-6"}
                >
                  {costumes.map((costume, idx) => {
                    const count = rentalCountMap.get(costume._id?.toString()) || costume.rentalCount || costume.rentCount || costume.totalRentals || 0;
                    const costumeWithCount = { ...costume, rentalCount: count };
                    const isBestSeller = count > 10 || bestSellerIds.has(costume._id?.toString());
                    return (
                      <motion.div
                        key={costume._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: idx * 0.04 }}
                        className="h-full"
                      >
                        <ProductCard costume={costumeWithCount} hideRentButton={true} isBestSeller={isBestSeller} />
                      </motion.div>
                    );
                  })}
                </motion.div>

                {paginationData.totalPages > 1 && (
                  <div className="mt-12 bg-white shadow-sm rounded-3xl">
                    <Pagination
                      displayCount={costumes.length}
                      totalCount={paginationData.totalItems}
                      currentPage={currentPage}
                      totalPages={paginationData.totalPages}
                      onPageChange={(page) => {
                        setCurrentPage(page);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                    />
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-24 bg-white border border-[#e6dcab] rounded-3xl text-center p-8 shadow-sm">
                <div className="w-16 h-16 rounded-full bg-[#faf6f0] border border-[#c9a869]/30 flex items-center justify-center mb-4 text-[#b8935a]">
                  <FontAwesomeIcon icon={faGem} className="text-2xl" />
                </div>
                <h3 className="text-[20px] font-bold text-[#1a1a1a] mb-2" style={SERIF}>
                  Không tìm thấy sản phẩm nào
                </h3>
                <p className="text-[13px] text-gray-500 font-light max-w-sm">
                  Rất tiếc, hiện tại không tìm thấy sản phẩm nào khớp với tiêu chí lựa chọn của bạn.
                </p>
                <button
                  onClick={() => {
                    handleClearSearch();
                    navigate("/collections");
                  }}
                  className="mt-6 px-6 py-2.5 bg-[#1a1a1a] text-[#f5e6ca] text-[11px] font-bold uppercase tracking-wider rounded-full hover:bg-[#b8935a] hover:text-white transition-all shadow-md"
                >
                  Xem tất cả bộ sưu tập
                </button>
              </div>
            )}

          </main>
        </div>
      </div>
    </div>
  );
}

