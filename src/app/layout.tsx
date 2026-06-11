
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { TailwindIndicator } from '@/components/dev/tailwind-indicator'; // Optional: for development
import { ThemeProvider } from '@/components/theme-provider';
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'Facility Operation Center',
  description: 'Centralized Operations Management for Facilities',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable}`} suppressHydrationWarning>
      <Analytics/>
      <SpeedInsights/>
      <body className="font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
          <TailwindIndicator /> {/* Optional: for development */}
        </ThemeProvider>
      </body>
    </html>
  );
}
