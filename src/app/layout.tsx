import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { StudentProvider } from "@/components/layout/StudentContext";
import BottomNav from "@/components/layout/BottomNav";
import Header from "@/components/layout/Header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "학습관리 - Study Tracker",
  description: "쌍둥이 자녀의 학습 기록을 관리하는 웹앱",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "학습관리",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#3b82f6",
};

export const dynamic = 'force-dynamic';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <StudentProvider>
          <div className="min-h-screen pb-20 md:pb-0">
            <Header />
            <main className="container mx-auto px-4 py-4 max-w-4xl">
              {children}
            </main>
            <BottomNav />
          </div>
        </StudentProvider>
      </body>
    </html>
  );
}
