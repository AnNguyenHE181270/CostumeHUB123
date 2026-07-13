import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPersonDress,
  faCalendarCheck,
  faBoxOpen,
  faRotateLeft,
} from "@fortawesome/free-solid-svg-icons";

const STEPS = [
  { no: "01", icon: faPersonDress, title: "Chọn trang phục", desc: "Chọn mẫu bạn yêu thích trong bộ sưu tập" },
  { no: "02", icon: faCalendarCheck, title: "Đặt lịch thuê", desc: "Chọn ngày nhận & trả phù hợp" },
  { no: "03", icon: faBoxOpen, title: "Nhận & tận hưởng", desc: "Nhận trang phục và tỏa sáng trong sự kiện" },
  { no: "04", icon: faRotateLeft, title: "Trả lại dễ dàng", desc: "Trả trang phục đúng hẹn, đơn giản & nhanh chóng" },
];

export default function ProcessSteps() {
  return (
    <section className="px-6 py-16">
      <div className="max-w-[1300px] mx-auto bg-[#faf6f0] rounded-2xl p-8 sm:p-12 grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-10 items-center">
        <div>
          <h2
            className="text-2xl sm:text-3xl font-bold text-[#1a1a1a] leading-tight"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            Quy Trình Thuê<br />Đơn Giản
          </h2>
          <span className="block w-10 h-[3px] bg-[#c9a869] my-4" />
          <p className="text-[13px] text-gray-500 leading-relaxed">
            Chỉ 4 bước đơn giản để sở hữu trang phục mơ ước của bạn
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {STEPS.map((step) => (
            <div
              key={step.no}
              className="group text-center sm:text-left bg-white/50 backdrop-blur-sm hover:bg-white rounded-2xl p-5 border border-transparent hover:border-[#b8935a]/20 hover:shadow-[0_12px_24px_rgba(184,147,90,0.06)] hover:-translate-y-1 transition-all duration-500 flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 mx-auto sm:mx-0 rounded-full bg-white group-hover:bg-[#1a1a1a] group-hover:text-white flex items-center justify-center text-[#1a1a1a] text-[16px] shadow-sm mb-4 transition-all duration-300 transform group-hover:scale-110 group-hover:rotate-6">
                  <FontAwesomeIcon icon={step.icon} />
                </div>
                <span className="text-[11px] font-bold tracking-[0.15em] text-[#b8935a]">{step.no}</span>
                <h3 className="text-[14px] font-bold text-[#1a1a1a] mt-1 mb-1.5 transition-colors duration-300 group-hover:text-[#b8935a]">{step.title}</h3>
                <p className="text-[12px] text-gray-500 leading-relaxed font-light">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
