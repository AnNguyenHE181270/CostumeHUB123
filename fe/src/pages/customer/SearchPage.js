import React, { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import ProductCard from "../../components/customer/ProductCard";

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  
  const [costumes, setCostumes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSearchResults = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${process.env.REACT_APP_API_URL || "http://localhost:9999"}/api/costumes?search=${encodeURIComponent(query)}&limit=50`);
        if (res.ok) {
          const data = await res.json();
          setCostumes(data.costumes || []);
        }
      } catch (err) {
        console.error("Failed to fetch search results:", err);
      } finally {
        setLoading(false);
      }
    };

    if (query) {
      fetchSearchResults();
    } else {
      setCostumes([]);
      setLoading(false);
    }
  }, [query]);

  return (
    <div className="bg-[#f9f5ed] min-h-screen pt-24 pb-20">
      <div className="max-w-[1200px] mx-auto px-6">
        
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-[32px] lg:text-[40px] font-bold text-[#1a1a1a] mb-4" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            Kết quả tìm kiếm
          </h1>
          <p className="text-[14px] text-[#666] max-w-[600px] mx-auto leading-relaxed">
            {query ? (
              <span>Tìm thấy <strong>{costumes.length}</strong> kết quả cho từ khóa "{query}"</span>
            ) : (
              <span>Vui lòng nhập từ khóa để tìm kiếm.</span>
            )}
          </p>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-[#999]">
            <FontAwesomeIcon icon={faSpinner} spin className="text-3xl mb-4" />
            <p className="text-[13px] uppercase tracking-[0.1em]">Đang tìm kiếm...</p>
          </div>
        ) : costumes.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {costumes.map((costume) => (
              <ProductCard key={costume._id} costume={costume} />
            ))}
          </div>
        ) : query ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white border border-[#eaeaea] rounded-xl shadow-sm text-center">
            <svg className="w-16 h-16 text-[#e8e8e8] mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <h3 className="text-[18px] font-bold text-[#1a1a1a] mb-2" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
              Không tìm thấy sản phẩm
            </h3>
            <p className="text-[13px] text-[#666]">
              Rất tiếc, chúng tôi không tìm thấy sản phẩm nào phù hợp với "{query}".
            </p>
            <Link
              to="/"
              className="mt-6 px-6 py-2 bg-[#1a1a1a] text-white text-[12px] uppercase tracking-[0.1em] font-semibold rounded hover:bg-[#333] transition-colors"
            >
              Về trang chủ
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  );
}
