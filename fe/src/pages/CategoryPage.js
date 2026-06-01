import React, { useState, useEffect, useCallback } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import ProductCard from "../components/customer/ProductCard";
import FilterSidebar from "../components/customer/FilterSidebar";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBoxOpen } from "@fortawesome/free-solid-svg-icons";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:9999";

const SORT_OPTIONS = [
  { value: "newest", label: "Mới Nhất" },
  { value: "price_asc", label: "Giá Tăng Dần" },
  { value: "price_desc", label: "Giá Giảm Dần" },
  { value: "popular", label: "Phổ Biến" },
];

export default function CategoryPage() {
  const { categoryId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  const [category, setCategory] = useState(null);
  const [subCategories, setSubCategories] = useState([]);
  const [costumes, setCostumes] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    limit: 9,
  });
  const [loading, setLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  // Filters from URL search params
  const [filters, setFilters] = useState({
    minPrice: searchParams.get("minPrice") || "",
    maxPrice: searchParams.get("maxPrice") || "",
    status: searchParams.get("status") || "",
    subCategoryIds: searchParams.get("subCategoryIds")
      ? searchParams.get("subCategoryIds").split(",")
      : [],
  });
  const [sort, setSort] = useState(searchParams.get("sort") || "newest");
  const [page, setPage] = useState(
    parseInt(searchParams.get("page")) || 1
  );

  // Fetch category info and subcategories
  useEffect(() => {
    const fetchCategories = async () => {
      setCategoriesLoading(true);
      try {
        const res = await fetch(`${API_URL}/api/categories`);
        const data = await res.json();
        const allCategories = data.categories || [];

        // Find current category
        const current = allCategories.find((c) => c._id === categoryId);
        setCategory(current || null);

        // Find subcategories
        const subs = allCategories.filter(
          (c) =>
            c.parentId === categoryId ||
            (typeof c.parentId === "object" && c.parentId?.$oid === categoryId)
        );
        setSubCategories(subs);
      } catch (err) {
        console.error("Failed to fetch categories:", err);
      } finally {
        setCategoriesLoading(false);
      }
    };

    fetchCategories();
  }, [categoryId]);

  // Fetch costumes
  const fetchCostumes = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      
      // Only add categoryId if it exists (for Category route).
      // If it doesn't exist (for All Products route), we don't filter by category.
      if (categoryId) {
        params.set("categoryId", categoryId);
      }

      if (filters.minPrice) params.set("minPrice", filters.minPrice);
      if (filters.maxPrice) params.set("maxPrice", filters.maxPrice);
      if (filters.status) params.set("status", filters.status);
      params.set("sort", sort);
      params.set("page", page.toString());
      params.set("limit", "9");

      const res = await fetch(`${API_URL}/api/costumes?${params}`);
      const data = await res.json();

      let filteredCostumes = data.costumes || [];

      // Client-side subcategory filtering if specific subcategories selected
      if (filters.subCategoryIds && filters.subCategoryIds.length > 0) {
        filteredCostumes = filteredCostumes.filter((cos) => {
          const cosCategory =
            typeof cos.categoryId === "object"
              ? cos.categoryId?._id
              : cos.categoryId;
          return filters.subCategoryIds.includes(cosCategory);
        });
      }

      setCostumes(filteredCostumes);
      setPagination(
        data.pagination || {
          currentPage: 1,
          totalPages: 1,
          totalItems: filteredCostumes.length,
          limit: 9,
        }
      );
    } catch (err) {
      console.error("Failed to fetch costumes:", err);
      setCostumes([]);
    } finally {
      setLoading(false);
    }
  }, [categoryId, filters, sort, page]);

  useEffect(() => {
    fetchCostumes();
  }, [fetchCostumes]);

  // Sync filters to URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.minPrice) params.set("minPrice", filters.minPrice);
    if (filters.maxPrice) params.set("maxPrice", filters.maxPrice);
    if (filters.status) params.set("status", filters.status);
    if (filters.subCategoryIds && filters.subCategoryIds.length > 0) {
      params.set("subCategoryIds", filters.subCategoryIds.join(","));
    }
    if (sort !== "newest") params.set("sort", sort);
    if (page > 1) params.set("page", page.toString());

    setSearchParams(params, { replace: true });
  }, [filters, sort, page, setSearchParams]);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setPage(1); // Reset to first page on filter change
  };

  const handleSortChange = (e) => {
    setSort(e.target.value);
    setPage(1);
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Category Header */}
      <section className="bg-[#1a1a1a] py-10 md:py-14 px-6">
        <div className="mx-auto max-w-[1200px]">
          {categoriesLoading ? (
            <div className="h-20 animate-pulse" />
          ) : (
            <>
              <h1
                className="text-white text-3xl md:text-4xl font-bold tracking-tight"
                style={{ fontFamily: "'Cormorant Garamond', serif" }}
              >
                {categoryId ? (category?.name || "Đang tải...") : "Tất Cả Sản Phẩm"}
              </h1>
              {(category?.description && categoryId) && (
                <p className="mt-3 text-[14px] text-[#999] max-w-[600px] leading-relaxed">
                  {category.description}
                </p>
              )}
            </>
          )}
        </div>
      </section>

      {/* Main Content */}
      <section className="bg-[#faf9f7] py-8 md:py-12 px-6">
        <div className="mx-auto max-w-[1200px]">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar */}
            <div className="w-full lg:w-[260px] flex-shrink-0">
              <FilterSidebar
                subCategories={subCategories}
                filters={filters}
                onFilterChange={handleFilterChange}
              />
            </div>

            {/* Product Grid */}
            <div className="flex-1">
              {/* Top Bar */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
                <p className="text-[13px] text-[#999]">
                  Hiển thị{" "}
                  <span className="font-semibold text-[#1a1a1a]">
                    {costumes.length}
                  </span>{" "}
                  sản phẩm
                  {pagination.totalItems > 0 && (
                    <span>
                      {" "}
                      / tổng{" "}
                      <span className="font-semibold text-[#1a1a1a]">
                        {pagination.totalItems}
                      </span>
                    </span>
                  )}
                </p>

                <select
                  value={sort}
                  onChange={handleSortChange}
                  className="bg-white border border-[#e8e8e8] rounded-lg px-4 py-2.5
                             text-[13px] text-[#1a1a1a] font-medium outline-none
                             focus:border-[#999] transition-colors cursor-pointer"
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Products */}
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                  {[...Array(6)].map((_, i) => (
                    <div
                      key={i}
                      className="bg-white rounded-xl overflow-hidden border border-[#f0ece8]"
                    >
                      <div className="aspect-[3/4] bg-[#f5f3f0] animate-pulse" />
                      <div className="p-4 space-y-3">
                        <div className="h-3 bg-[#f0ece8] rounded animate-pulse w-1/3" />
                        <div className="h-4 bg-[#f0ece8] rounded animate-pulse w-2/3" />
                        <div className="h-3 bg-[#f0ece8] rounded animate-pulse w-1/2" />
                        <div className="h-5 bg-[#f0ece8] rounded animate-pulse w-1/3" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : costumes.length === 0 ? (
                /* Empty State */
                <div className="bg-white rounded-2xl border border-[#f0ece8] py-20 px-8 text-center">
                  <div className="w-20 h-20 mx-auto rounded-full bg-[#f5f3f0] flex items-center justify-center mb-6">
                    <FontAwesomeIcon
                      icon={faBoxOpen}
                      className="text-[28px] text-[#c4bdb5]"
                    />
                  </div>
                  <h3
                    className="text-[#1a1a1a] text-xl font-bold mb-2"
                    style={{ fontFamily: "'Cormorant Garamond', serif" }}
                  >
                    Chưa có sản phẩm
                  </h3>
                  <p className="text-[13px] text-[#999] max-w-[300px] mx-auto leading-relaxed">
                    Danh mục này chưa có sản phẩm nào. Vui lòng quay lại sau
                    hoặc khám phá các danh mục khác!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                  {costumes.map((costume) => (
                    <ProductCard key={costume._id} costume={costume} />
                  ))}
                </div>
              )}

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="mt-10 flex items-center justify-center gap-2">
                  <button
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page <= 1}
                    className="px-4 py-2 text-[12px] font-medium rounded border border-[#e8e8e8] bg-white
                               hover:bg-[#f5f5f5] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    ← Trước
                  </button>

                  {[...Array(pagination.totalPages)].map((_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`w-10 h-10 text-[12px] font-semibold rounded transition-colors ${
                          pageNum === page
                            ? "bg-[#1a1a1a] text-white"
                            : "bg-white border border-[#e8e8e8] hover:bg-[#f5f5f5] text-[#1a1a1a]"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page >= pagination.totalPages}
                    className="px-4 py-2 text-[12px] font-medium rounded border border-[#e8e8e8] bg-white
                               hover:bg-[#f5f5f5] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Sau →
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
