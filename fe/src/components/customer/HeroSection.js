import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

export default function HeroSection({ products = [] }) {
  const navigate = useNavigate();
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (!products.length) return;

    const t = setInterval(() => {
      setIdx((p) => (p + 1) % products.length);
    }, 5000);

    return () => clearInterval(t);
  }, [products.length]);

  const product = products[idx];

  return (
    <section className="bg-[#faf9f7] overflow-hidden">
      <div className="max-w-[1200px] mx-auto px-6 py-24 flex flex-col lg:flex-row items-center gap-12">

        {/* LEFT TEXT */}
        <div className="flex-1">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-5xl font-bold"
          >
            Trang Phục Cao Cấp
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-gray-500 mt-4"
          >
            Experience premium fashion rental
          </motion.p>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate("/category")}
            className="mt-8 px-6 py-3 bg-black text-white rounded-xl"
          >
            Khám Phá
          </motion.button>
        </div>

        {/* RIGHT CINEMATIC IMAGE */}
        <div className="flex-1 flex justify-center">
          <div className="relative w-[420px] h-[560px] rounded-2xl overflow-hidden">

            {/* cinematic overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-white/10 z-10" />

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