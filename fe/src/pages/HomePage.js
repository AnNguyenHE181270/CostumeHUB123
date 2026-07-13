import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import HeroSection from "../components/customer/HeroSection";
import FeatureBar from "../components/customer/FeatureBar";
import CategoryShowcase from "../components/customer/CategoryShowcase";
import PromoBanner from "../components/customer/PromoBanner";
import Testimonials from "../components/customer/Testimonials";
import ProductCard from "../components/customer/ProductCard";
import { motion } from "framer-motion";
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay } from 'swiper/modules';
import 'swiper/css';
import PoliciesModal from "./Policies";
import costumeService from "../services/costume.service";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.15 } },
};

const item = {
  hidden: { opacity: 0, y: 30, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
};

export default function HomePage() {
  const [recentProducts, setRecentProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPolicies, setShowPolicies] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const popularRes = await costumeService.getAll({ sort: 'popular', limit: 15 });
        setRecentProducts(popularRes.costumes || []);
      } catch (err) {
        console.error("Lỗi khi tải sản phẩm:", err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (location.state?.showPolicies) {
      setShowPolicies(true);
      const newState = { ...location.state };
      delete newState.showPolicies;
      navigate(location.pathname, { replace: true, state: newState });
    }
  }, [location, navigate]);

  return (
    <motion.div initial="hidden" animate="show" variants={container} className="bg-[#f9f5ed]">
      {/* HERO */}
      <motion.div variants={item}>
        <HeroSection />
      </motion.div>

      <CategoryShowcase />

      {/* FEATURED PRODUCTS */}
      <section className="pt-4 pb-14">
        <motion.div variants={item} className="text-center mb-10">
          <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#b8935a]">Lựa Chọn Hàng Đầu</span>
          <h2 className="text-4xl font-semibold tracking-tight mt-2" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Sản Phẩm Nổi Bật</h2>
        </motion.div>

        <motion.div variants={container} className="px-6 pb-6">
          <Swiper
            modules={[Autoplay]}
            spaceBetween={24}
            slidesPerView="auto"
            speed={800}
            autoplay={{ delay: 2500, disableOnInteraction: false }}
            className="w-full px-2"
          >
            {recentProducts.map((p) => (
              <SwiperSlide key={p._id} style={{ width: "240px" }} className="!h-auto pb-4 pt-4 flex">
                <motion.div variants={item} className="w-full h-full transition-all duration-300">
                  <ProductCard costume={p} />
                </motion.div>
              </SwiperSlide>
            ))}
          </Swiper>
        </motion.div>
      </section>

      <PromoBanner />

      <FeatureBar />

      <Testimonials />

      <PoliciesModal isOpen={showPolicies} onClose={() => setShowPolicies(false)} />
    </motion.div>
  );
}
