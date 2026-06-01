import React from "react";

export default function Footer() {
  return (
    <footer className="bg-surface border-t border-borderorder pt-16 pb-8 px-6">
      <div className="mx-auto max-w-[1200px]">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="md:col-span-1">
            <a href="/" className="text-text-primary font-bold text-xl tracking-tight">
              Luxe Rent
            </a>
            <p className="mt-4 text-text-secondary text-sm leading-relaxed">
              Sustainable luxury clothing rental for every occasion.
            </p>
          </div>
          
          <div>
            <h4 className="text-sm font-semibold text-text-primary mb-4">Shop</h4>
            <ul className="space-y-3">
              {["Dresses", "Suits", "Accessories", "New Arrivals"].map((link) => (
                <li key={link}>
                  <a href="#" className="text-sm text-text-secondary hover:text-primary-600 transition-colors">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-text-primary mb-4">Company</h4>
            <ul className="space-y-3">
              {["About Us", "Sustainability", "Careers", "Press"].map((link) => (
                <li key={link}>
                  <a href="#" className="text-sm text-text-secondary hover:text-primary-600 transition-colors">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-text-primary mb-4">Support</h4>
            <ul className="space-y-3">
              {["FAQ", "Contact Us", "Shipping", "Returns"].map((link) => (
                <li key={link}>
                  <a href="#" className="text-sm text-text-secondary hover:text-primary-600 transition-colors">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-borderorder pt-8 flex items-center justify-center">
          <p className="text-sm text-text-muted">
            © 2024 Luxe Rent. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}