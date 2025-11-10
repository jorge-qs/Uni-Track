/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'utec-red': '#E63946',
        'utec-blue': '#2563EB',
        'utec-surface': '#FFFFFF',
        'utec-bg': '#FAFAFA',
        'utec-border': '#E5E7EB',
        'utec-muted': '#6B7280',
        'utec-text': '#1F2937',
        'utec-secondary': '#374151',
      },
      fontFamily: {
        display: ['Inter', 'Roboto', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '0.5rem',
        lg: '0.75rem',
      },
    },
  },
  plugins: [],
};
