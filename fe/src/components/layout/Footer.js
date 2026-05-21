export default function Footer() {
  return (
    <footer className="bg-ghost-fog border-t border-sterling-gray pt-16 pb-8 px-6">
      <div className="mx-auto max-w-[1200px]">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="md:col-span-1">
            <a href="/" className="text-abyssal-black font-medium tracking-[-0.02em]" style={{ fontSize: '20px' }}>CostumeHUB</a>
            <p className="mt-4 text-midnight-ink/50" style={{ fontSize: '14px', lineHeight: 1.49, letterSpacing: '-0.056px' }}>
              Vietnam's leading premium fashion rental platform.
            </p>
          </div>
          
          <div>
            <h4 className="text-[14px] font-medium uppercase tracking-[-0.056px] text-midnight-ink/40 mb-4">Services</h4>
            <ul className="space-y-3">
              {["Rent Outfits", "Style Consulting", "Event Booking", "Design Partners"].map((link) => (
                <li key={link}><a href="#" className="text-[16px] text-midnight-ink/70 hover:text-abyssal-black transition-colors" style={{ letterSpacing: '-0.064px' }}>{link}</a></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-[14px] font-medium uppercase tracking-[-0.056px] text-midnight-ink/40 mb-4">Company</h4>
            <ul className="space-y-3">
              {["About Us", "Careers", "Privacy Policy", "Terms of Service"].map((link) => (
                <li key={link}><a href="#" className="text-[16px] text-midnight-ink/70 hover:text-abyssal-black transition-colors" style={{ letterSpacing: '-0.064px' }}>{link}</a></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-[14px] font-medium uppercase tracking-[-0.056px] text-midnight-ink/40 mb-4">Contact</h4>
            <ul className="space-y-3">
              {["help@costumehub.vn", "0912 345 678", "Hanoi, Vietnam"].map((link) => (
                <li key={link}><a href="#" className="text-[16px] text-midnight-ink/70 hover:text-abyssal-black transition-colors" style={{ letterSpacing: '-0.064px' }}>{link}</a></li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-sterling-gray pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[14px] text-midnight-ink/40" style={{ letterSpacing: '-0.056px' }}>
            © 2026 CostumeHUB. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            {["Instagram", "TikTok", "Pinterest"].map((social) => (
              <a key={social} href="#" className="text-[14px] text-midnight-ink/50 hover:text-abyssal-black transition-colors" style={{ letterSpacing: '-0.056px' }}>
                {social}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}