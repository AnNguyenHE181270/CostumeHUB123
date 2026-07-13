import React from "react";
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
    <section className="bg-[#f6f1e8] border-y border-[#ece3d3] py-10 px-6">
      <div className="max-w-[1300px] mx-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-y-8 gap-x-4 divide-x-0 lg:divide-x divide-[#e3d8c2]">
        {FEATURES.map((feature, i) => (
          <div
            key={i}
            className="group flex flex-col items-center text-center gap-2.5 lg:px-4 first:lg:pl-0 last:lg:pr-0 cursor-pointer"
          >
            <div className="w-12 h-12 shrink-0 rounded-full bg-white group-hover:bg-[#1a1a1a] group-hover:text-white flex items-center justify-center text-[#b8935a] text-[17px] transition-all duration-500 transform group-hover:scale-110 shadow-sm">
              <FontAwesomeIcon icon={feature.icon} />
            </div>
            <div>
              <h3 className="text-[12px] font-bold uppercase tracking-[0.06em] text-[#1a1a1a] mb-1 group-hover:text-[#b8935a] transition-colors duration-300">
                {feature.title}
              </h3>
              <p className="text-[11px] text-[#999] leading-[1.5]">
                {feature.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
