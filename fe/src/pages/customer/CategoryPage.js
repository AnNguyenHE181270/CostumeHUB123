import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate, useSearchParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner, faChevronDown } from "@fortawesome/free-solid-svg-icons";
import ProductCard from "../../components/customer/ProductCard";
import costumeService from "../../services/costume.service";
import categoryService from "../../services/category.service";
import Pagination from "../../components/ui/Pagination";

export default function CategoryPage() {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const [costumes, setCostumes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState("newest");
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  
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

  // Fetch Categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await categoryService.getAll({ all: true });
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

  return (
    <div className="bg-[#f9f5ed] min-h-screen pt-12 pb-20">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b border-[#e8dfc8] pb-4">
          <h1 className="text-[28px] lg:text-[32px] font-bold text-[#1a1a1a] uppercase tracking-wide" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            {query ? `Kết quả tìm kiếm: "${query}"` : (category ? category.name : "TẤT CẢ SẢN PHẨM")}
          </h1>
          <div className="text-[12px] text-[#666] mt-2 md:mt-0 uppercase tracking-widest flex items-center gap-2">
            <Link to="/" className="hover:text-black">Trang chủ</Link> 
            <span>/</span> 
            <span className="text-black font-semibold">{query ? "Tìm kiếm" : (category ? category.name : "Bộ sưu tập")}</span>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-10">
          
          <aside className="w-full lg:w-[280px] flex-shrink-0">
            <div className="bg-white border border-[#eaeaea] p-6 shadow-sm rounded-sm">
              <h3 className="text-[15px] font-bold text-[#1a1a1a] mb-6 uppercase tracking-widest border-b border-gray-100 pb-3">
                DANH MỤC DỊCH VỤ
              </h3>
              
              <ul className="space-y-1">
                <li>
                  <button 
                    onClick={() => navigate("/collections")}
                    className={`w-full text-left py-2.5 px-3 text-[13px] uppercase tracking-wider font-medium transition-colors ${!categoryId ? "bg-gray-100 text-black border-l-2 border-black" : "text-gray-600 hover:bg-gray-50 hover:text-black"}`}
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
                          className={`flex-1 text-left py-2.5 px-3 text-[13px] uppercase tracking-wider font-medium transition-colors ${isActiveParent ? "bg-gray-100 text-black border-l-2 border-black" : "text-gray-600 hover:bg-gray-50 hover:text-black"}`}
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
                                className={`w-full text-left py-2 px-3 text-[12px] uppercase tracking-widest transition-colors ${categoryId === child._id ? "text-black font-semibold" : "text-gray-500 hover:text-black"}`}
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
          </aside>

          <main className="flex-1">
            
            <div className="flex justify-between items-center mb-6 bg-white p-3 border border-[#eaeaea] shadow-sm rounded-sm">
              <div className="text-[15px] text-[#1a1a1a] font-bold uppercase tracking-wider hidden sm:block truncate pr-4" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                {query ? `TÌM KIẾM: ${query}` : (category ? category.name : "TẤT CẢ SẢN PHẨM")}
              </div>
              <div className="flex items-center gap-3 ml-auto">
                <label className="text-[13px] text-gray-600 font-medium">Sắp xếp:</label>
                <div className="relative">
                  <select 
                    value={sort} 
                    onChange={handleSortChange}
                    className="appearance-none bg-[#f9f9f9] border border-gray-200 text-gray-700 text-[13px] py-1.5 pl-3 pr-8 rounded focus:outline-none focus:border-gray-400 cursor-pointer"
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

            {loading ? (
              <div className="flex flex-col items-center justify-center py-32 text-[#999]">
                <FontAwesomeIcon icon={faSpinner} spin className="text-4xl mb-4" />
                <p className="text-[13px] uppercase tracking-[0.1em]">Đang tải dữ liệu...</p>
              </div>
            ) : costumes.length > 0 ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {costumes.map((costume) => (
                    <div key={costume._id} className="h-full">
                      <ProductCard costume={costume} hideRentButton={true} />
                    </div>
                  ))}
                </div>
                
                {paginationData.totalPages > 1 && (
                  <div className="mt-10 bg-white shadow-sm border border-[#eaeaea] rounded-sm">
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
              <div className="flex flex-col items-center justify-center py-20 bg-white border border-[#eaeaea] rounded-sm text-center">
                <svg className="w-16 h-16 text-[#e8e8e8] mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <h3 className="text-[18px] font-bold text-[#1a1a1a] mb-2" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
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
