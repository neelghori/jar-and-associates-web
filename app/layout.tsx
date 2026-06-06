import type { Metadata } from 'next';
import { Nunito, Plus_Jakarta_Sans } from 'next/font/google';
import { AuthProvider } from '@/lib/auth-context';
import './globals.css';

const jakarta = Plus_Jakarta_Sans({
  variable: '--font-jakarta',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

const nunito = Nunito({
  variable: '--font-nunito',
  subsets: ['latin'],
  weight: ['600', '700', '800'],
});

export const metadata: Metadata = {
  title: 'jar | Billing Suite',
  description: 'Modern billing and office management for chartered accountants',
  icons: {
    icon: [
      { url: '/jar-icon.png', type: 'image/png' },
      { url: '/favicon-16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
    shortcut: '/favicon.png',
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${jakarta.variable} ${nunito.variable} h-full antialiased`}>
      <body className="min-h-full bg-background text-foreground">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
