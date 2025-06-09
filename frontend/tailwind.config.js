/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'primary-gradient-start': '#3B82F6',
        'primary-gradient-end': '#8B5CF6',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(59, 130, 246, 0.5)' },
          '100%': { boxShadow: '0 0 20px rgba(59, 130, 246, 0.8), 0 0 40px rgba(59, 130, 246, 0.4)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      fontFamily: {
        'display': ['Inter var', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
  daisyui: {
    themes: [
      "light",
      "dark",
      {
        modern: {
          "primary": "#3B82F6",
          "primary-focus": "#2563EB",
          "primary-content": "#ffffff",
          
          "secondary": "#8B5CF6",
          "secondary-focus": "#7C3AED",
          "secondary-content": "#ffffff",
          
          "accent": "#F59E0B",
          "accent-focus": "#D97706",
          "accent-content": "#ffffff",
          
          "neutral": "#2A2E37",
          "neutral-focus": "#16181D",
          "neutral-content": "#ffffff",
          
          "base-100": "#ffffff",
          "base-200": "#F9FAFB",
          "base-300": "#F3F4F6",
          "base-content": "#1F2937",
          
          "info": "#3ABFF8",
          "success": "#10B981",
          "warning": "#F59E0B",
          "error": "#EF4444",
          
          "--rounded-box": "1rem",
          "--rounded-btn": "0.5rem",
          "--rounded-badge": "1.9rem",
          "--animation-btn": "0.25s",
          "--animation-input": "0.2s",
          "--btn-text-case": "none",
          "--btn-focus-scale": "0.95",
          "--border-btn": "1px",
          "--tab-border": "1px",
          "--tab-radius": "0.5rem",
        },
        modernDark: {
          "primary": "#60A5FA",
          "primary-focus": "#3B82F6",
          "primary-content": "#ffffff",
          
          "secondary": "#A78BFA",
          "secondary-focus": "#8B5CF6",
          "secondary-content": "#ffffff",
          
          "accent": "#FCD34D",
          "accent-focus": "#F59E0B",
          "accent-content": "#1F2937",
          
          "neutral": "#1E293B",
          "neutral-focus": "#0F172A",
          "neutral-content": "#E5E7EB",
          
          "base-100": "#0F172A",
          "base-200": "#1E293B",
          "base-300": "#334155",
          "base-content": "#F3F4F6",
          
          "info": "#60A5FA",
          "success": "#34D399",
          "warning": "#FCD34D",
          "error": "#F87171",
          
          "--rounded-box": "1rem",
          "--rounded-btn": "0.5rem",
          "--rounded-badge": "1.9rem",
          "--animation-btn": "0.25s",
          "--animation-input": "0.2s",
          "--btn-text-case": "none",
          "--btn-focus-scale": "0.95",
          "--border-btn": "1px",
          "--tab-border": "1px",
          "--tab-radius": "0.5rem",
        },
      },
    ],
  },
}