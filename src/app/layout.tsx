import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SessionProvider from "@/components/SessionProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "KuroFeed - RSSフィードアグリゲーター",
  description: "お気に入りのRSSフィードを一箇所で管理するアプリ",
  themeColor: "#FACC15",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "KuroFeed",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        {/* CSS読み込み前から強制的にダークモードを適用 */}
        <meta name="color-scheme" content="dark" />
        <style>{`html,body{background-color:#030712!important;color:#f9fafb!important;color-scheme:dark}`}</style>
      </head>
      <body className="min-h-full flex flex-col bg-gray-950 text-gray-100">
        <script dangerouslySetInnerHTML={{ __html: `(function(){if(sessionStorage.getItem('kf_login_pending')){document.documentElement.style.visibility='hidden';}})();` }} />
        <script
          dangerouslySetInnerHTML={{
            __html: `if('serviceWorker' in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('/sw.js')})}`,
          }}
        />
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
