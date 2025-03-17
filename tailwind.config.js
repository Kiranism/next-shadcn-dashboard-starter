/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './constants/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
    './sections/**/*.{ts,tsx}'
  ],
  theme: {
    container: {
      center: 'true',
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
        red: {
          50: '#ffe6e6',
          100: '#ffb0b0',
          200: '#ff8a8a',
          300: '#ff5454',
          400: '#ff3333',
          500: '#ff0000',
          600: '#e80000',
          700: '#b50000',
          800: '#8c0000',
          900: '#6b0000'
        },
        yellow: {
          50: '#fff8e6',
          100: '#ffeab0',
          200: '#ffe08a',
          300: '#ffd154',
          400: '#ffc933',
          500: '#ffbb00',
          600: '#e8aa00',
          700: '#b58500',
          800: '#8c6700',
          900: '#6b4f00'
        },
        green: {
          50: '#e7f4e8',
          100: '#b3deb6',
          200: '#8fcd93',
          300: '#5cb762',
          400: '#3ca943',
          500: '#0b9314',
          600: '#0a8612',
          700: '#08680e',
          800: '#06510b',
          900: '#053e08'
        },
        orange: {
          550: '#f05b22'
        },
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
        'color-1': 'hsl(var(--color-1))',
        'color-2': 'hsl(var(--color-2))',
        'color-3': 'hsl(var(--color-3))',
        'color-4': 'hsl(var(--color-4))',
        'color-5': 'hsl(var(--color-5))'
      },
      fontSize: {
        // Header Typography Styles
        h1: ['2.5rem', '3.25rem'],
        h2: ['2.25rem', '2.75rem'],
        h3: ['2rem', '2.5rem'],
        h4: ['1.75rem', '2.25rem'],
        h5: ['1.5rem', '2rem'],
        h6: ['1.25rem', '1.75rem'],

        // Display Typography Styles
        'display-lg': ['6rem', '7rem'],
        display: ['3.25rem', '4rem'],
        'display-sm': ['2.75rem', '3.25rem'],
        'display-xs': ['2.25rem', '2.75rem']
      },
      height: {
        13: '3.125rem'
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
        rainbow: {
          '0%': {
            'background-position': '0%'
          },
          '100%': {
            'background-position': '200%'
          }
        }
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        rainbow: 'rainbow var(--speed, 2s) infinite linear'
      }
    }
  },
  plugins: [require('tailwindcss-animate')]
};
