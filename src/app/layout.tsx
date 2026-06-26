import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Zensho-Algo",
  description: "全商情報処理検定 プログラミング部門 完全攻略アルゴリズム・トレーナー",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1e293b",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-slate-50" style={{ fontFamily: "'BIZ UDPGothic', 'Hiragino Kaku Gothic ProN', sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
