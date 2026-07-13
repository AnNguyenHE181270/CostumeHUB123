import React from "react";

const CLOUD = "https://res.cloudinary.com/du0xdjnrx/image/upload";
const avatarUrl = (id) => `${CLOUD}/c_thumb,g_face,z_0.8,w_200,h_200,q_auto,f_auto/homepage/${id}.jpg`;

const REVIEWS = [
  {
    name: "Linh Chi",
    avatar: avatarUrl("gallery1"),
    quote: "Trang phục đẹp xuất sắc, dịch vụ tuyệt vời! Mình đã có một buổi tiệc đáng nhớ.",
  },
  {
    name: "Thanh Hằng",
    avatar: avatarUrl("gallery2"),
    quote: "Chất liệu cao cấp, mặc rất thoải mái và lên hình cực kỳ sang.",
  },
  {
    name: "Phương Anh",
    avatar: avatarUrl("gallery7"),
    quote: "Đầm trắng tinh tế và thanh lịch. Sẽ tiếp tục ủng hộ CostumeHUB!",
  },
];

function Stars() {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg key={star} className="w-3.5 h-3.5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export default function Testimonials() {
  return (
    <section className="py-14 px-6">
      <div className="max-w-[1200px] mx-auto">
        <div className="text-center mb-10">
          <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#b8935a]">
            Cảm Hứng Từ Khách Hàng
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#1a1a1a] mt-2" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            Khoảnh Khắc Tỏa Sáng
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {REVIEWS.map((r) => (
            <div
              key={r.name}
              className="bg-white rounded-2xl border border-[#f0ece5] p-6 flex items-start gap-4 shadow-sm hover:shadow-lg hover:border-[#b8935a]/30 transition-all duration-300"
            >
              <img
                src={r.avatar}
                alt={r.name}
                className="w-12 h-12 rounded-full object-cover shrink-0"
              />
              <div className="min-w-0">
                <h3 className="text-[14px] font-bold text-[#1a1a1a]">{r.name}</h3>
                <div className="mt-1 mb-2">
                  <Stars />
                </div>
                <p className="text-[13px] text-gray-500 leading-relaxed">
                  “{r.quote}”
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
