
import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./src/app/**/*.{ts,tsx}",
		"./src/components/**/*.{ts,tsx}",
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
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))',
					50:  '#EEF2FA',
					100: '#D5DCEE',
					200: '#ABBADD',
					300: '#7E94C7',
					400: '#4F6FA8',
					500: '#2E4F89',
					600: '#1A3870',
					700: '#0A2558',
					800: '#071A40',
					900: '#04112A'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				success: {
					DEFAULT: '#006847',
					foreground: '#FFFFFF',
					50:  '#E6F3ED',
					100: '#C1E2D1',
					200: '#8ACAAE',
					300: '#4FB087',
					400: '#1F9563',
					500: '#007D54',
					600: '#006847',
					700: '#00543A',
					800: '#003F2B',
					900: '#002A1D'
				},
				danger: {
					DEFAULT: '#CE1126',
					foreground: '#FFFFFF',
					50:  '#FDECEE',
					100: '#F9C5CB',
					200: '#F28994',
					300: '#E94D5D',
					400: '#D9253A',
					500: '#CE1126',
					600: '#B00E20',
					700: '#8B0B1A',
					800: '#660814',
					900: '#41050D'
				},
				warning: {
					DEFAULT: '#C9A227',
					foreground: '#1A1A1A',
					50:  '#FBF6E5',
					100: '#F5E8B2',
					200: '#EDD57A',
					300: '#E1C04A',
					400: '#D4B032',
					500: '#C9A227',
					600: '#A48520',
					700: '#7F6719',
					800: '#594812',
					900: '#332A0A'
				},
				info: {
					DEFAULT: '#2A7DB0',
					foreground: '#FFFFFF',
					50:  '#E7F1F8',
					100: '#C2DCEC',
					200: '#8DBDDA',
					300: '#5B9FC6',
					400: '#3B8CB9',
					500: '#2A7DB0',
					600: '#226694',
					700: '#1A5078',
					800: '#133A5C',
					900: '#0B2440'
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
				// Legacy aliases remapped to the new CAHUSAMEX brand palette.
				// `teal` → logo water blue (info), `navy` → logo USA navy (primary).
				// `sand` stays as the cream neutral that pairs with the gold/warning accent.
				teal: {
					light: '#5B9FC6',
					DEFAULT: '#2A7DB0',
					dark: '#1A5078'
				},
				navy: {
					light: '#1A3870',
					DEFAULT: '#0A2558',
					dark: '#071A40'
				},
				sand: {
					light: '#F5F0E6',
					DEFAULT: '#E8DFC9',
					dark: '#D0C7B1'
				},
				gold: {
					light: '#E1C04A',
					DEFAULT: '#C9A227',
					dark: '#7F6719'
				},
				// Universidad Anáhuac orange — co-branded landing (/anahuac) only.
				anahuac: {
					DEFAULT: '#F26C0F',
					foreground: '#FFFFFF',
					50:  '#FFF4EA',
					100: '#FFE2C8',
					200: '#FDC48E',
					300: '#FBA657',
					400: '#F98A2E',
					500: '#F26C0F',
					600: '#D75908',
					700: '#AC4606',
					800: '#7E3305',
					900: '#4F2003'
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
				'fade-in': {
					'0%': { opacity: '0' },
					'100%': { opacity: '1' }
				},
				'slide-up': {
					'0%': { transform: 'translateY(10px)', opacity: '0' },
					'100%': { transform: 'translateY(0)', opacity: '1' }
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'fade-in': 'fade-in 0.5s ease-out forwards',
				'slide-up': 'slide-up 0.5s ease-out forwards'
			},
			fontFamily: {
				sans: ['var(--font-inter)', 'Inter', 'sans-serif'],
				heading: ['var(--font-poppins)', 'Poppins', 'sans-serif']
			},
			backgroundImage: {
				'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
				'hero-pattern': 'linear-gradient(rgba(10, 37, 88, 0.85), rgba(10, 37, 88, 0.85)), url("/public/uploads/27c70ccd-6775-4d50-84e2-e2cd60f72589.png")'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
