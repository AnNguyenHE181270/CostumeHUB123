import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faGem,
    faLeaf,
    faBolt,
    faShieldAlt,
    faFileContract,
    faUndo,
    faMoneyBillWave
} from "@fortawesome/free-solid-svg-icons";

export default function AboutUs() {
    return (
        <div className="min-h-screen bg-[#faf9f7] pb-20 animate-fade-in">
            {/* Hero Section */}
            <div className="relative bg-[#1a1a1a] text-white py-28 text-center px-4 overflow-hidden">
                <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1512413914585-006240092c6c?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center"></div>
                <div className="relative z-10 max-w-3xl mx-auto">
                    <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-wide" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                        Về CostumeHUB
                    </h1>
                    <p className="text-lg md:text-xl text-gray-300 font-light leading-relaxed">
                        Hành trình mang đến cho bạn những trải nghiệm hóa thân tuyệt vời nhất. Nơi hội tụ các bộ trang phục đẳng cấp, từ cổ điển đến hiện đại.
                    </p>
                </div>
            </div>

            {/* Về Cửa Hàng (Story) */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 md:mt-24">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                    <div>
                        <h2 className="text-3xl md:text-4xl font-bold text-[#1a1a1a] mb-6" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                            Câu Chuyện Của Chúng Tôi
                        </h2>
                        <p className="text-[#555] text-lg leading-relaxed mb-4">
                            CostumeHUB được thành lập với niềm đam mê mãnh liệt dành cho nghệ thuật biểu diễn, cosplay và thời trang độc bản. Chúng tôi hiểu rằng mỗi sự kiện, mỗi buổi tiệc hay mỗi lần hóa thân đều là một khoảnh khắc đáng nhớ.
                        </p>
                        <p className="text-[#555] text-lg leading-relaxed">
                            Vì vậy, sứ mệnh của chúng tôi không chỉ là cho thuê trang phục, mà là mang đến sự tự tin và diện mạo hoàn hảo nhất cho khách hàng thông qua những bộ đồ được chăm chút tỉ mỉ từ đường kim mũi chỉ.
                        </p>
                    </div>
                    <div className="rounded-2xl overflow-hidden shadow-lg border border-[#eaeaea] h-[400px]">
                        <img
                            src="https://images.unsplash.com/photo-1588622143431-7290c0b11bf9?q=80&w=800&auto=format&fit=crop"
                            alt="Cửa hàng CostumeHUB"
                            className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                        />
                    </div>
                </div>
            </div>

            {/* Giá trị cốt lõi */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-24">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold text-[#1a1a1a]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                        Tại Sao Chọn CostumeHUB?
                    </h2>
                    <div className="w-24 h-1 bg-[#1a1a1a] mx-auto mt-4 rounded-full"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {[
                        { icon: faGem, title: "Đa Dạng & Đẳng Cấp", desc: "Sở hữu hàng ngàn mẫu mã từ Á sang Âu, cập nhật liên tục các xu hướng mới nhất." },
                        { icon: faLeaf, title: "Sạch Sẽ & Thơm Tho", desc: "Quy trình giặt ủi và bảo quản nghiêm ngặt, đảm bảo mỗi trang phục đều sạch như mới." },
                        { icon: faBolt, title: "Thủ Tục Nhanh Chóng", desc: "Đặt thuê online dễ dàng, thanh toán tiện lợi và quy trình giao nhận cực kỳ minh bạch." }
                    ].map((item, idx) => (
                        <div key={idx} className="bg-white p-8 rounded-2xl shadow-sm border border-[#eaeaea] text-center hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                            <div className="w-16 h-16 mx-auto bg-[oklch(0.92_0.03_130)] rounded-full flex items-center justify-center mb-6">
                                <FontAwesomeIcon icon={item.icon} className="text-2xl text-[oklch(0.78_0.06_130)]" />
                            </div>
                            <h3 className="text-xl font-bold text-[#1a1a1a] mb-3">{item.title}</h3>
                            <p className="text-[#555]">{item.desc}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Chính Sách & Điều Khoản */}
            <div className="bg-white border-y border-[#eaeaea] py-20 mt-24 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-[#1a1a1a]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                            Chính Sách Thuê & Hoàn Trả Trang Phục
                        </h2>
                        <p className="text-[#858585] mt-2 text-lg">Đảm bảo quyền lợi và trách nhiệm minh bạch cho mọi khách hàng</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[
                            { icon: faFileContract, title: "Trách nhiệm bảo quản & Hoàn trả", desc: "Khách hàng có trách nhiệm bảo quản trang phục trong thời gian thuê và hoàn trả đúng thời hạn." },
                            { icon: faMoneyBillWave, title: "Quy định về trả trễ", desc: "Trường hợp trả trễ, khách hàng có thể bị áp dụng phí phát sinh theo quy định của nền tảng." },
                            { icon: faShieldAlt, title: "Quyền đánh giá hiện trạng", desc: "Nền tảng có quyền đánh giá tình trạng sản phẩm và quyết định mức khấu trừ hoặc bồi thường dựa trên hiện trạng thực tế khi nhận lại." },
                            { icon: faUndo, title: "Đền bù & Khấu trừ cọc", desc: "Các trường hợp bẩn nặng, hư hỏng hoặc mất mát sẽ bị khấu trừ một phần hoặc toàn bộ cọc theo bảng phí đền bù chi tiết." }
                        ].map((policy, idx) => (
                            <div key={idx} className="flex gap-5 p-8 rounded-2xl bg-white border border-[#eaeaea] shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 group cursor-default">
                                <div className="shrink-0">
                                    <div className="w-14 h-14 rounded-xl bg-[#faf9f7] flex items-center justify-center group-hover:bg-[oklch(0.92_0.03_130)] transition-colors duration-300">
                                        <FontAwesomeIcon icon={policy.icon} className="text-xl text-[#1a1a1a] group-hover:text-[oklch(0.78_0.06_130)] transition-colors duration-300" />
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-lg font-bold text-[#1a1a1a] mb-2 group-hover:text-[oklch(0.78_0.06_130)] transition-colors duration-300">{policy.title}</h4>
                                    <p className="text-[13px] text-[#666] leading-relaxed">{policy.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Bảng Chính Sách Đền Bù */}
                    <div className="mt-20 bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#eaeaea] overflow-hidden transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
                        <div className="bg-[#faf9f7] p-8 border-b border-[#eaeaea]">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-[oklch(0.92_0.03_130)] flex items-center justify-center">
                                    <FontAwesomeIcon icon={faUndo} className="text-xl text-[oklch(0.78_0.06_130)]" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-[#1a1a1a]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                                        Bảng Đền Bù & Khấu Trừ Cọc
                                    </h3>
                                    <p className="text-sm text-[#858585] mt-1">Chi tiết các mức khấu trừ khi trang phục gặp sự cố</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 space-y-4">
                            <div className="group flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-xl border border-[#eaeaea] hover:border-[#d0c9c0] hover:shadow-[0_4px_20px_rgb(0,0,0,0.03)] transition-all duration-300 bg-white">
                                <div className="flex-1">
                                    <h4 className="font-bold text-[#1a1a1a] text-xl mb-1.5" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Bình thường hoặc bẩn nhẹ</h4>
                                    <p className="text-[14px] text-[#666] font-light">Có thể giặt sạch sẽ dễ dàng, không bị khấu trừ tiền cọc.</p>
                                </div>
                                <div className="shrink-0 flex items-center">
                                    <span className="text-[#1a1a1a] bg-[#faf9f7] px-5 py-2.5 rounded-full text-[12px] font-semibold uppercase tracking-widest border border-[#eaeaea] transition-colors duration-300">Không trừ cọc</span>
                                </div>
                            </div>

                            <div className="group flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-xl border border-[#eaeaea] hover:border-[#d0c9c0] hover:shadow-[0_4px_20px_rgb(0,0,0,0.03)] transition-all duration-300 bg-white">
                                <div className="flex-1">
                                    <h4 className="font-bold text-[#1a1a1a] text-xl mb-1.5" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Bẩn nặng, ố khó tẩy</h4>
                                    <p className="text-[14px] text-[#666] font-light">Khấu trừ phí để xử lý vệ sinh chuyên sâu.</p>
                                </div>
                                <div className="shrink-0 flex items-center">
                                    <span className="text-[#1a1a1a] bg-[#faf9f7] px-5 py-2.5 rounded-full text-[12px] font-semibold uppercase tracking-widest border border-[#eaeaea] transition-colors duration-300">20% Cọc</span>
                                </div>
                            </div>

                            <div className="group flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-xl border border-[#eaeaea] hover:border-[#d0c9c0] hover:shadow-[0_4px_20px_rgb(0,0,0,0.03)] transition-all duration-300 bg-white">
                                <div className="flex-1">
                                    <h4 className="font-bold text-[#1a1a1a] text-xl mb-1.5" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Hư nhẹ sửa được</h4>
                                    <p className="text-[14px] text-[#666] font-light">Khấu trừ tuỳ thuộc vào mức độ sửa chữa thực tế. <span className="text-[13px] text-[#999] italic">(Bung chỉ, đứt khuy, rách nhỏ...)</span></p>
                                </div>
                                <div className="shrink-0 flex items-center">
                                    <span className="text-[#1a1a1a] bg-[#faf9f7] px-5 py-2.5 rounded-full text-[12px] font-semibold uppercase tracking-widest border border-[#eaeaea] transition-colors duration-300">30% - 50% Cọc</span>
                                </div>
                            </div>

                            <div className="group flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-xl border border-[#eaeaea] hover:border-[#d0c9c0] hover:shadow-[0_4px_20px_rgb(0,0,0,0.03)] transition-all duration-300 bg-white">
                                <div className="flex-1">
                                    <h4 className="font-bold text-[#1a1a1a] text-xl mb-1.5" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Hư nặng không phục hồi</h4>
                                    <p className="text-[14px] text-[#666] font-light">Trang phục bị hư hỏng nghiêm trọng, không thể cho thuê lại. <span className="text-[13px] text-[#999] italic">(Rách lớn, cháy, phai màu...)</span></p>
                                </div>
                                <div className="shrink-0 flex items-center">
                                    <span className="text-[#1a1a1a] bg-[#faf9f7] px-5 py-2.5 rounded-full text-[12px] font-semibold uppercase tracking-widest border border-[#eaeaea] transition-colors duration-300">70% - 100% Cọc</span>
                                </div>
                            </div>

                            <div className="group flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-xl border border-[#eaeaea] hover:border-[#d0c9c0] hover:shadow-[0_4px_20px_rgb(0,0,0,0.03)] transition-all duration-300 bg-[#faf9f7]">
                                <div className="flex-1">
                                    <h4 className="font-bold text-[#1a1a1a] text-xl mb-1.5" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Mất trang phục hoặc hư hỏng toàn bộ</h4>
                                    <p className="text-[14px] text-[#666] font-light">Khấu trừ toàn bộ cọc và bồi thường thêm phần giá trị thay thế còn thiếu (nếu có).</p>
                                </div>
                                <div className="shrink-0 flex items-center">
                                    <span className="text-[#1a1a1a] bg-white px-5 py-2.5 rounded-full text-[12px] font-semibold uppercase tracking-widest border border-[#eaeaea] transition-colors duration-300">100% Cọc + Phí thay thế</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
