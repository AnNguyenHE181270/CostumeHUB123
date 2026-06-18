import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

export default function HeroSection({ products = [] }) {
  const navigate = useNavigate();
  const [idx, setIdx] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!products.length) return;

    const t = setInterval(() => {
      setIdx((p) => (p + 1) % products.length);
    }, 5000);

    return () => clearInterval(t);
  }, [products.length]);

  const product = products[idx];

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/collections?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate("/collections");
    }
  };

  const handleKeywordSearch = (keyword) => {
    navigate(`/collections?q=${encodeURIComponent(keyword)}`);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <section className="bg-[#faf9f7] overflow-hidden">
      <div className="max-w-[1200px] mx-auto px-6 py-24 flex flex-col lg:flex-row items-center gap-12">

        {/* LEFT TEXT */}
        <div className="flex-1 w-full">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-5xl font-bold text-[#1a1a1a]"
          >
            Trang Phục Cao Cấp
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-gray-500 mt-4 text-lg"
          >
            Experience premium fashion rental
          </motion.p>

          {/* Search Bar matching Image 2 */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-10"
          >
            <div className="bg-white rounded-3xl sm:rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.06)] flex flex-col sm:flex-row items-center p-2 border border-[#eaeaea]">
              
              {/* Cột 1: Nhập từ khóa */}
              <div className="flex-1 w-full px-5 py-3 border-b sm:border-b-0 sm:border-r border-gray-100 cursor-text group min-w-0">
                <div className="text-[11px] font-bold text-[#1a1a1a] tracking-wider mb-1 whitespace-nowrap">BẠN CẦN TÌM GÌ?</div>
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="VD: Áo dài, Váy cưới..." 
                  className="w-full text-[13px] text-[#1a1a1a] placeholder-gray-400 bg-transparent border-none outline-none focus:ring-0 p-0 truncate min-w-0"
                />
              </div>
              
              {/* Cột 2: Sự kiện (Ẩn trên màn hình vừa để tránh chật chội) */}
              <div className="hidden xl:block flex-1 w-full px-5 py-3 border-r border-gray-100 cursor-pointer hover:bg-gray-50/50 transition-colors">
                <div className="text-[11px] font-bold text-[#1a1a1a] tracking-wider mb-1 whitespace-nowrap">SỰ KIỆN</div>
                <div className="text-[13px] text-gray-400 truncate">Kỷ yếu, Tiệc cưới...</div>
              </div>
              
              {/* Cột 3: Thời gian (Ẩn trên màn hình nhỏ/vừa) */}
              <div className="hidden md:block flex-1 w-full px-5 py-3 cursor-pointer hover:bg-gray-50/50 transition-colors">
                <div className="text-[11px] font-bold text-[#1a1a1a] tracking-wider mb-1 whitespace-nowrap">THỜI GIAN</div>
                <div className="text-[13px] text-gray-400 truncate">Thêm ngày nhận - trả</div>
              </div>
              
              {/* Nút Tìm kiếm */}
              <button 
                onClick={handleSearch}
                className="w-full sm:w-auto mt-2 sm:mt-0 bg-[#1a1a1a] text-white px-7 py-3.5 rounded-full font-semibold flex items-center justify-center gap-2 hover:bg-black transition-all shadow-md hover:shadow-lg shrink-0 sm:ml-2"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                <span className="whitespace-nowrap text-[15px]">Tìm kiếm</span>
              </button>
            </div>

            {/* Popular Searches */}
            <div className="mt-5 flex flex-wrap items-center gap-2.5">
              <span className="text-[13px] text-gray-500 mr-1 whitespace-nowrap">Tìm kiếm phổ biến:</span>
              <span onClick={() => handleKeywordSearch("Áo dài")} className="px-3 py-1.5 bg-white border border-gray-200 rounded-full text-xs font-medium text-[#1a1a1a] hover:border-gray-300 hover:shadow-sm cursor-pointer transition-all whitespace-nowrap">Áo dài truyền thống</span>
              <span onClick={() => handleKeywordSearch("Váy")} className="px-3 py-1.5 bg-white border border-gray-200 rounded-full text-xs font-medium text-[#1a1a1a] hover:border-gray-300 hover:shadow-sm cursor-pointer transition-all whitespace-nowrap">Váy dạ hội</span>
              <span onClick={() => handleKeywordSearch("Hóa trang")} className="px-3 py-1.5 bg-white border border-gray-200 rounded-full text-xs font-medium text-[#1a1a1a] hover:border-gray-300 hover:shadow-sm cursor-pointer transition-all whitespace-nowrap">Đồ hóa trang</span>
            </div>
          </motion.div>
        </div>

        {/* RIGHT CINEMATIC IMAGE */}
        <div className="flex-1 flex justify-center mt-12 lg:mt-0">
          <div className="relative w-full max-w-[420px] aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl">

            {/* cinematic overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-white/10 z-10 pointer-events-none" />

            <AnimatePresence mode="wait">
              <motion.img
                key={product?._id}
                src={product?.images?.[0]}
                className="w-full h-full object-cover"
                initial={{
                  opacity: 0,
                  scale: 1.15,
                  filter: "blur(12px)",
                }}
                animate={{
                  opacity: 1,
                  scale: 1.05,
                  filter: "blur(0px)",
                }}
                exit={{
                  opacity: 0,
                  scale: 1,
                  filter: "blur(10px)",
                }}
                transition={{
                  duration: 1.2,
                  ease: [0.22, 1, 0.36, 1],
                }}
              />
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}