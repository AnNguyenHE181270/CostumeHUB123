/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],

  theme: {
    extend: {
      // ================= Colors =================
      colors: {
        // Core palette (Vogue Rental system)
        primary:       "#090909",
        secondary:     "#333333",
        tertiary:      "#707070",

        "charcoal-grey":   "#474747",
        "light-gray":      "#858585",
        "light-silver":    "#c7c7c7",
        "border-silver":   "#d9d9d9",
        "lightest-gray-bg":"#efefed",

        background: "#ffffff",
        surface:    "#f5f5f7",

        // Actions
        "interactive-blue":    "#0057f3",
        "action-blue":         "#0057f3",
        "warning-orange":      "#ff5102",
        "sky-blue-highlight":  "#2997ff",

        // Accents
        "deep-plum":   "#7424b5",
        "blush-pink":  "#ea33c0",
        "cool-teal":   "#04485b",
        "true-black":  "#000000",

        // Fourmula / Sunset editorial tokens
        "midnight-coal":   "#020108",
        "cloud-white":     "#ffffff",
        "ash-grey":        "#333333",
        "canvas-fog":      "#f7f7f7",
        "stone-whisper":   "#d7d7d6",
        "muted-slate":     "#818084",
        "ink-black":       "#000000",
        "sunset-orange":   "#f94a00",
        "desert-gold":     "#fd7b03",
        "sky-blue":        "#48a3d1",
        "rich-amethyst":   "#3a54ff",
        "deep-crimson":    "#9a0101",
      },

      // ================= Typography =================
      fontFamily: {
        // Fashion / editorial headline
        headline: [
          '"Cormorant Garamond"',
          '"Playfair Display"',
          "Georgia",
          "serif",
        ],
        // Clean UI body
        body: [
          '"DM Sans"',
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "sans-serif",
        ],
        // Monospace for small labels / codes
        mono: ['"JetBrains Mono"', "Menlo", "monospace"],
      },

      fontSize: {
        // Vogue Rental scale
        caption:      ["13px", { lineHeight: "1.5",  letterSpacing: "0.04em" }],
        "body-sm":    ["14px", { lineHeight: "1.49", letterSpacing: "-0.01px" }],
        body:         ["16px", { lineHeight: "1.4",  letterSpacing: "-0.064px" }],
        subheading:   ["20px", { lineHeight: "1.2",  letterSpacing: "-0.013px" }],
        "heading-sm": ["27px", { lineHeight: "1.15", letterSpacing: "-0.015px" }],
        heading:      ["40px", { lineHeight: "1.1",  letterSpacing: "-0.44px" }],
        "heading-lg": ["56px", { lineHeight: "1.0",  letterSpacing: "-1.2px" }],
        display:      ["80px", { lineHeight: "0.95", letterSpacing: "-2px" }],

        // Fourmula editorial token aliases
        "f-body":     ["14px", { lineHeight: "1.39", letterSpacing: "-0.01px" }],
        "f-sub":      ["20px", { lineHeight: "1.2",  letterSpacing: "-0.013px" }],
        "f-heading":  ["43px", { lineHeight: "1.05", letterSpacing: "-0.02px" }],
        "f-display":  ["100px",{ lineHeight: "0.94", letterSpacing: "-0.031px" }],
      },

      // ================= Spacing =================
      spacing: {
        section: "64px",
        card:    "40px",
        // Fourmula tokens
        "f-12":  "12px",
        "f-20":  "20px",
        "f-40":  "40px",
        "f-100": "100px",
        "f-172": "172px",
      },

      // ================= Border Radius =================
      borderRadius: {
        // Vogue Rental
        cards:      "16px",
        buttons:    "32px",
        navigation: "6px",
        large:      "24px",
        pill:       "9999px",

        // Fourmula tokens
        "f-badge":  "1.33px",
        "f-img":    "26.62px",
        "f-btn":    "1317.53px",
        "f-card-lg":"19.96px",
        "f-card-sm":"6.65px",
        "f-promo":  "39.93px",
        "f-footer": "119.78px",
      },

      // ================= Gradients (as CSS vars via plugin) =================
      // Use directly in className via backgroundImage
      backgroundImage: {
        "sunset-orange": "linear-gradient(rgb(249,74,0), rgb(253,123,3))",
        "sky-blue-grad":  "linear-gradient(rgb(72,163,209), rgb(253,123,3))",
        "amethyst-grad":  "linear-gradient(rgb(58,84,255), rgb(122,103,197) 23%, rgb(253,123,3))",
        "crimson-grad":   "linear-gradient(rgb(154,1,1), rgb(253,123,3))",
        // Fashion hero gradient
        "hero-dark":      "linear-gradient(160deg, #0a0a0a 0%, #1a1a1a 60%, #2d1a0e 100%)",
        "overlay-soft":   "linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.5) 100%)",
      },

      // ================= Box Shadow =================
      boxShadow: {
        soft:      "0 10px 30px rgba(0,0,0,0.08)",
        editorial: "0 2px 0 0 #090909",
        crisp:     "4px 4px 0 0 #090909",
        form:      "0 24px 48px rgba(0,0,0,0.12)",
      },

      // ================= Layout =================
      maxWidth: {
        content: "1200px",
        form:    "28rem",
        "form-lg": "34rem",
      },
    },
  },

  plugins: [],
};