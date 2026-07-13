import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faGem,
    faLeaf,
    faBolt,
    faShieldAlt,
    faFileContract,
    faUndo,
    faMoneyBillWave,
    faClipboardCheck,
    faCommentDots,
    faWallet,
    faCircleCheck,
} from "@fortawesome/free-solid-svg-icons";

const SERIF = { fontFamily: "'Cormorant Garamond', serif" };

const DAMAGE_TIERS = [
    {
        title: "Bình thường hoặc bẩn nhẹ",
        desc: "Có thể giặt sạch sẽ dễ dàng, không bị khấu trừ tiền cọc.",
        rate: "Không trừ cọc",
        tone: "neutral",
    },
    {
        title: "Bẩn nặng, ố khó tẩy",
        desc: "Khấu trừ phí để xử lý vệ sinh chuyên sâu.",
        rate: "20% cọc",
        tone: "light",
    },
    {
        title: "Hư nhẹ, sửa được",
        note: "Bung chỉ, đứt khuy, rách nhỏ...",
        desc: "Khấu trừ tuỳ mức độ sửa chữa thực tế do nhân viên đánh giá.",
        rate: "30% – 50% cọc",
        tone: "medium",
    },
    {
        title: "Hư nặng, không phục hồi",
        note: "Rách lớn, cháy, biến dạng...",
        desc: "Trang phục hư hỏng nghiêm trọng, không thể cho thuê lại.",
        rate: "70% – 100% cọc",
        tone: "high",
    },
    {
        title: "Mất trang phục hoặc hư hỏng toàn bộ",
        desc: "Khấu trừ toàn bộ cọc và bồi thường thêm phần giá trị thay thế còn thiếu (nếu giá trị sản phẩm vượt tiền cọc đã đóng).",
        rate: "100% cọc + phí thay thế",
        tone: "severe",
    },
];

const TIER_STYLES = {
    neutral: "bg-white border-[#eaeaea]",
    light: "bg-white border-[#eaeaea]",
    medium: "bg-white border-[#eaeaea]",
    high: "bg-white border-[#eaeaea]",
    severe: "bg-[#faf9f7] border-[#eaeaea]",
};

const TIER_BADGE = {
    neutral: "text-[#1a1a1a] bg-[#faf9f7] border-[#eaeaea]",
    light: "text-[#8a6d1a] bg-[#fbf3d9] border-[#f0e2ad]",
    medium: "text-[#9c5a17] bg-[#fbe9d6] border-[#f0cfa8]",
    high: "text-[#a6392c] bg-[#f8e2de] border-[#eec2ba]",
    severe: "text-white bg-[#1a1a1a] border-[#1a1a1a]",
};

const PROCESS_STEPS = [
    {
        icon: faCommentDots,
        title: "Khách yêu cầu trả đồ",
        desc: "Đến hoặc trước hạn trả, khách gửi yêu cầu trả hàng ngay trong đơn thuê.",
    },
    {
        icon: faClipboardCheck,
        title: "Nhân viên kiểm tra thực tế",
        desc: "Cửa hàng kiểm tra tình trạng trang phục khi nhận lại, đối chiếu với bảng đền bù bên dưới.",
    },
    {
        icon: faFileContract,
        title: "Thông báo phí phát sinh",
        desc: "Nếu có phí trễ hạn hoặc phí đền bù, khách được thông báo mức phí cụ thể trước khi hoàn cọc.",
    },
    {
        icon: faWallet,
        title: "Hoàn cọc phần còn lại",
        desc: "Số tiền cọc còn lại sau khi trừ phí (nếu có) được hoàn ngay vào Số dư ví của khách.",
    },
];

