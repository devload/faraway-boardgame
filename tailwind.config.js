/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Faraway palette — dawn / dusk / mystical fantasy tones
        parch: {
          cream: '#f5efe3',   // dawn cream (bg)
          light: '#fdf7ec',   // card surface light
          warm: '#ecdfc9',    // card surface warm
        },
        sunset: {
          DEFAULT: '#c48b6e', // sunset orange (accent)
          soft:    '#d9a68a', // softer sunset
          deep:    '#a87050', // deep amber
        },
        earth: {
          brown: '#8b6f47',   // frame border
          light: '#b8946b',   // soft brown
        },
        mist: {
          blue: '#4a5c6a',    // misty text
          soft: '#6b7d8c',
        },
        night: {
          indigo: '#2d2438',  // deep night sanctuary
          deep:   '#1b1424',
        },
        gold: {
          DEFAULT: '#d4a574', // score gold
          bright:  '#e8bd8a',
        },
        moss: {
          green: '#88a065',   // icon green
          light: '#a5bd80',
        },
      },
      fontFamily: {
        display: ['"Cinzel"', 'Georgia', 'serif'],
        serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        mono: ['"Space Mono"', 'monospace'],
        body: ['"Inter"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'parchment': '0 8px 24px rgba(45,36,56,0.15), inset 0 0 0 1px rgba(255,255,255,0.5)',
        'card-lift': '0 4px 12px rgba(45,36,56,0.1)',
        'gold-glow': '0 0 8px rgba(212,165,116,0.5)',
      },
      backgroundImage: {
        'dawn-radial': 'radial-gradient(circle at 20% 15%, rgba(196,139,110,0.08) 0, transparent 40%), radial-gradient(circle at 80% 90%, rgba(139,111,71,0.06) 0, transparent 45%), #f5efe3',
        'sunset-illust': 'linear-gradient(160deg, #b58ba4 0%, #c48b6e 60%, #d4a574 100%)',
        'forest-illust': 'linear-gradient(160deg, #5b7d6a 0%, #88a065 60%, #a5bd80 100%)',
        'water-illust': 'linear-gradient(160deg, #4a7ba8 0%, #6ba3c8 60%, #d4a574 100%)',
        'flower-illust': 'linear-gradient(160deg, #c48b95 0%, #d9a68a 60%, #ffd7a8 100%)',
      },
    },
  },
  plugins: [],
}
