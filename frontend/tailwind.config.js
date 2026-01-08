/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                background: '#0B0F19',
                surface: '#121826',
                primary: '#3B82F6',
                secondary: '#64748B',
                accent: '#8B5CF6',
                'accent-glow': '#4F46E5',
                text: {
                    primary: '#F8FAFC',
                    secondary: '#94A3B8',
                    muted: '#64748B',
                },
                brand: {
                    blue: '#22D3EE',
                    purple: '#A855F7',
                    dark: '#020617',
                }
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
                mono: ['Fira Code', 'monospace'],
            },
            backgroundImage: {
                'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
                'hero-gradient': 'linear-gradient(to bottom, #020617, #0B0F19)',
            }
        },
    },
    plugins: [],
}
