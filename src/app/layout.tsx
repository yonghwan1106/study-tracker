import type { Metadata, Viewport } from "next";
import { Gowun_Dodum } from "next/font/google";
import "./globals.css";
import { StudentProvider } from "@/components/layout/StudentContext";
import BottomNav from "@/components/layout/BottomNav";
import Header from "@/components/layout/Header";

const gowunDodum = Gowun_Dodum({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-gowun",
  display: "swap",
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
  themeColor: "#f97066",
};

export const dynamic = 'force-dynamic';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${gowunDodum.variable} antialiased`}>
        <StudentProvider>
          <div className="relative min-h-screen pb-24 md:pb-0 z-10">
            <Header />
            <main className="container mx-auto px-4 py-6 max-w-2xl">
              {children}
            </main>
            <BottomNav />
          </div>
        </StudentProvider>
      </body>
    </html>
  );
}
