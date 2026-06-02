import React, { useState, useEffect, useRef } from "react";
import HeroSection from "../components/customer/HeroSection";
import FeatureBar from "../components/customer/FeatureBar";
import ProductCard from "../components/customer/ProductCard";
import Toast from "../components/ui/Toast";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:9999";

export default function HomePage() {
  const [recentProducts, setRecentProducts] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [loading, setLoading] = useState(true);
  const sliderRef = useRef(null);
  const [isDown, setIsDown] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const [toast, setToast] = useState({ isVisible: false, message: "", type: "success" });
  const showToast = (message, type = "success") => {
    setToast({ isVisible: true, message, type });
  };
  
  const token = localStorage.getItem("token") || sessionStorage.getItem("token");

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch popular costumes
        const cosRes = await fetch(`${API_URL}/api/costumes?sort=popular&limit=15`);
        const cosData = await cosRes.json();
        setRecentProducts(cosData.costumes || []);

        // Fetch newest costumes for New Arrivals (limit 5)
        const newRes = await fetch(`${API_URL}/api/costumes?sort=newest&limit=5`);
        const newData = await newRes.json();
        setNewArrivals(newData.costumes || []);

      } catch (err) {
        console.error("Failed to fetch data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleMouseDown = (e) => {
    setIsDown(true);
    if (sliderRef.current) {
      setStartX(e.pageX - sliderRef.current.offsetLeft);
      setScrollLeft(sliderRef.current.scrollLeft);
    }
  };

  const handleMouseLeave = () => {
    setIsDown(false);
  };

  const handleMouseUp = () => {
    setIsDown(false);
  };

  const handleMouseMove = (e) => {
    if (!isDown) return;
    e.preventDefault();
    if (sliderRef.current) {
      const x = e.pageX - sliderRef.current.offsetLeft;
      const walk = (x - startX) * 2; // Scroll-fast multiplier
      sliderRef.current.scrollLeft = scrollLeft - walk;
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <HeroSection products={recentProducts.slice(0, 5)} />

      {/* Feature Highlights */}
      <FeatureBar />

      {/* Featured Products Marquee Section */}
      <section className="bg-white py-16 md:py-20 overflow-hidden">
        <div className="mx-auto max-w-[1200px] px-6 mb-12 text-center">
          <h2
            className="text-[#1a1a1a] text-3xl md:text-4xl font-bold tracking-tight"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            Sản Phẩm Hot
          </h2>
          <p className="mt-3 text-[14px] text-[#999] max-w-[500px] mx-auto leading-relaxed">
            Các mẫu trang phục được yêu thích và thuê nhiều nhất của chúng tôi.
          </p>
        </div>

        {loading ? (
          <div className="mx-auto max-w-[1200px] px-6">
            <div className="flex gap-6 overflow-hidden">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="min-w-[280px] h-[380px] bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
          </div>
        ) : (
          <div 
            className="w-full overflow-x-auto scrollbar-hide cursor-grab active:cursor-grabbing px-6 select-none"
            ref={sliderRef}
            onMouseDown={handleMouseDown}
            onMouseLeave={handleMouseLeave}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
            style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}
          >
            <div className="flex gap-6 w-max pb-4 pointer-events-auto">
              {recentProducts.map((product, i) => (
                <div key={`${product._id}-${i}`} className="w-[280px] flex-shrink-0 pointer-events-none">
                  {/* Make cards pointer-events-none so drag doesn't conflict with link clicks during dragging, 
                      though we might want them clickable if not dragging. For a simple drag-to-scroll, 
                      we just prevent drag of the image. */}
                  <div className="pointer-events-auto">
                    <ProductCard costume={product} showToast={showToast} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* New Arrivals Asymmetric Grid Section */}
      <section className="bg-[#faf9f7] py-20 px-6">
        <div className="mx-auto max-w-[1200px]">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <h2
                className="text-[#1a1a1a] text-3xl md:text-4xl font-bold tracking-tight"
                style={{ fontFamily: "'Cormorant Garamond', serif" }}
              >
                Bộ Sưu Tập Mới
              </h2>
              <p className="mt-3 text-[14px] text-[#999] max-w-[500px] leading-relaxed">
                Khám phá những thiết kế mới nhất vừa được cập nhật tại hệ thống.
              </p>
            </div>
            <a
              href="/products"
              className="inline-flex items-center gap-2 text-[12px] uppercase tracking-[0.1em] font-semibold text-[#1a1a1a] hover:text-[#555] transition-colors"
            >
              Xem tất cả <span className="text-[16px]">→</span>
            </a>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1 h-[600px] bg-white/60 rounded-xl animate-pulse" />
              <div className="lg:col-span-2 grid grid-cols-2 gap-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-[285px] bg-white/60 rounded-xl animate-pulse" />
                ))}
              </div>
            </div>
          ) : newArrivals.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Hero Card (1st item) */}
              <div className="lg:col-span-1 h-full">
                <div className="h-full [&>div]:h-full [&_img]:h-[500px] lg:[&_img]:h-[calc(100%-80px)]">
                  <ProductCard costume={newArrivals[0]} showToast={showToast} />
                </div>
              </div>

              {/* Right Grid (2nd to 5th items) */}
              <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
                {newArrivals.slice(1, 5).map((product) => (
                  <ProductCard key={product._id} costume={product} showToast={showToast} />
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-10 text-[#999]">Chưa có sản phẩm mới.</div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      {!token && (
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
      )}

      <Toast 
        isVisible={toast.isVisible} 
        message={toast.message} 
        type={toast.type} 
        onClose={() => setToast(prev => ({ ...prev, isVisible: false }))} 
      />
    </div>
  );
}