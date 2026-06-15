import React, { useState, useEffect, useRef } from "react";
import HeroSection from "../components/customer/HeroSection";
import FeatureBar from "../components/customer/FeatureBar";
import ProductCard from "../components/customer/ProductCard";
import Toast from "../components/ui/Toast";
import { motion } from "framer-motion";

import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay } from 'swiper/modules';
import 'swiper/css';

const container = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 30, scale: 0.98 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
  },
};

export default function HomePage() {
  const [recentProducts, setRecentProducts] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const res = await fetch("http://localhost:9999/api/costumes?sort=popular&limit=15");
      const data = await res.json();
      setRecentProducts(data.costumes || []);

      const res2 = await fetch("http://localhost:9999/api/costumes?sort=newest&limit=5");
      const data2 = await res2.json();
      setNewArrivals(data2.costumes || []);

      setLoading(false);
    })();
  }, []);

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={container}
      className="bg-[#f9f5ed]"
    >
      {/* HERO */}
      <motion.div variants={item}>
        <HeroSection products={recentProducts.slice(0, 5)} />
      </motion.div>

      <FeatureBar />

      {/* HOT PRODUCTS */}
      <section className="py-20">
        <motion.div variants={item} className="text-center mb-10">
          <h2 className="text-4xl font-semibold tracking-tight">
            Sản Phẩm Hot
          </h2>
          <p className="text-gray-400 mt-2">
            Luxury selection curated for you
          </p>
        </motion.div>

        <motion.div variants={container} className="px-6 pb-6">
          <Swiper
            modules={[Autoplay]}
            spaceBetween={24}
            slidesPerView="auto"
            speed={800}
            autoplay={{
              delay: 2500,
              disableOnInteraction: false,
            }}
            className="w-full px-2"
          >
            {recentProducts.map((p) => (
              <SwiperSlide key={p._id} style={{ width: "240px" }} className="!h-auto pb-4 pt-4 flex">
                <motion.div
                  variants={item}
                  className="w-full h-full transition-all duration-300"
                >
                  <ProductCard costume={p} />
                </motion.div>
              </SwiperSlide>
            ))}
          </Swiper>
        </motion.div>
      </section>

      {/* NEW ARRIVALS */}
      <section className="bg-[#faf9f7] py-24 px-6">
        <div className="max-w-[1200px] mx-auto">
          <motion.div variants={item} className="mb-10">
            <h2 className="text-4xl font-semibold">
              New Arrivals
            </h2>
            <p className="text-gray-400">
              Fresh drops of the season
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6"
            variants={container}
          >
            {newArrivals.map((p) => (
              <motion.div
                key={p._id}
                variants={item}
                className="h-full transition-all duration-300 hover:scale-[1.03] hover:-translate-y-1.5"
              >
                <ProductCard costume={p} />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
    </motion.div>
  );
}