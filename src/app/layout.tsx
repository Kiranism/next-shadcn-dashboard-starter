import type { Metadata } from 'next';
import './globals.css';
import './theme.css';
import { fontGeist, fontInter } from '@/lib/font';
import { cn } from '@/lib/utils';
import { ThemeProvider } from '@/components/layout/ThemeToggle/theme-provider';
import { AuthProvider } from '@/lib/auth/use-auth';
import { Toaster } from '@/components/ui/sonner';
import NextTopLoader from 'nextjs-toploader';

export const metadata: Metadata = {
  title: {
    default: 'AMT Portal - AnalyzeMyTeam Platform',
    template: '%s | AMT Portal',
  },
  description:
    'AnalyzeMyTeam Platform - 12 Modules for Championship Excellence. Triangle Defense methodology with M.E.L. AI coaching intelligence.',
  keywords: [
    'AnalyzeMyTeam',
    'AMT',
    'Triangle Defense',
    'M.E.L. AI',
    'Football Analytics',
    'Coaching Platform',
  ],
  authors: [
    {
      name: 'AnalyzeMyTeam',
      url: 'https://analyzemyteam.com',
    },
  ],
  creator: 'Denauld Brown',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://portal.analyzemyteam.com',
    title: 'AMT Portal - AnalyzeMyTeam Platform',
    description: 'Triangle Defense methodology with M.E.L. AI coaching intelligence',
    siteName: 'AMT Portal',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          'min-h-screen bg-background font-sans antialiased',
          fontInter.variable,
          fontGeist.variable
        )}
      >
        <NextTopLoader
          color="#e2021a"
          height={3}
          showSpinner={false}
        />
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            {children}
            <Toaster richColors position="top-right" />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
