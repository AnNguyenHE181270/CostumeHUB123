import React from "react";
import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faGem,
  faShieldAlt,
  faFileContract,
  faUndo,
  faMoneyBillWave,
  faClipboardCheck,
  faCommentDots,
  faWallet,
  faCircleCheck,
  faCrown,
  faCircleExclamation,
  faSprayCanSparkles,
} from "@fortawesome/free-solid-svg-icons";
import boutiqueImg from "../assets/login-boutique.png";

const SERIF = { fontFamily: "'Cormorant Garamond', serif" };

const DAMAGE_TIERS = [
  {
    level: "01",
    title: "Bình thường / Vệ sinh cơ bản",
    desc: "Trang phục sạch sẽ hoặc vết bẩn nhẹ thông thường, có thể giặt tẩy dễ dàng.",
    detail: "Không ảnh hưởng chất liệu vải, không đứt khuy bung chỉ.",
    rate: "Không Trừ Cọc",
    badgeBg: "bg-emerald-50 text-emerald-800 border-emerald-200/80",
    dotColor: "bg-emerald-500",
  },
  {
    level: "02",
    title: "Bẩn nặng / Ố khó tẩy",
    desc: "Vết bẩn ô-xi hóa, rượu vang, vết ố đòi hỏi quy trình giặt hấp & dung dịch chuyên dụng.",
    detail: "Cần giặt khô chuyên sâu và hấp ozone khử mùi.",
    rate: "Khấu trừ 20%",
    badgeBg: "bg-amber-50 text-amber-800 border-amber-200/80",
    dotColor: "bg-amber-500",
  },
  {
    level: "03",
    title: "Hư hỏng nhẹ (Có thể phục hồi)",
    desc: "Bung chỉ, đứt cúc/khuy, rách nhẹ đường may hoặc hỏng khóa kéo có thể sửa chữa.",
    detail: "Phí phụ thuộc tay nghề thợ sửa & linh kiện thay thế.",
    rate: "Khấu trừ 30% – 50%",
    badgeBg: "bg-orange-50 text-orange-800 border-orange-200/80",
    dotColor: "bg-orange-500",
  },
  {
    level: "04",
    title: "Hư hỏng nặng (Không thể phục hồi)",
    desc: "Rách lớn phom dáng, thủng lỗ cháy, biến dạng chất liệu vải không thể cho thuê lại.",
    detail: "Trang phục mất hoàn toàn khả năng phục hồi nguyên bản.",
    rate: "Khấu trừ 70% – 100%",
    badgeBg: "bg-rose-50 text-rose-800 border-rose-200/80",
    dotColor: "bg-rose-500",
  },
  {
    level: "05",
    title: "Mất trang phục / Hư hỏng toàn bộ",
    desc: "Không hoàn trả trang phục hoặc hỏng toàn bộ kết cấu bộ trang phục couture.",
    detail: "Yêu cầu thanh toán bổ sung nếu giá trị sản phẩm cao hơn tiền cọc.",
    rate: "100% Cọc + Bồi Thường",
    badgeBg: "bg-[#1a1a1a] text-[#f5e6ca] border-[#c9a869]/50 shadow-sm",
    dotColor: "bg-[#d4af37]",
  },
];

const PROCESS_STEPS = [
  {
    step: "01",
    icon: faCommentDots,
    title: "Gửi Yêu Cầu Trả Đồ",
    desc: "Vào chi tiết đơn thuê trên hệ thống và nhấn nút 'Yêu Cầu Trả Hàng' trước hạn hẹn.",
  },
  {
    step: "02",
    icon: faClipboardCheck,
    title: "Kiểm Tra Hiện Trạng",
    desc: "Chuyên viên CostumeHUB tiếp nhận, đối chiếu tình trạng trang phục với biên bản ban đầu.",
  },
  {
    step: "03",
    icon: faFileContract,
    title: "Xác Nhận Chi Phí",
    desc: "Hệ thống tự động thông báo bảng kê khai phí khấu trừ (nếu có) minh bạch cho khách hàng.",
  },
  {
    step: "04",
    icon: faWallet,
    title: "Hoàn Cọc Vào Ví",
    desc: "Số tiền cọc còn lại được hoàn trực tiếp vào Ví CostumeHUB của bạn trong vài phút.",
  },
];

