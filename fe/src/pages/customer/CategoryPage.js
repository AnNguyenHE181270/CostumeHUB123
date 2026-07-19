import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate, useSearchParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSpinner, faChevronDown, faChevronRight, faHouse, faTag,
  faTableCellsLarge, faList, faGift, faArrowRight,
  faMagnifyingGlass, faXmark, faGem,
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
    { label: "Mặc định", value: "newest" },
    { label: "Giá tăng dần", value: "price_asc" },
    { label: "Giá giảm dần", value: "price_desc" },
    { label: "Theo mới nhất", value: "newest" },
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

  // Sản phẩm bán chạy thật (theo số lượt thuê) — dùng để gắn badge BEST SELLER
  useEffect(() => {
    (async () => {
      try {
        const res = await rentalService.getTopRented(8);
        setBestSellerIds(new Set((res.items || []).map((it) => it.costume._id)));
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

  // Reset page when category, sort, or query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [categoryId, sort, query]);

  // Fetch Costumes
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

  const heading = query ? `Kết quả tìm kiếm: "${query}"` : (category ? category.name : "Tất Cả Sản Phẩm");
  const crumbLabel = query ? "Tìm kiếm" : (category ? category.name : "Tất cả sản phẩm");

  return (
    <div className="bg-[#f9f5ed] min-h-screen pb-20">

      {/* ── Hero banner ── */}
      <div className="relative min-h-[160px] lg:min-h-[185px] py-6 lg:py-8 overflow-hidden flex items-center border-b border-[#e8dfcd]">
        <img
          src={boutiqueImg}
          alt=""
          className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
          style={{ objectPosition: "50% 25%" }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#f7f2e8]/98 via-[#f5efe3]/90 to-[#f5efe3]/65 backdrop-blur-[2px]" />

        <div className="relative z-10 w-full max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="max-w-xl">
            <div className="flex items-center gap-2 mb-1">
              <FontAwesomeIcon icon={faGem} className="text-[10px] text-[#d4af37]" />
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#b8935a]">
                Bộ Sưu Tập
              </span>
            </div>
            <h1 className="text-[#1a1a1a] text-[30px] lg:text-[38px] font-bold leading-tight" style={SERIF}>
              {heading}
            </h1>
            <p className="text-[#665a45] text-[13px] mt-1 font-light leading-relaxed">
              Khám phá những thiết kế thời thượng — Tôn vinh phong cách của bạn
            </p>
          </div>
        </div>
      </div>


      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">

        {/* ── Breadcrumb ── */}
        <div className="flex items-center gap-2 text-[11px] text-[#8a7d63] uppercase tracking-widest py-4">
          <Link to="/" className="hover:text-[#1a1a1a] transition-colors flex items-center gap-1.5">
            <FontAwesomeIcon icon={faHouse} className="text-[10px]" />
          </Link>
          <FontAwesomeIcon icon={faChevronRight} className="text-[8px] text-[#c8ab7a]" />
          <span>Bộ sưu tập</span>
          <FontAwesomeIcon icon={faChevronRight} className="text-[8px] text-[#c8ab7a]" />
          <span className="text-[#1a1a1a] font-semibold">{crumbLabel}</span>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 pb-4">

          {/* ── Sidebar ── */}
          <aside className="w-full lg:w-[270px] flex-shrink-0 space-y-5">
            <div className="bg-white border border-[#eee2c8] p-6 shadow-sm rounded-2xl">
              <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-[#f0e9d5]">
                <span className="w-7 h-7 rounded-full bg-[#faf1dd] flex items-center justify-center text-[#b8935a]">
                  <FontAwesomeIcon icon={faTag} className="text-[12px]" />
                </span>
                <h3 className="text-[13px] font-bold text-[#1a1a1a] uppercase tracking-widest">
                  Danh mục dịch vụ
                </h3>
              </div>

              <ul className="space-y-1">
                <li>
                  <button
                    onClick={() => navigate("/collections")}
                    className={`w-full text-left py-2.5 px-3 text-[13px] uppercase tracking-wider font-medium rounded-lg transition-colors ${!categoryId ? "bg-[#faf1dd] text-[#8a6a3c] border-l-2 border-[#b8935a]" : "text-gray-600 hover:bg-gray-50 hover:text-black"}`}
                  >
                    Tất cả dịch vụ
                  </button>
                </li>
                {categories.map((cat) => {
                  const isActiveParent = categoryId === cat._id;
                  return (
                    <li key={cat._id} className="relative group">
                      <div className="flex items-center">
                        <button
                          onClick={() => navigate(`/category/${cat._id}`)}
                          className={`flex-1 text-left py-2.5 px-3 text-[13px] uppercase tracking-wider font-medium rounded-lg transition-colors ${isActiveParent ? "bg-[#faf1dd] text-[#8a6a3c] border-l-2 border-[#b8935a]" : "text-gray-600 hover:bg-gray-50 hover:text-black"}`}
                        >
                          {cat.name}
                        </button>
                      </div>

                      {cat.children && cat.children.length > 0 && (
                        <ul className="pl-4 mt-1 mb-2 space-y-1 border-l border-gray-100 ml-3">
                          {cat.children.map(child => (
                            <li key={child._id}>
                              <button
                                onClick={() => navigate(`/category/${child._id}`)}
                                className={`w-full text-left py-2 px-3 text-[12px] uppercase tracking-widest transition-colors ${categoryId === child._id ? "text-[#8a6a3c] font-semibold" : "text-gray-500 hover:text-black"}`}
                              >
                                {child.name}
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

            {/* Promo card */}
            <div className="bg-gradient-to-br from-[#2e2a22] to-[#463c2c] rounded-2xl p-5 text-white relative overflow-hidden">
              <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-white/5" />
              <span className="w-10 h-10 rounded-full bg-[#c8ab7a] flex items-center justify-center mb-3">
                <FontAwesomeIcon icon={faGift} className="text-[15px] text-white" />
              </span>
              <p className="text-[13px] font-semibold mb-1">Ưu đãi đặc biệt</p>
              <p className="text-[12px] text-white/70 leading-relaxed mb-4">
                Giảm lên đến 20% cho bộ sưu tập mới
              </p>
              <button
                onClick={() => navigate("/collections")}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <FontAwesomeIcon icon={faArrowRight} className="text-[12px]" />
              </button>
            </div>
          </aside>

          {/* ── Main ── */}
          <main className="flex-1">

            <div className="flex flex-wrap items-center gap-3 bg-white p-3.5 border border-[#eee2c8] shadow-sm rounded-2xl">
              {/* Search — trái */}
              <form onSubmit={handleSearchSubmit} className="flex-1 min-w-[220px]">
                <div className="search-bar-luxury rounded-full pl-4 pr-1.5 py-1 flex items-center gap-2 border border-[#e6ddc9] bg-[#faf9f7] focus-within:border-[#c9a869] transition-colors">
                  <FontAwesomeIcon icon={faMagnifyingGlass} className="text-[#b8935a] text-[13px] shrink-0" />
                  <input
                    type="text"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Tìm kiếm trang phục trong bộ sưu tập..."
                    className="flex-1 min-w-0 text-[13px] text-[#1a1a1a] placeholder-gray-400 bg-transparent border-none outline-none focus:ring-0"
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
                    className="shrink-0 bg-[#1a1a1a] text-[#f5e6ca] px-4 py-1.5 rounded-full font-bold text-[10px] uppercase tracking-[0.12em] luxury-btn-gold-shine hover:shadow-[0_4px_14px_rgba(184,147,90,0.3)] transition-all whitespace-nowrap"
                  >
                    Tìm kiếm
                  </button>
                </div>
              </form>

              {/* Sắp xếp + view toggle — phải */}
              <div className="flex items-center gap-3 ml-auto">
                <label className="text-[13px] text-gray-600 font-medium">Sắp xếp:</label>
                <div className="relative">
                  <select
                    value={sort}
                    onChange={handleSortChange}
                    className="appearance-none bg-[#faf9f7] border border-[#e6ddc9] text-gray-700 text-[13px] py-1.5 pl-3 pr-8 rounded-lg focus:outline-none focus:border-[#b8935a] cursor-pointer"
                  >
                    {sortOptions.map(opt => (
                      <option key={opt.value + opt.label} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <FontAwesomeIcon icon={faChevronDown} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-[10px] pointer-events-none" />
                </div>

                <div className="flex items-center gap-1 bg-[#faf9f7] border border-[#e6ddc9] rounded-lg p-1">
                  <button
                    onClick={() => setViewMode("grid")}
                    aria-label="Xem dạng lưới"
                    className={`w-8 h-8 rounded-md flex items-center justify-center transition-colors ${viewMode === "grid" ? "bg-[#b8935a] text-white" : "text-gray-500 hover:bg-gray-100"}`}
                  >
                    <FontAwesomeIcon icon={faTableCellsLarge} className="text-[12px]" />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    aria-label="Xem dạng danh sách"
                    className={`w-8 h-8 rounded-md flex items-center justify-center transition-colors ${viewMode === "list" ? "bg-[#b8935a] text-white" : "text-gray-500 hover:bg-gray-100"}`}
                  >
                    <FontAwesomeIcon icon={faList} className="text-[12px]" />
                  </button>
                </div>
              </div>
            </div>

            {/* Hiển thị N/M sản phẩm — nhỏ, ngoài khung, căn phải */}
            <div className="flex justify-end pr-1 mt-1.5 mb-4">
              <span className="text-[11px] text-[#8a7d63]">
                Hiển thị <b className="text-[#5c5340]">{costumes.length}</b> / {paginationData.totalItems} sản phẩm
              </span>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-32 text-[#999]">
                <FontAwesomeIcon icon={faSpinner} spin className="text-4xl mb-4" />
                <p className="text-[13px] uppercase tracking-[0.1em]">Đang tải dữ liệu...</p>
              </div>
            ) : costumes.length > 0 ? (
              <>
                <div className={viewMode === "grid" ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6" : "grid grid-cols-1 sm:grid-cols-2 gap-6"}>
                  {costumes.map((costume) => (
                    <div key={costume._id} className="h-full">
                      <ProductCard costume={costume} hideRentButton={true} isBestSeller={bestSellerIds.has(costume._id)} />
                    </div>
                  ))}
                </div>

                {paginationData.totalPages > 1 && (
                  <div className="mt-10 bg-white shadow-sm border border-[#eaeaea] rounded-2xl">
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
              <div className="flex flex-col items-center justify-center py-20 bg-white border border-[#eaeaea] rounded-2xl text-center">
                <svg className="w-16 h-16 text-[#e8e8e8] mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <h3 className="text-[18px] font-bold text-[#1a1a1a] mb-2" style={SERIF}>
                  Chưa có sản phẩm
                </h3>
                <p className="text-[13px] text-[#666]">
                  Hiện tại chưa có sản phẩm nào trong danh mục này.
                </p>
              </div>
            )}

          </main>
        </div>
      </div>
    </div>
  );
}
