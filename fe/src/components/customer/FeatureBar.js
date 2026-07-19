import React from "react";
import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faGem,
  faRulerCombined,
  faSprayCanSparkles,
  faTruckFast,
  faHeadset,
} from "@fortawesome/free-solid-svg-icons";

const FEATURES = [
  {
    icon: faGem,
    title: "Thiết kế cao cấp",
    desc: "Chọn lọc từ các nhà thiết kế hàng đầu",
  },
  {
    icon: faRulerCombined,
    title: "Đa dạng kích cỡ",
    desc: "Phù hợp nhiều dáng người, dễ dàng lựa chọn",
  },
  {
    icon: faSprayCanSparkles,
    title: "Vệ sinh chuẩn cao cấp",
    desc: "Làm sạch & khử khuẩn chuyên nghiệp",
  },
  {
    icon: faTruckFast,
    title: "Giao nhận tận nơi",
    desc: "Giao nhanh & đúng hẹn toàn quốc",
  },
  {
    icon: faHeadset,
    title: "Hỗ trợ 24/7",
    desc: "Đội ngũ tư vấn luôn sẵn sàng",
  },
];

export default function FeatureBar() {
  return (
    <section className="bg-[#f6f1e8] border-y border-[#e6dcab]/60 py-11 px-6 relative overflow-hidden">
      <div className="max-w-[1300px] mx-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-y-8 gap-x-4 divide-x-0 lg:divide-x divide-[#e2d5bd]">
        {FEATURES.map((feature, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.5, delay: i * 0.08 }}
            className="group flex flex-col items-center text-center gap-3 lg:px-4 first:lg:pl-0 last:lg:pr-0 cursor-pointer"
          >
            <div className="w-13 h-13 shrink-0 rounded-full bg-white group-hover:bg-gradient-to-br group-hover:from-[#d4af37] group-hover:to-[#8a6a2f] group-hover:text-white flex items-center justify-center text-[#b8935a] text-[18px] transition-all duration-500 transform group-hover:scale-110 shadow-md group-hover:shadow-[0_8px_20px_rgba(184,147,90,0.35)] ring-1 ring-[#c9a869]/20 group-hover:ring-4 group-hover:ring-[#c9a869]/30">
              <FontAwesomeIcon icon={feature.icon} className="transition-transform duration-300 group-hover:scale-110" />
            </div>
            <div>
              <h3 className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#1a1a1a] mb-1 group-hover:text-[#b8935a] transition-colors duration-300">
                {feature.title}
              </h3>
              <p className="text-[11px] text-[#7a7164] leading-[1.5] font-light">
                {feature.desc}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