export default function AboutUs() {
  return (
    <div className="min-h-screen bg-[#faf6f0] text-[#1a1a1a] pb-24 overflow-hidden">
      
      {/* ── HERO SECTION ── */}
      <section className="relative bg-[#121212] text-white py-28 lg:py-36 px-6 overflow-hidden">
        {/* Ambient background blur circles */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#c9a869]/20 rounded-full blur-[130px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-amber-400/10 rounded-full blur-[130px] pointer-events-none" />
        
        {/* Background Image Overlay */}
        <div 
          className="absolute inset-0 opacity-25 bg-cover bg-center select-none"
          style={{ backgroundImage: `url(${boutiqueImg})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#121212]/90 via-[#121212]/95 to-[#faf6f0]" />

        <div className="relative z-10 max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-[#c9a869]/40 mb-6"
          >
            <FontAwesomeIcon icon={faCrown} className="text-[#d4af37] text-[11px]" />
            <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#f1d77e]">
              Haute Couture Rental Experience
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-5xl lg:text-7xl font-bold tracking-tight mb-6 leading-[1.1]"
            style={SERIF}
          >
            <span className="text-white">Về </span>
            <span className="text-shine-gold-animated">CostumeHUB</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-gray-300 text-lg lg:text-xl font-light leading-relaxed max-w-3xl mx-auto"
          >
            Nơi nghệ thuật thời trang hòa quyện cùng sự kiêu hãnh. Chúng tôi mang đến cho bạn những tuyệt tác trang phục thiết kế cao cấp, giúp bạn tự tin tỏa sáng rực rỡ trong mọi sự kiện trọng đại.
          </motion.p>

          {/* Stats Bar */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto bg-white/5 backdrop-blur-md border border-[#c9a869]/30 rounded-2xl p-6 shadow-2xl"
          >
            <div className="text-center border-b sm:border-b-0 sm:border-r border-[#c9a869]/20 pb-4 sm:pb-0">
              <span className="text-3xl lg:text-4xl font-bold text-[#f1d77e] block" style={SERIF}>1,500+</span>
              <span className="text-[11px] uppercase tracking-widest text-gray-300 mt-1 block">Trang phục thiết kế</span>
            </div>
            <div className="text-center border-b sm:border-b-0 sm:border-r border-[#c9a869]/20 pb-4 sm:pb-0">
              <span className="text-3xl lg:text-4xl font-bold text-[#f1d77e] block" style={SERIF}>8,000+</span>
              <span className="text-[11px] uppercase tracking-widest text-gray-300 mt-1 block">Khoảnh khắc tỏa sáng</span>
            </div>
            <div className="text-center">
              <span className="text-3xl lg:text-4xl font-bold text-[#f1d77e] block" style={SERIF}>99.8%</span>
              <span className="text-[11px] uppercase tracking-widest text-gray-300 mt-1 block">Hài lòng tuyệt đối</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── CÂU CHUYỆN THƯƠNG HIỆU ── */}
      <section className="max-w-7xl mx-auto px-6 lg:px-12 mt-16 lg:mt-24">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center"
        >
          <div>
            <div className="flex items-center gap-2 mb-3">
              <FontAwesomeIcon icon={faGem} className="text-[11px] text-[#d4af37]" />
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#b8935a]">
                Hành Trình Kiến Tạo
              </span>
            </div>

            <h2 className="text-3xl lg:text-5xl font-bold text-[#1a1a1a] mb-6 leading-tight" style={SERIF}>
              Câu Chuyện Của CostumeHUB
            </h2>

            <p className="text-gray-600 text-base lg:text-lg leading-relaxed mb-6 font-light">
              <span className="text-3xl font-bold text-[#b8935a] float-left mr-2 leading-none" style={SERIF}>C</span>
              ostumeHUB ra đời từ khát vọng định hình lại trải nghiệm thuê thời trang cao cấp tại Việt Nam. Chúng tôi tin rằng mỗi sự kiện, mỗi bữa tiệc hay mỗi lần bước lên sân khấu là một tác phẩm nghệ thuật, nơi bạn chính là tâm điểm tỏa sáng.
            </p>

            {/* Luxury Quote Callout */}
            <div className="my-8 p-6 bg-gradient-to-r from-[#f5efe3] to-[#faf6f0] border-l-4 border-[#c9a869] rounded-r-2xl shadow-sm">
              <p className="italic text-[#7a5f2e] text-lg lg:text-xl leading-relaxed font-serif" style={SERIF}>
                “Chúng tôi không chỉ cho thuê trang phục — chúng tôi tôn vinh thần thái, sự tự tin và khí chất riêng biệt của bạn trong từng đường kim mũi chỉ.”
              </p>
            </div>

            <p className="text-gray-600 text-base leading-relaxed font-light">
              Mỗi bộ trang phục tại CostumeHUB đều trải qua quá trình tuyển chọn khắt khe, chăm chút tỉ mỉ và bảo quản theo tiêu chuẩn nghiêm ngặt nhất.
            </p>
          </div>

          {/* Double overlapping images */}
          <div className="relative">
            <div className="rounded-3xl overflow-hidden shadow-2xl border-2 border-[#c9a869]/30 aspect-[4/3] relative z-10 luxury-card-border">
              <img
                src="/images/homepage/promo_evening.png"
                alt="Trang phục kiêu sa CostumeHUB"
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
              />
            </div>
            <div className="hidden sm:block absolute -bottom-8 -right-8 w-2/3 aspect-[4/3] rounded-2xl overflow-hidden shadow-xl border-4 border-white z-20">
              <img
                src="/images/homepage/cat_evening.png"
                alt="Bộ sưu tập dạ hội"
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
              />
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── GIÁ TRỊ CỐT LÕI ── */}
      <section className="max-w-7xl mx-auto px-6 lg:px-12 mt-28">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#b8935a] block mb-2">
            Đẳng Cấp Làm Nên Thương Hiệu
          </span>
          <h2 className="text-4xl lg:text-5xl font-bold text-[#1a1a1a]" style={SERIF}>
            Tại Sao Khách Hàng Chọn CostumeHUB?
          </h2>
          <div className="flex items-center justify-center gap-3 mt-4">
            <div className="w-12 h-px bg-gradient-to-r from-transparent to-[#d4c5b0]" />
            <span className="text-[#b8935a] text-[11px]">✦</span>
            <div className="w-12 h-px bg-gradient-to-l from-transparent to-[#d4c5b0]" />
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: faGem,
              title: "Thiết Kế Độc Bản & Haute Couture",
              desc: "Sở hữu bộ sưu tập váy dạ hội, áo dài & vest thượng hạng từ các nhà thiết kế hàng đầu, cập nhật xu hướng catwalk mới nhất.",
            },
            {
              icon: faSprayCanSparkles,
              title: "Giặt Hấp & Khử Trùng Cung Điện",
              desc: "Quy trình giặt khô bằng dung dịch hữu cơ sinh học kết hợp hấp ozone khử trùng 100%, bảo vệ làn da và giữ chất liệu mới tinh.",
            },
            {
              icon: faShieldAlt,
              title: "Quy Trình Thuê & Hoàn Cọc Tốc Độ",
              desc: "Thủ tục đặt trực tuyến minh bạch, nhận hàng nhanh chóng và hoàn tiền đặt cọc vào Ví trong vòng 5 phút sau khi trả đồ.",
            },
          ].map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: idx * 0.1 }}
              className="group bg-white p-9 rounded-3xl border border-[#e6dcab]/70 shadow-md hover:shadow-[0_20px_45px_rgba(184,147,90,0.2)] hover:-translate-y-2 transition-all duration-500 luxury-btn-shine"
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#f8f3ea] to-[#efe5d3] group-hover:from-[#d4af37] group-hover:to-[#8a6a2f] flex items-center justify-center mb-6 shadow-sm group-hover:shadow-lg transition-all duration-500">
                <FontAwesomeIcon icon={item.icon} className="text-2xl text-[#b8935a] group-hover:text-white transition-colors duration-500" />
              </div>
              <h3 className="text-xl font-bold text-[#1a1a1a] mb-3 leading-snug" style={SERIF}>
                {item.title}
              </h3>
              <p className="text-gray-600 text-[14px] leading-relaxed font-light">
                {item.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── CHÍNH SÁCH THUÊ & ĐỀN BÙ ── */}
      <section className="bg-white border-y border-[#e6dcab]/60 py-24 mt-28 shadow-sm relative">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#faf1dd] text-[#8a6a3c] border border-[#e2d5bd] mb-3">
              <FontAwesomeIcon icon={faShieldAlt} className="text-[11px]" />
              <span className="text-[11px] font-bold uppercase tracking-widest">
                Minh Bạch & Chuẩn Mực
              </span>
            </div>
            <h2 className="text-3xl lg:text-5xl font-bold text-[#1a1a1a]" style={SERIF}>
              Chính Sách Cho Thuê & Quy Định Khấu Trừ Cọc
            </h2>
            <p className="text-gray-500 mt-3 text-base lg:text-lg max-w-2xl mx-auto font-light">
              Mọi đơn thuê tại CostumeHUB đều tuân thủ nguyên tắc công bằng, rõ ràng và bảo vệ quyền lợi tối đa cho quý khách.
            </p>
          </motion.div>

          {/* 4 Điều Khoản Cơ Bản */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-20">
            {[
              {
                icon: faFileContract,
                title: "Trách Nhiệm Bảo Quản & Thời Hạn Trả",
                desc: "Khách hàng vui lòng bảo quản trang phục cẩn thận và hoàn trả đúng thời gian đã cam kết ghi trong đơn hàng.",
              },
              {
                icon: faMoneyBillWave,
                title: "Phí Trả Trễ Hạn",
                desc: "Trường hợp quá hạn trả hàng không báo trước: tính 10% tiền cọc cho mỗi ngày trễ (tối đa không vượt quá 100% tiền cọc).",
              },
              {
                icon: faClipboardCheck,
                title: "Đánh Giá Khách Quan Lúc Nhận Lại",
                desc: "Chuyên viên sẽ kiểm tra trực tiếp tình trạng sản phẩm dưới sự chứng kiến hoặc xác nhận qua biên bản hình ảnh minh bạch.",
              },
              {
                icon: faUndo,
                title: "Hoàn Tiền Đặt Cọc Nhanh Chóng",
                desc: "Số tiền cọc còn lại sau khi khấu trừ phí (nếu có) sẽ được hoàn trả tự động vào Ví tài khoản cá nhân ngay lập tức.",
              },
            ].map((policy, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.08 }}
                className="flex gap-5 p-7 rounded-2xl bg-[#faf8f4] border border-[#eee2c8] shadow-sm hover:shadow-md transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-white border border-[#c9a869]/30 flex items-center justify-center text-[#b8935a] shrink-0 shadow-sm">
                  <FontAwesomeIcon icon={policy.icon} className="text-lg" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-[#1a1a1a] mb-1.5" style={SERIF}>
                    {policy.title}
                  </h4>
                  <p className="text-[13px] text-gray-600 leading-relaxed font-light">
                    {policy.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* ── BẢNG KHẤU TRỪ CỌC SANG TRỌNG ── */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="bg-white rounded-3xl shadow-[0_16px_50px_rgba(0,0,0,0.06)] border border-[#e6dcab] overflow-hidden"
          >
            {/* Header Bảng */}
            <div className="bg-gradient-to-r from-[#1a1a1a] via-[#2a2a2a] to-[#1a1a1a] text-white p-8 border-b border-[#c9a869]/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#d4af37] to-[#8a6a2f] flex items-center justify-center shadow-lg">
                  <FontAwesomeIcon icon={faCrown} className="text-white text-lg" />
                </div>
                <div>
                  <h3 className="text-2xl lg:text-3xl font-bold text-[#f5e6ca]" style={SERIF}>
                    Bảng Biểu Phí Đền Bù & Khấu Trừ Tiền Cọc
                  </h3>
                  <p className="text-xs text-gray-300 mt-1 uppercase tracking-widest font-light">
                    Quy định minh bạch 5 cấp độ áp dụng khi kiểm tra hàng
                  </p>
                </div>
              </div>
              <span className="text-[11px] uppercase tracking-widest text-[#f1d77e] bg-white/10 px-4 py-2 rounded-full border border-[#c9a869]/30 self-start md:self-auto">
                Cập nhật chuẩn Haute Couture
              </span>
            </div>

            {/* Content Bảng List */}
            <div className="p-6 lg:p-8 space-y-4 bg-[#faf9f7]">
              {DAMAGE_TIERS.map((tier) => (
                <div
                  key={tier.level}
                  className="bg-white rounded-2xl p-6 border border-[#eae2d5] hover:border-[#c9a869] hover:shadow-md transition-all duration-300 flex flex-col lg:flex-row lg:items-center justify-between gap-6"
                >
                  <div className="flex items-start gap-4 flex-1">
                    <span className="shrink-0 w-8 h-8 rounded-full bg-[#1a1a1a] text-[#f5e6ca] flex items-center justify-center text-[12px] font-bold shadow-sm">
                      {tier.level}
                    </span>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`w-2 h-2 rounded-full ${tier.dotColor}`} />
                        <h4 className="text-xl font-bold text-[#1a1a1a]" style={SERIF}>
                          {tier.title}
                        </h4>
                      </div>
                      <p className="text-[14px] text-gray-600 font-light leading-relaxed">
                        {tier.desc}
                      </p>
                      <p className="text-[12px] text-gray-400 italic mt-1">
                        {tier.detail}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 pl-12 lg:pl-0 border-t lg:border-t-0 pt-3 lg:pt-0 border-gray-100 flex items-center justify-between lg:justify-end gap-3">
                    <div className="text-left lg:text-right">
                      <span className={`inline-block px-4 py-2 rounded-full text-[12px] font-bold tracking-wider uppercase border ${tier.badgeBg}`}>
                        {tier.rate}
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              <div className="p-4 rounded-xl bg-[#faf1dd]/60 border border-[#e6ddc9] flex items-center gap-3 text-xs text-[#7a6438]">
                <FontAwesomeIcon icon={faCircleExclamation} className="text-sm shrink-0" />
                <p>
                  * Mức khấu trừ chi tiết được nhân viên kiểm tra trực tiếp và lập biên bản hình ảnh minh bạch với khách hàng trước khi hoàn tất thủ tục trả cọc.
                </p>
              </div>
            </div>
          </motion.div>

          {/* ── QUY TRÌNH XỬ LÝ 4 BƯỚC ── */}
          <div className="mt-24">
            <div className="text-center mb-14">
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#b8935a] block mb-2">
                Nhanh Chóng & Tiện Lợi
              </span>
              <h3 className="text-3xl lg:text-4xl font-bold text-[#1a1a1a]" style={SERIF}>
                Quy Trình Hoàn Trả Đồ & Nhận Tiền Cọc
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {PROCESS_STEPS.map((step) => (
                <div
                  key={step.step}
                  className="bg-white p-7 rounded-2xl border border-[#eee2c8] shadow-sm relative group hover:border-[#c9a869] hover:shadow-md transition-all duration-300"
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl font-bold text-[#b8935a]" style={SERIF}>
                      {step.step}
                    </span>
                    <div className="w-10 h-10 rounded-full bg-[#faf6f0] group-hover:bg-[#1a1a1a] group-hover:text-white flex items-center justify-center text-[#b8935a] transition-all duration-300">
                      <FontAwesomeIcon icon={step.icon} className="text-sm" />
                    </div>
                  </div>
                  <h4 className="font-bold text-[#1a1a1a] text-lg mb-2" style={SERIF}>
                    {step.title}
                  </h4>
                  <p className="text-[13px] text-gray-500 font-light leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* ── SUPPORT BOX ── */}
          <div className="mt-16 bg-gradient-to-r from-[#1a1a1a] to-[#2d2d2d] text-white rounded-2xl p-8 border border-[#c9a869]/30 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
            <div className="flex items-center gap-4 text-center sm:text-left">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#d4af37] to-[#8a6a2f] flex items-center justify-center shrink-0 shadow-md">
                <FontAwesomeIcon icon={faCircleCheck} className="text-white text-xl" />
              </div>
              <div>
                <h4 className="text-xl font-bold text-[#f5e6ca]" style={SERIF}>
                  Bạn cần tư vấn chi tiết về chính sách?
                </h4>
                <p className="text-xs text-gray-300 font-light mt-1">
                  Đội ngũ chăm sóc khách hàng CostumeHUB luôn sẵn sàng hỗ trợ bạn 24/7.
                </p>
              </div>
            </div>
            <a
              href="/collections"
              className="shrink-0 bg-gradient-to-r from-[#d4af37] to-[#8a6a2f] text-white px-7 py-3 rounded-full font-bold text-[11px] uppercase tracking-widest luxury-btn-gold-shine shadow-md hover:brightness-110 transition-all"
            >
              Khám phá bộ sưu tập ngay
            </a>
          </div>

        </div>
      </section>
    </div>
  );
}
