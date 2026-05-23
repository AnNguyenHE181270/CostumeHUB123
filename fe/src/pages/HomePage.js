import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight, faTruckFast, faShieldHalved, faSearch, faShirt } from "@fortawesome/free-solid-svg-icons";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function HomePage() {
  const { token, isProfileComplete, user, loading } = useAuth();

  // Chờ load session F5
  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1a1a1a]"></div>
      </div>
    );
  }

  // Nếu người dùng đã đăng nhập nhưng chưa hoàn thành thông tin -> Bắt sang trang hoàn thành thông tin (chỉ chạy khi có sẵn email)
  if (token && !isProfileComplete && user?.email) {
    return <Navigate to={`/complete-with-google/${encodeURIComponent(user.email)}`} replace />;
  }
  return (
    <>
        <section className="bg-canvas-white pt-24 pb-32 px-6">
          <div className="mx-auto max-w-[1200px] text-center">
            <h1 className="text-abyssal-black font-normal mx-auto" style={{ fontSize: 'clamp(40px, 8vw, 83px)', lineHeight: 0.95, letterSpacing: '-0.03em', maxWidth: '900px' }}>Rent Your Style,<br />Without Limits</h1>
            <p className="mt-8 text-midnight-ink/70 mx-auto" style={{ fontSize: '16px', lineHeight: 1.6, letterSpacing: '-0.064px', maxWidth: '540px' }}>Discover thousands of premium designs from Valentino, Acne Studios, Zimmermann. Confidently shine in every moment without owning.</p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button className="flex items-center gap-2 bg-action-blue text-canvas-white px-6 py-3 rounded-buttons text-[16px] font-medium hover:bg-blue-700 transition-colors">Explore Collections <FontAwesomeIcon icon={faArrowRight} className="text-[12px]" /></button>
              <button className="flex items-center gap-2 bg-canvas-white text-abyssal-black border border-abyssal-black px-6 py-3 rounded-buttons text-[16px] font-medium hover:bg-ghost-fog transition-colors">How It Works</button>
            </div>
            <div className="mt-20 border border-sterling-gray rounded-largeFeatures overflow-hidden bg-ghost-fog h-[400px] lg:h-[500px] flex items-center justify-center">
              <div className="text-center"><FontAwesomeIcon icon={faShirt} className="text-sterling-gray text-5xl mb-4" /><p className="text-midnight-ink/40 text-[14px] tracking-[-0.056px]">Hero Image / Video Placeholder</p></div>
            </div>
          </div>
        </section>

        <section className="bg-ghost-fog py-24 px-6">
          <div className="mx-auto max-w-[1200px]">
            <div className="flex items-end justify-between mb-12">
              <div>
                <p className="text-warning-orange text-[14px] font-medium tracking-[-0.056px] mb-2">Featured</p>
                <h2 className="text-abyssal-black font-normal" style={{ fontSize: '40px', lineHeight: 1.1, letterSpacing: '-0.44px' }}>Latest Collections</h2>
              </div>
              <a href="#" className="hidden md:flex items-center gap-2 text-[16px] font-medium hover:text-action-blue transition-colors">View All <FontAwesomeIcon icon={faArrowRight} className="text-[12px]" /></a>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[ { title: "Elegant Evening Wear", desc: "Valentino, The Row", color: "bg-[#e8e4df]" }, { title: "Resort Wear", desc: "Zimmermann, Acne Studios", color: "bg-[#dfe8e4]" }, { title: "Bold Streetwear", desc: "Balenciaga, Off-White", color: "bg-[#e0dfe8]" }, ].map((col, i) => (
                <div key={i} className="group cursor-pointer">
                  <div className={`${col.color} rounded-cards h-[420px] flex items-end p-8 transition-transform duration-300 group-hover:scale-[1.02]`}>
                    <div><h3 className="text-abyssal-black font-normal" style={{ fontSize: '32px', lineHeight: 1.1, letterSpacing: '-0.32px' }}>{col.title}</h3><p className="text-midnight-ink/60 mt-2" style={{ fontSize: '16px', letterSpacing: '-0.064px' }}>{col.desc}</p></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-canvas-white py-24 px-6">
          <div className="mx-auto max-w-[1200px]">
            <div className="text-center mb-16">
              <h2 className="text-abyssal-black font-normal" style={{ fontSize: '48px', lineHeight: 1.1, letterSpacing: '-0.96px' }}>Simple & Elegant</h2>
              <p className="mt-4 text-midnight-ink/60 mx-auto" style={{ fontSize: '16px', lineHeight: 1.4, letterSpacing: '-0.064px', maxWidth: '500px' }}>In just 3 steps, you can step out in a completely new style.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[ { icon: faSearch, title: "Choose Design", desc: "Browse through thousands of premium outfits from the world's leading fashion houses." }, { icon: faTruckFast, title: "Express Delivery", desc: "Outfits are carefully packaged and delivered fast within 48 hours." }, { icon: faShieldHalved, title: "Easy Return", desc: "Just pack it up after wearing and schedule a pickup. Dry cleaning is included." }, ].map((step, i) => (
                <div key={i} className="bg-ghost-fog rounded-cards pt-16 pb-12 px-11">
                  <div className="w-12 h-12 bg-canvas-white rounded-largeFeatures flex items-center justify-center mb-6"><FontAwesomeIcon icon={step.icon} className="text-action-blue text-[18px]" /></div>
                  <h3 className="text-abyssal-black font-normal mb-3" style={{ fontSize: '32px', lineHeight: 1.1, letterSpacing: '-0.32px' }}>{step.title}</h3>
                  <p className="text-midnight-ink/60" style={{ fontSize: '16px', lineHeight: 1.4, letterSpacing: '-0.064px' }}>{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-ghost-fog py-24 px-6">
          <div className="mx-auto max-w-[900px] text-center">
            <h2 className="text-abyssal-black font-normal" style={{ fontSize: '48px', lineHeight: 1.1, letterSpacing: '-0.96px' }}>Ready to elevate your style?</h2>
            <p className="mt-4 text-midnight-ink/60 mx-auto" style={{ fontSize: '16px', lineHeight: 1.4, letterSpacing: '-0.064px', maxWidth: '460px' }}>Sign up now and get 20% off your first rental.</p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button className="flex items-center gap-2 bg-warning-orange text-canvas-white px-6 py-3 rounded-buttons text-[16px] font-medium hover:bg-orange-600 transition-colors">Get Started Now <FontAwesomeIcon icon={faArrowRight} className="text-[12px]" /></button>
            </div>
          </div>
        </section>
    </>
  );
}