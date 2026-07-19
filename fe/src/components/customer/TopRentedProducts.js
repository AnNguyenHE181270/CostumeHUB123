import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCrown, faBagShopping, faRepeat, faGem } from "@fortawesome/free-solid-svg-icons";
import { formatPrice } from "../../utils/formatters";
import rentalService from "../../services/rental.service";

const PLACEHOLDER_IMG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='500' viewBox='0 0 400 500'%3E%3Crect fill='%23f0ece8' width='400' height='500'/%3E%3Ctext fill='%23c4bdb5' font-family='sans-serif' font-size='14' x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle'%3EHình Ảnh Sản Phẩm%3C/text%3E%3C/svg%3E";

const SIZE_BY_RANK = {
  1: "md:max-w-[360px] md:-translate-y-4",
  2: "md:max-w-[318px]",
  3: "md:max-w-[280px]",
};

const BORDER_BY_RANK = {
  1: "bg-gradient-to-br from-[#f0dcae] via-[#d4af37] to-[#8a6a2f] p-[2.5px] shadow-[0_20px_50px_rgba(184,147,90,0.35)] animate-gold-pulse",
  2: "bg-gradient-to-br from-[#ecdfc4] via-[#d8bd8b] to-[#b8935a] p-[1.5px] shadow-lg hover:shadow-[0_12px_30px_rgba(184,147,90,0.22)]",
  3: "bg-gradient-to-br from-[#ecdfc4] via-[#d8bd8b] to-[#b8935a] p-[1.5px] shadow-lg hover:shadow-[0_12px_30px_rgba(184,147,90,0.22)]",
};

function RankCard({ item, rank, navigate }) {
  const { costume, rentalCount } = item;
  const isTop = rank === 1;
  const [imgError, setImgError] = useState(false);
  const imgSrc = !imgError && costume.images?.[0] ? costume.images[0] : PLACEHOLDER_IMG;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      whileHover={{ y: isTop ? -20 : -10, scale: 1.02 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: rank * 0.1 }}
      className={`w-full max-w-[340px] shrink-0 rounded-[22px] transition-all duration-500 ${SIZE_BY_RANK[rank] || ""} ${BORDER_BY_RANK[rank] || ""}`}
    >
      <div className="relative bg-white rounded-[20px] overflow-hidden flex flex-col h-full luxury-btn-shine">
        {/* Rank badge */}
        <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5">
          {isTop && (
            <span className="w-8 h-8 rounded-full bg-gradient-to-br from-[#d4af37] to-[#8a6a2f] flex items-center justify-center shadow-lg ring-2 ring-white animate-float-gentle">
              <FontAwesomeIcon icon={faCrown} className="text-white text-[12px]" />
            </span>
          )}
          <span
            className={`w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-bold border shadow-sm ${
              isTop ? "bg-[#b8935a] text-white border-[#b8935a]" : "bg-white/95 text-[#1a1a1a] border-[#e6ddc9]"
            }`}
          >
            {String(rank).padStart(2, "0")}
          </span>
        </div>

        {/* Image */}
        <div
          className="relative aspect-[4/5] overflow-hidden bg-[#f5f3f0] cursor-pointer"
          onClick={() => navigate(`/product/${costume._id}`)}
        >
          <img
            src={imgSrc}
            alt={costume.name}
            className="w-full h-full object-cover hover:scale-110 transition-transform duration-700 ease-out"
            onError={() => setImgError(true)}
          />
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col flex-1">
          <h3
            onClick={() => navigate(`/product/${costume._id}`)}
            className="text-[16px] font-bold text-[#1a1a1a] mb-2 cursor-pointer hover:text-[#b8935a] transition-colors line-clamp-1"
          >
            {costume.name}
          </h3>

          <p className="flex items-center gap-1.5 text-[11px] text-[#b8935a] font-semibold mb-3">
            <FontAwesomeIcon icon={faRepeat} className="text-[10px]" />
            Đã cho thuê {rentalCount} lượt
          </p>

          <div className="mt-auto flex flex-col gap-3">
            <span className="text-[18px] font-extrabold text-[#1a1a1a]">
              {formatPrice(costume.pricePerDay || costume.price || 0)}
              <span className="text-[12px] font-normal text-gray-500"> /ngày</span>
            </span>
            <button
              onClick={() => navigate(`/product/${costume._id}`)}
              className={`w-full py-3 text-[11px] uppercase tracking-wider font-bold rounded-lg flex items-center justify-center gap-2 transition-all duration-300 luxury-btn-gold-shine ${
                isTop
                  ? "bg-gradient-to-r from-[#d4af37] via-[#c9a35f] to-[#8a6a2f] text-white shadow-lg hover:shadow-[0_8px_20px_rgba(184,147,90,0.4)]"
                  : "border border-[#1a1a1a] text-[#1a1a1a] hover:bg-[#1a1a1a] hover:text-white"
              }`}
            >
              <FontAwesomeIcon icon={faBagShopping} className="text-[11px]" />
              Xem chi tiết
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function TopRentedProducts() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const res = await rentalService.getTopRented(3);
        setItems(res.items || []);
      } catch (err) {
        console.error("Lỗi khi tải sản phẩm được thuê nhiều nhất:", err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (!loading && items.length === 0) return null;

  const ordered = items.length === 3 ? [items[1], items[0], items[2]] : items;
  const rankOf = (item) => items.indexOf(item) + 1;

  return (
    <section className="py-16 px-6 bg-[#faf8f4] relative overflow-hidden">
      <div className="max-w-[1200px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <div className="flex items-center justify-center gap-2 mb-2">
            <FontAwesomeIcon icon={faGem} className="text-[10px] text-[#d4af37]" />
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#b8935a]">
              Sản Phẩm Được Yêu Thích
            </span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold mt-2" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            <span className="text-shine-black">Khoảnh Khắc</span>{" "}
            <span className="text-shine-gold-animated">Tỏa Sáng</span>
          </h2>
          <p className="text-[15px] text-gray-600 mt-3 max-w-md mx-auto leading-relaxed font-light">
            Những trang phục thượng hạng được đông đảo khách hàng ưu ái lựa chọn nhiều nhất tại CostumeHUB.
          </p>
          <div className="flex items-center justify-center gap-3 mt-5">
            <div className="w-12 h-px bg-gradient-to-r from-transparent to-[#d4c5b0]" />
            <span className="text-[#b8935a] text-[11px]">✦</span>
            <div className="w-12 h-px bg-gradient-to-l from-transparent to-[#d4c5b0]" />
          </div>
        </motion.div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl bg-white border border-[#f0ece5] aspect-[4/5] animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="flex flex-col md:flex-row gap-6 md:gap-4 items-center justify-center">
            {ordered.map((item) => (
              <RankCard key={item.costume._id} item={item} rank={rankOf(item)} navigate={navigate} />
            ))}
          </div>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="text-center mt-14"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => navigate("/collections")}
            className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-full border border-[#c9a869] bg-white text-[#8a6a3c] text-[12px] uppercase tracking-widest font-bold hover:bg-[#1a1a1a] hover:text-[#f1d77e] hover:border-[#1a1a1a] transition-all duration-300 shadow-md luxury-btn-gold-shine"
          >
            <FontAwesomeIcon icon={faCrown} className="text-[12px]" />
            Khám phá tất cả bộ sưu tập
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
}