export default function AboutUs() {
    return (
        <div className="min-h-screen bg-[#faf9f7] pb-20 animate-fade-in">
            {/* Hero Section */}
            <div className="relative bg-[#1a1a1a] text-white py-28 text-center px-4 overflow-hidden">
                <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1512413914585-006240092c6c?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center"></div>
                <div className="relative z-10 max-w-3xl mx-auto">
                    <span className="inline-block text-[11px] font-semibold uppercase tracking-[0.25em] text-[oklch(0.78_0.06_130)] mb-5">
                        Câu chuyện & Chính sách
                    </span>
                    <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-wide" style={SERIF}>
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
                        <h2 className="text-3xl md:text-4xl font-bold text-[#1a1a1a] mb-6" style={SERIF}>
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
                            src="/about-us.jpg"
                            alt="Cửa hàng CostumeHUB"
                            className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                        />
                    </div>
                </div>
            </div>

            {/* Giá trị cốt lõi */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-24">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold text-[#1a1a1a]" style={SERIF}>
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
                        <span className="inline-block text-[11px] font-semibold uppercase tracking-[0.25em] text-[#b8941f] mb-3">
                            Áp dụng cho mọi đơn thuê
                        </span>
                        <h2 className="text-3xl md:text-4xl font-bold text-[#1a1a1a]" style={SERIF}>
                            Chính Sách Thuê, Trả Trễ & Đền Bù
                        </h2>
                        <p className="text-[#858585] mt-2 text-lg max-w-2xl mx-auto">
                            Một chính sách duy nhất, áp dụng minh bạch cho tất cả khách hàng — để quyền lợi và trách nhiệm giữa hai bên luôn rõ ràng.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[
                            { icon: faFileContract, title: "Trách nhiệm bảo quản & Hoàn trả", desc: "Khách hàng có trách nhiệm bảo quản trang phục trong thời gian thuê và hoàn trả đúng thời hạn ghi trên đơn." },
                            { icon: faMoneyBillWave, title: "Phí trả trễ", desc: "Trả trễ so với hạn hẹn: tính 10% tiền cọc cho mỗi ngày trễ, tối đa không vượt quá 100% tiền cọc của đơn." },
                            { icon: faShieldAlt, title: "Quyền đánh giá hiện trạng", desc: "Cửa hàng có quyền đánh giá tình trạng sản phẩm và quyết định mức khấu trừ dựa trên hiện trạng thực tế khi nhận lại." },
                            { icon: faUndo, title: "Đền bù & Khấu trừ cọc", desc: "Các trường hợp bẩn nặng, hư hỏng hoặc mất mát sẽ bị khấu trừ một phần hoặc toàn bộ cọc theo bảng phí đền bù chi tiết bên dưới." }
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
                                    <h3 className="text-2xl font-bold text-[#1a1a1a]" style={SERIF}>
                                        Bảng Đền Bù & Khấu Trừ Cọc
                                    </h3>
                                    <p className="text-sm text-[#858585] mt-1">5 cấp độ hư hỏng, áp dụng khi nhân viên kiểm tra trang phục lúc trả đồ</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 space-y-4">
                            {DAMAGE_TIERS.map((tier, idx) => (
                                <div
                                    key={idx}
                                    className={`group flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-xl border hover:border-[#d0c9c0] hover:shadow-[0_4px_20px_rgb(0,0,0,0.03)] transition-all duration-300 ${TIER_STYLES[tier.tone]}`}
                                >
                                    <div className="flex items-start gap-4 flex-1">
                                        <span className="mt-1.5 shrink-0 w-6 h-6 rounded-full bg-[#faf9f7] border border-[#eaeaea] flex items-center justify-center text-[11px] font-bold text-[#999]">
                                            {idx + 1}
                                        </span>
                                        <div>
                                            <h4 className="font-bold text-[#1a1a1a] text-xl mb-1.5" style={SERIF}>{tier.title}</h4>
                                            <p className="text-[14px] text-[#666] font-light">
                                                {tier.desc}
                                                {tier.note && <span className="text-[13px] text-[#999] italic"> ({tier.note})</span>}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="shrink-0 flex items-center pl-10 md:pl-0">
                                        <span className={`px-5 py-2.5 rounded-full text-[12px] font-semibold uppercase tracking-widest border transition-colors duration-300 ${TIER_BADGE[tier.tone]}`}>
                                            {tier.rate}
                                        </span>
                                    </div>
                                </div>
                            ))}
                            <p className="text-[13px] text-[#999] leading-relaxed pt-2 px-1">
                                * Mức khấu trừ cụ thể do nhân viên đánh giá trực tiếp khi nhận lại trang phục, đối chiếu với bảng trên trước khi hoàn phần cọc còn lại cho khách.
                            </p>
                        </div>
                    </div>

                    {/* Quy trình xử lý khi trả đồ */}
                    <div className="mt-16">
                        <div className="text-center mb-10">
                            <h3 className="text-2xl md:text-3xl font-bold text-[#1a1a1a]" style={SERIF}>
                                Quy Trình Xử Lý Khi Trả Đồ
                            </h3>
                            <p className="text-[#858585] mt-2">4 bước minh bạch, từ lúc gửi yêu cầu đến khi nhận lại tiền cọc</p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {PROCESS_STEPS.map((step, idx) => (
                                <div key={idx} className="relative bg-white p-6 rounded-2xl border border-[#eaeaea] shadow-sm">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-10 h-10 rounded-full bg-[#1a1a1a] text-white flex items-center justify-center text-sm font-bold shrink-0">
                                            {idx + 1}
                                        </div>
                                        <FontAwesomeIcon icon={step.icon} className="text-lg text-[oklch(0.72_0.08_130)]" />
                                    </div>
                                    <h4 className="font-bold text-[#1a1a1a] mb-1.5">{step.title}</h4>
                                    <p className="text-[13px] text-[#666] leading-relaxed">{step.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Ghi chú liên hệ */}
                    <div className="mt-16 flex flex-col sm:flex-row items-center justify-center gap-3 text-center bg-[#faf9f7] border border-[#eaeaea] rounded-2xl p-6">
                        <FontAwesomeIcon icon={faCircleCheck} className="text-lg text-[oklch(0.72_0.08_130)]" />
                        <p className="text-[14px] text-[#555]">
                            Còn thắc mắc về chính sách? Đăng nhập và mở khung <span className="font-semibold text-[#1a1a1a]">Chat hỗ trợ</span> trong tài khoản của bạn để được đội ngũ CostumeHUB giải đáp trực tiếp.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
