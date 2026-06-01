import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTruckFast,
  faRotateLeft,
  faGem,
  faHeadset,
} from "@fortawesome/free-solid-svg-icons";

const FEATURES = [
  {
    icon: faTruckFast,
    title: "Miễn Phí Vận Chuyển",
    desc: "Miễn phí vận chuyển thành phố cho đơn hàng từ 10 triệu đồng",
  },
  {
    icon: faRotateLeft,
    title: "Trả Hàng Dễ Dàng",
    desc: "Có thể đổi/trả hàng trong vòng đổi sản phẩm 4 tiếng",
  },
  {
    icon: faGem,
    title: "Chất Lượng Cao",
    desc: "Tất cả sản phẩm được kiểm tra kỹ lưỡng trước khi cho thuê",
  },
  {
    icon: faHeadset,
    title: "Hỗ Trợ 24/7",
    desc: "Đội hỗ trợ khách hàng sẵn sàng giúp đỡ bất kỳ lúc nào",
  },
];

export default function FeatureBar() {
  return (
    <section className="bg-white border-t border-b border-[#eee] py-12 px-6">
      <div className="mx-auto max-w-[1200px]">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {FEATURES.map((feature, i) => (
            <div
              key={i}
              className="flex flex-col items-center text-center group"
            >
              <div
                className="w-14 h-14 rounded-full bg-[#f5f5f5] flex items-center justify-center mb-4
                            group-hover:bg-[#1a1a1a] group-hover:text-white transition-all duration-300"
              >
                <FontAwesomeIcon
                  icon={feature.icon}
                  className="text-[18px] text-[#1a1a1a] group-hover:text-white transition-colors duration-300"
                />
              </div>
              <h3 className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[#1a1a1a] mb-2">
                {feature.title}
              </h3>
              <p className="text-[12px] text-[#999] leading-[1.6] max-w-[200px]">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
