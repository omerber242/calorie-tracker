import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import Navigation from '@/components/Navigation';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'טיול יפן — מעקב הוצאות',
  description: 'מעקב אחרי ההוצאות בטיול ליפן, לפי קטגוריה ותקציב',
};

export const viewport: Viewport = {
  themeColor: '#e11d48',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className={inter.className}>
        <Navigation />
        <div className="pb-20 sm:pb-0">{children}</div>
      </body>
    </html>
  );
}
