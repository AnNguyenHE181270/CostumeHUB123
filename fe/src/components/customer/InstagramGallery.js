import React from "react";

const CLOUD = "https://res.cloudinary.com/du0xdjnrx/image/upload";

const GALLERY = [
  `${CLOUD}/v1783952552/homepage/gallery1.jpg`,
  `${CLOUD}/v1783952553/homepage/gallery2.jpg`,
  `${CLOUD}/v1783952554/homepage/gallery3.jpg`,
  `${CLOUD}/v1783952555/homepage/gallery4.jpg`,
  `${CLOUD}/v1783952556/homepage/gallery5.jpg`,
  `${CLOUD}/v1783952558/homepage/gallery6.jpg`,
  `${CLOUD}/v1783952559/homepage/gallery7.jpg`,
];

export default function InstagramGallery() {
  return (
    <section className="py-20 px-6">
      <div className="max-w-[1300px] mx-auto">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-[13px] font-bold uppercase tracking-[0.15em] text-[#1a1a1a]">
              Cảm Hứng Phong Cách
            </h2>
            <p className="text-[12px] text-gray-400 mt-1">Theo dõi chúng tôi trên Instagram</p>
          </div>
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noreferrer"
            className="text-[12px] font-semibold text-[#1a1a1a] hover:text-white hover:bg-[#b8935a] hover:border-transparent active:scale-[0.98] transition-all border border-[#eaeaea] rounded-xl px-5 py-2.5 whitespace-nowrap"
          >
            Xem Thêm
          </a>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {GALLERY.map((src, i) => (
            <div key={i} className="group relative aspect-square rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
              <img
                src={src}
                alt={`CostumeHUB style ${i + 1}`}
                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-115"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors duration-300" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
