import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			screens: {
				'xs': '475px',
			},
			fontFamily: {
				'inter': ['Inter', 'sans-serif'],
				'sans': ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
				'display': ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
				'mono': ['"JetBrains Mono"', 'monospace'],
			},
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				},
				construction: {
					orange: 'hsl(var(--construction-orange))',
					'orange-light': 'hsl(var(--construction-orange-light))',
					green: 'hsl(var(--construction-green))',
					'green-light': 'hsl(var(--construction-green-light))',
					blue: 'hsl(var(--construction-blue))',
					'blue-light': 'hsl(var(--construction-blue-light))'
				},
				brand: {
					orange: '#F97316',
					'orange-hover': '#EA580C',
					'orange-light': '#FDBA74',
					'orange-ghost': '#FFF7ED',
					emerald: '#059669',
					'emerald-light': '#ECFDF5',
					blue: '#1e3a5f',
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: { height: '0' },
					to: { height: 'var(--radix-accordion-content-height)' }
				},
				'accordion-up': {
					from: { height: 'var(--radix-accordion-content-height)' },
					to: { height: '0' }
				},
				'fade-in': {
					'0%': { opacity: '0', transform: 'translateY(10px)' },
					'100%': { opacity: '1', transform: 'translateY(0)' }
				},
				'slide-in-right': {
					'0%': { transform: 'translateX(100%)' },
					'100%': { transform: 'translateX(0)' }
				},
				'fadeSlideIn': {
					'0%': { opacity: '0', filter: 'blur(6px)', transform: 'translateY(20px)' },
					'100%': { opacity: '1', filter: 'blur(0px)', transform: 'translateY(0px)' }
				},
				'slideRightIn': {
					'0%': { opacity: '0', filter: 'blur(6px)', transform: 'translateX(20px)' },
					'100%': { opacity: '1', filter: 'blur(0px)', transform: 'translateX(0px)' }
				},
				'testimonialIn': {
					'0%': { opacity: '0', filter: 'blur(6px)', transform: 'translateY(20px) scale(0.95)' },
					'100%': { opacity: '1', filter: 'blur(0px)', transform: 'translateY(0px) scale(1)' }
				},
				// Premium animations
				'reveal-up': {
					'0%': { opacity: '0', transform: 'translateY(40px)', filter: 'blur(4px)' },
					'100%': { opacity: '1', transform: 'translateY(0)', filter: 'blur(0)' },
				},
				'reveal-scale': {
					'0%': { opacity: '0', transform: 'scale(0.92)', filter: 'blur(4px)' },
					'100%': { opacity: '1', transform: 'scale(1)', filter: 'blur(0)' },
				},
				'shimmer': {
					'0%': { backgroundPosition: '-200% 0' },
					'100%': { backgroundPosition: '200% 0' },
				},
				'float': {
					'0%, 100%': { transform: 'translateY(0px)' },
					'50%': { transform: 'translateY(-10px)' },
				},
				'glow-pulse': {
					'0%, 100%': { boxShadow: '0 0 20px rgba(249, 115, 22, 0.15)' },
					'50%': { boxShadow: '0 0 40px rgba(249, 115, 22, 0.3)' },
				},
				'spotlight': {
					'0%': { opacity: '0', transform: 'translate(-72%, -62%) scale(0.5)' },
					'100%': { opacity: '1', transform: 'translate(-50%, -40%) scale(1)' },
				},
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'fade-in': 'fade-in 0.3s ease-out',
				'slide-in-right': 'slide-in-right 0.3s ease-out',
				'fadeSlideIn': 'fadeSlideIn 0.5s ease-out',
				'slideRightIn': 'slideRightIn 0.5s ease-out',
				'testimonialIn': 'testimonialIn 0.5s ease-out',
				'reveal-up': 'reveal-up 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
				'reveal-scale': 'reveal-scale 0.7s cubic-bezier(0.16, 1, 0.3, 1)',
				'shimmer': 'shimmer 2s linear infinite',
				'float': 'float 6s ease-in-out infinite',
				'glow-pulse': 'glow-pulse 3s ease-in-out infinite',
				'spotlight': 'spotlight 2s ease .75s 1 forwards',
			},
			backgroundImage: {
				'hero-gradient': 'linear-gradient(135deg, #FFF7ED 0%, #F9731620 30%, #FAFAFA 60%, #05966910 100%)',
				'hero-radial': 'radial-gradient(circle at 80% 20%, rgba(249, 115, 22, 0.08) 0%, transparent 50%)',
				'shimmer-gradient': 'linear-gradient(90deg, transparent 0%, rgba(249, 115, 22, 0.08) 50%, transparent 100%)',
			},
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
