import React, { useState, useEffect } from "react";
import HeroSection from "../components/customer/HeroSection";
import FeatureBar from "../components/customer/FeatureBar";
import CategoryCard from "../components/customer/CategoryCard";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:9999";

export default function HomePage() {
  const [categories, setCategories] = useState([]);
  const [costumeCounts, setCostumeCounts] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch categories
        const catRes = await fetch(`${API_URL}/api/categories`);
        const catData = await catRes.json();
        const allCategories = catData.categories || [];
        setCategories(allCategories);

        // Fetch all costumes to count per category
        const cosRes = await fetch(`${API_URL}/api/costumes?limit=50`);
        const cosData = await cosRes.json();
        const costumes = cosData.costumes || [];

        // Build count map: for each parent category, count costumes in it and its children
        const parentCats = allCategories.filter((c) => !c.parentId);
        const counts = {};

        parentCats.forEach((parent) => {
          // Find child category IDs
          const childIds = allCategories
            .filter(
              (c) =>
                c.parentId &&
                (c.parentId === parent._id ||
                  (typeof c.parentId === "object" && c.parentId?.$oid === parent._id) ||
                  c.parentId === parent._id)
            )
            .map((c) => c._id);

          const allIds = [parent._id, ...childIds];

          // Count costumes belonging to these categories
          const count = costumes.filter((cos) => {
            const cosCategory =
              typeof cos.categoryId === "object"
                ? cos.categoryId?._id
                : cos.categoryId;
            return allIds.includes(cosCategory);
          }).length;

          counts[parent._id] = count;
        });

        setCostumeCounts(counts);
      } catch (err) {
        console.error("Failed to fetch data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const parentCategories = categories.filter((c) => !c.parentId);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <HeroSection />

      {/* Feature Highlights */}
      <FeatureBar />

      {/* Category Section */}
      <section id="category-section" className="bg-[#faf9f7] py-16 md:py-20 px-6">
        <div className="mx-auto max-w-[1200px]">
          {/* Section Header */}
          <div className="text-center mb-12">
            <h2
              className="text-[#1a1a1a] text-3xl md:text-4xl font-bold tracking-tight"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              Danh Mục Sản Phẩm
            </h2>
            <p className="mt-3 text-[14px] text-[#999] max-w-[500px] mx-auto leading-relaxed">
              Chúng tôi cung cấp nhiều loại trang phục cao cấp cho mọi dịp đặc
              biệt
            </p>
          </div>

          {/* Category Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white/60 rounded-2xl h-[180px] animate-pulse"
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {parentCategories.map((category, index) => (
                <CategoryCard
                  key={category._id}
                  category={category}
                  costumeCount={costumeCounts[category._id] || 0}
                  index={index}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-[#1a1a1a] py-16 md:py-20 px-6">
        <div className="mx-auto max-w-[700px] text-center">
          <h2
            className="text-white text-3xl md:text-4xl font-bold tracking-tight"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            Sẵn sàng tỏa sáng?
          </h2>
          <p className="mt-4 text-[14px] text-[#999] leading-relaxed">
            Đăng ký ngay để nhận ưu đãi độc quyền và trải nghiệm dịch vụ cho
            thuê trang phục cao cấp hàng đầu.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href="/register"
              className="bg-white text-[#1a1a1a] text-[12px] uppercase tracking-[0.1em] font-semibold
                         px-8 py-3.5 rounded hover:bg-[#f0f0f0] active:scale-[0.98] transition-all duration-200"
            >
              Đăng Ký Ngay
            </a>
            <a
              href="/login"
              className="border border-[#555] text-white text-[12px] uppercase tracking-[0.1em] font-semibold
                         px-8 py-3.5 rounded hover:border-white active:scale-[0.98] transition-all duration-200"
            >
              Đăng Nhập
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}