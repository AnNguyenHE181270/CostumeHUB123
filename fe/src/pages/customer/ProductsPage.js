import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFilter, faChevronDown } from "@fortawesome/free-solid-svg-icons";
import Pagination from "../../components/ui/Pagination";
import Toast from "../../components/ui/Toast";
import ProductCard from "../../components/customer/ProductCard";
import costumeService from "../../services/costume.service";
import categoryService from "../../services/category.service";

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(3);
  const [totalCount, setTotalCount] = useState(24);
  const [toast, setToast] = useState({ isVisible: false, message: "", type: "success" });
  
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [priceRange, setPriceRange] = useState("");
  const [sort, setSort] = useState("newest");

  // Fetch danh mục cho bộ lọc

  const fetchCategories = async () => {
    try {
      const data = await categoryService.getAll({ all: true });
      setCategories(data.categories || []);
    } catch (err) {
      setToast({ isVisible: true, type: "error", message: err.message || "Network error while loading data." });
    }
  };
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: currentPage, limit: 9 };
      if (selectedCategories.length > 0) params.subCategoryIds = selectedCategories.join(',');
      if (priceRange === "under200") params.maxPrice = 200000;
      if (priceRange === "200to500") { params.minPrice = 200000; params.maxPrice = 500000; }
      if (priceRange === "over500") params.minPrice = 500000;
      if (sort) params.sort = sort;

      const data = await costumeService.getAll(params);
      setProducts(data.costumes || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalCount(data.pagination?.totalItems || 0);
    } catch (err) {
      setToast({ isVisible: true, type: "error", message: err.message || "Network error while loading data." });
    } finally {
      setLoading(false);
    }
  }, [currentPage, selectedCategories, priceRange, sort]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleCategoryChange = (catId) => {
    setSelectedCategories(prev => 
      prev.includes(catId) ? prev.filter(id => id !== catId) : [...prev, catId]
    );
    setCurrentPage(1);
  };

  const handlePriceChange = (val) => {
    setPriceRange(val);
    setCurrentPage(1);
  };

  const handleSortChange = (e) => {
    setSort(e.target.value);
    setCurrentPage(1);
  };

  return (
    <div className="bg-[#faf9f7] min-h-screen pt-[120px] pb-20">
      {toast.isVisible && <Toast type={toast.type} message={toast.message} onClose={() => setToast({ ...toast, isVisible: false })} />}
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        {/* Banner / Tiêu đề */}
        <div className="text-center mb-12">
          <h1 className="text-4xl lg:text-5xl font-semibold text-[#1a1a1a] mb-4" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            Trang Phục Cho Thuê
          </h1>
          <p className="text-[#555] max-w-2xl mx-auto">
            Khám phá bộ sưu tập trang phục đa dạng từ váy cưới lộng lẫy, vest lịch lãm đến trang phục truyền thống. Chúng tôi luôn cập nhật những xu hướng mới nhất.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-10">
          {/* Sidebar - Bộ Lọc */}
          <div className="w-full lg:w-[280px] flex-shrink-0">
            <div className="bg-white p-6 rounded-xl border border-[#eaeaea] sticky top-[140px]">
              <div className="flex items-center gap-2 mb-6 border-b border-[#eaeaea] pb-4">
                <FontAwesomeIcon icon={faFilter} className="text-[#555]" />
                <h2 className="text-lg font-medium text-[#1a1a1a] uppercase tracking-wide">Bộ Lọc</h2>
              </div>

              {/* Danh mục */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-[#1a1a1a] mb-3 uppercase tracking-wide">Danh Mục</h3>
                <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                  {categories.map((cat) => (
                    <label key={cat._id} className="flex items-center gap-2 cursor-pointer group">
                      <input 
                        type="checkbox" 
                        checked={selectedCategories.includes(cat._id)}
                        onChange={() => handleCategoryChange(cat._id)}
                        className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black accent-black cursor-pointer" 
                      />
                      <span className="text-sm text-[#555] group-hover:text-black transition-colors">{cat.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Khoảng giá */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-[#1a1a1a] mb-3 uppercase tracking-wide">Mức Giá (Ngày)</h3>
                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input type="radio" name="price" checked={priceRange === ""} onChange={() => handlePriceChange("")} className="w-4 h-4 border-gray-300 text-black focus:ring-black accent-black cursor-pointer" />
                    <span className="text-sm text-[#555] group-hover:text-black transition-colors">Tất cả</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input type="radio" name="price" checked={priceRange === "under200"} onChange={() => handlePriceChange("under200")} className="w-4 h-4 border-gray-300 text-black focus:ring-black accent-black cursor-pointer" />
                    <span className="text-sm text-[#555] group-hover:text-black transition-colors">Dưới 200,000đ</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input type="radio" name="price" checked={priceRange === "200to500"} onChange={() => handlePriceChange("200to500")} className="w-4 h-4 border-gray-300 text-black focus:ring-black accent-black cursor-pointer" />
                    <span className="text-sm text-[#555] group-hover:text-black transition-colors">200,000đ - 500,000đ</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input type="radio" name="price" checked={priceRange === "over500"} onChange={() => handlePriceChange("over500")} className="w-4 h-4 border-gray-300 text-black focus:ring-black accent-black cursor-pointer" />
                    <span className="text-sm text-[#555] group-hover:text-black transition-colors">Trên 500,000đ</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Nội dung chính - Danh sách sản phẩm */}
          <div className="flex-1">
            {/* Thanh công cụ Sorting */}
            <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-4 rounded-xl border border-[#eaeaea] mb-6">
              <span className="text-sm text-[#555] mb-4 sm:mb-0">Hiển thị <span className="font-bold text-black">{products.length}</span> kết quả</span>
              
              <div className="flex items-center gap-3">
                <span className="text-sm text-[#555]">Sắp xếp:</span>
                <div className="relative">
                  <select value={sort} onChange={handleSortChange} className="appearance-none bg-[#faf9f7] border border-[#eaeaea] text-sm text-[#1a1a1a] py-2 pl-4 pr-10 rounded-md focus:outline-none focus:border-black cursor-pointer">
                    <option value="newest">Mới nhất</option>
                    <option value="price_asc">Giá: Thấp đến Cao</option>
                    <option value="price_desc">Giá: Cao đến Thấp</option>
                    <option value="popular">Xem nhiều nhất</option>
                  </select>
                  <FontAwesomeIcon icon={faChevronDown} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#999] pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Grid Sản Phẩm */}
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((item) => (
                  <div key={item._id} className="h-full">
                    <ProductCard costume={item} hideRentButton={true} />
                  </div>
                ))}
              </div>
            )}
            
            {/* Phân trang */}
            <div className="mt-12 bg-white rounded-xl border border-[#eaeaea] overflow-hidden">
              <Pagination
                displayCount={products.length}
                totalCount={totalCount}
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(page) => {
                  setCurrentPage(page);
                  window.scrollTo({ top: 0, behavior: 'smooth' }); // Cuộn lên đầu khi chuyển trang
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
