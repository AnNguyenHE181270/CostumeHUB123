import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight, faTruckFast, faShieldHalved, faSearch, faShirt } from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "../context/AuthContext";

// Import Components
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import Button from "../components/ui/Button";

export default function HomePage() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-border-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background font-sans text-text-primary flex flex-col">
      <Header />

      <main className="flex-1">
        {/* ================= HERO SECTION ================= */}
        <section className="bg-background pt-20 pb-32 px-6">
          <div className="mx-auto max-w-[1200px] text-center">
            <h1 className="text-text-primary font-semibold mx-auto tracking-tight text-5xl md:text-7xl max-w-4xl leading-[1.05]">
              Rent Your Style,
              <br />
              Without Limits
            </h1>
            <p className="mt-6 text-text-secondary text-lg max-w-xl mx-auto leading-relaxed">
              Discover thousands of premium designs from Valentino, Acne Studios,
              Zimmermann. Confidently shine in every moment without owning.
            </p>
            
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              {/* Sử dụng Button component mới */}
              <Button 
                variant="primary" 
                label="Explore Collections" 
                icon={faArrowRight}
                className="w-full sm:w-auto px-8"
              />
              <Button 
                variant="outline" 
                label="How It Works" 
                className="w-full sm:w-auto px-8"
              />
            </div>

            <div className="mt-20 border border-borderorder rounded-[2rem] overflow-hidden bg-surface h-[400px] lg:h-[500px] flex flex-col items-center justify-center transition-all">
              <FontAwesomeIcon icon={faShirt} className="text-text-muted text-5xl mb-4" />
              <p className="text-text-muted text-sm tracking-wide">Hero Image / Video Placeholder</p>
            </div>
          </div>
        </section>

        {/* ================= LATEST COLLECTIONS ================= */}
        <section className="bg-surface py-24 px-6 border-t border-borderorder">
          <div className="mx-auto max-w-[1200px]">
            <div className="flex items-end justify-between mb-12">
              <div>
                <p className="text-warning-500 text-sm font-semibold tracking-wide uppercase mb-2">
                  Featured
                </p>
                <h2 className="text-text-primary text-4xl font-semibold tracking-tight">
                  Latest Collections
                </h2>
              </div>
              <a href="#" className="hidden md:flex items-center gap-2 text-sm font-medium hover:text-primary-600 transition-colors">
                View All <FontAwesomeIcon icon={faArrowRight} className="text-[12px]" />
              </a>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { title: "Elegant Evening Wear", desc: "Valentino, The Row", color: "bg-[#e8e4df]" },
                { title: "Resort Wear", desc: "Zimmermann, Acne Studios", color: "bg-[#dfe8e4]" },
                { title: "Bold Streetwear", desc: "Balenciaga, Off-White", color: "bg-[#e0dfe8]" },
              ].map((col, i) => (
                <div key={i} className="group cursor-pointer">
                  <div className={`${col.color} rounded-[2rem] h-[420px] flex items-end p-8 transition-transform duration-300 group-hover:scale-[1.02] shadow-sm hover:shadow-md`}>
                    <div>
                      <h3 className="text-text-primary text-3xl font-semibold tracking-tight leading-tight">
                        {col.title}
                      </h3>
                      <p className="text-text-primary/70 mt-2 text-base">
                        {col.desc}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ================= HOW IT WORKS ================= */}
        <section className="bg-background py-24 px-6">
          <div className="mx-auto max-w-[1200px]">
            <div className="text-center mb-16">
              <h2 className="text-text-primary text-4xl font-semibold tracking-tight">
                Simple & Elegant
              </h2>
              <p className="mt-4 text-text-secondary text-base max-w-lg mx-auto leading-relaxed">
                In just 3 steps, you can step out in a completely new style.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { icon: faSearch, title: "Choose Design", desc: "Browse through thousands of premium outfits from the world's leading fashion houses." },
                { icon: faTruckFast, title: "Express Delivery", desc: "Outfits are carefully packaged and delivered fast within 48 hours." },
                { icon: faShieldHalved, title: "Easy Return", desc: "Just pack it up after wearing and schedule a pickup. Dry cleaning is included." },
              ].map((step, i) => (
                <div key={i} className="bg-surface border border-borderorder rounded-[2rem] pt-16 pb-12 px-10 hover:shadow-sm transition-shadow">
                  <div className="w-14 h-14 bg-background border border-borderorder rounded-full flex items-center justify-center mb-8 shadow-sm">
                    <FontAwesomeIcon icon={step.icon} className="text-primary-600 text-lg" />
                  </div>
                  <h3 className="text-text-primary text-2xl font-semibold mb-3 tracking-tight">
                    {step.title}
                  </h3>
                  <p className="text-text-secondary text-base leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ================= CTA SECTION ================= */}
        <section className="bg-surface py-24 px-6 border-t border-borderorder">
          <div className="mx-auto max-w-[900px] text-center">
            <h2 className="text-text-primary text-4xl md:text-5xl font-semibold tracking-tight">
              Ready to elevate your style?
            </h2>
            <p className="mt-6 text-text-secondary text-lg max-w-md mx-auto leading-relaxed">
              Sign up now and get 20% off your first rental.
            </p>
            <div className="mt-10 flex items-center justify-center">
              <Button 
                variant="primary" 
                label="Get Started Now" 
                icon={faArrowRight}
                className="w-full sm:w-auto px-10 py-4 text-base"
              />
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}