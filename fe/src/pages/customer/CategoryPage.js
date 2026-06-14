import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import ProductCard from "../../components/customer/ProductCard";

export default function CategoryPage() {
  const { categoryId } = useParams();
  const [costumes, setCostumes] = useState([]);
  const [category, setCategory] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategoryData = async () => {
      setLoading(true);
      try {
        // Fetch all categories to find the current one (if we don't have a single category endpoint)
        const catRes = await fetch(`${process.env.REACT_APP_API_URL}/api/categories`);
        if (catRes.ok) {
          const catData = await catRes.json();
          const currentCategory = catData.categories?.find(c => c._id === categoryId);
          if (currentCategory) setCategory(currentCategory);
        }

        // Fetch costumes
        const costRes = await fetch(`${process.env.REACT_APP_API_URL}/api/costumes?categoryId=${categoryId}&limit=50`);
        if (costRes.ok) {
          const costData = await costRes.json();
          setCostumes(costData.costumes || []);
        }
      } catch (err) {
        console.error("Failed to fetch category data:", err);
      } finally {
        setLoading(false);
      }
    };

    if (categoryId) {
      fetchCategoryData();
    }
  }, [categoryId]);

  return (
    <div className="bg-[#f9f5ed] min-h-screen pt-24 pb-20">
      <div className="max-w-[1200px] mx-auto px-6">
        
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-[32px] lg:text-[40px] font-bold text-[#1a1a1a] mb-4" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            {category ? category.name : "Danh mục"}
          </h1>
          {category?.description && (
            <p className="text-[14px] text-[#666] max-w-[600px] mx-auto leading-relaxed">
              {category.description}
            </p>
          )}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-[#999]">
            <FontAwesomeIcon icon={faSpinner} spin className="text-3xl mb-4" />
            <p className="text-[13px] uppercase tracking-[0.1em]">Đang tải dữ liệu...</p>
          </div>
        ) : costumes.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {costumes.map((costume) => (
              <ProductCard key={costume._id} costume={costume} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 bg-white border border-[#eaeaea] rounded-xl shadow-sm text-center">
            <svg className="w-16 h-16 text-[#e8e8e8] mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <h3 className="text-[18px] font-bold text-[#1a1a1a] mb-2" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
              Chưa có sản phẩm
            </h3>
            <p className="text-[13px] text-[#666]">
              Hiện tại chưa có sản phẩm nào trong danh mục này. Vui lòng quay lại sau!
            </p>
            <Link
              to="/"
              className="mt-6 px-6 py-2 bg-[#1a1a1a] text-white text-[12px] uppercase tracking-[0.1em] font-semibold rounded hover:bg-[#333] transition-colors"
            >
              Về trang chủ
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
