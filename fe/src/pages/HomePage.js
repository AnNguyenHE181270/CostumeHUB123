import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import HeroSection from "../components/customer/HeroSection";
import FeatureBar from "../components/customer/FeatureBar";
import CategoryShowcase from "../components/customer/CategoryShowcase";
import PromoBanner from "../components/customer/PromoBanner";
import TopRentedProducts from "../components/customer/TopRentedProducts";
import ProductCard from "../components/customer/ProductCard";
import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGem } from "@fortawesome/free-solid-svg-icons";
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
      <section className="pt-6 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-2 mb-2">
            <FontAwesomeIcon icon={faGem} className="text-[10px] text-[#d4af37]" />
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#b8935a]">
              Lựa Chọn Hàng Đầu
            </span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight mt-2" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            <span className="text-shine-black">Sản Phẩm</span>{" "}
            <span className="text-shine-gold-animated">Nổi Bật</span>
          </h2>
          <div className="flex items-center justify-center gap-3 mt-4">
            <div className="w-10 h-px bg-gradient-to-r from-transparent to-[#d4c5b0]" />
            <span className="text-[#b8935a] text-[10px]">✦</span>
            <div className="w-10 h-px bg-gradient-to-l from-transparent to-[#d4c5b0]" />
          </div>
        </motion.div>

        <motion.div variants={container} className="px-6 pb-6 max-w-[1340px] mx-auto">
          <Swiper
            modules={[Autoplay]}
            spaceBetween={24}
            slidesPerView="auto"
            speed={800}
            autoplay={{ delay: 2800, disableOnInteraction: false }}
            className="w-full px-2"
          >
            {recentProducts.map((p) => (
              <SwiperSlide key={p._id} style={{ width: "240px" }} className="!h-auto pb-4 pt-4 flex">
                <motion.div variants={item} className="w-full h-full transition-all duration-300">
                  <ProductCard costume={p} isBestSeller={true} />
                </motion.div>
              </SwiperSlide>
            ))}
          </Swiper>
        </motion.div>
      </section>

      <PromoBanner />

      <FeatureBar />

      <TopRentedProducts />

      <PoliciesModal isOpen={showPolicies} onClose={() => setShowPolicies(false)} />
    </motion.div>
  );
}

