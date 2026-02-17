import "./globals.css";
import { GeistSans, GeistMono } from "geist/font";
import HeroVisual from "@/components/hero/HeroVisual";

export const metadata = {
  title: "MyShape Protocol",
  description: "Identity as motion.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body
        style={{
          margin: 0,
          padding: 0,
          overflowX: "hidden",
        }}
      >
        {/* ⭐ 全站星空背景 */}
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: -1,
            pointerEvents: "none",
          }}
        >
          <HeroVisual showCore={false} />
        </div>

        {/* ⭐ 页面内容 */}
        <div style={{ position: "relative", zIndex: 1 }}>
          {children}
        </div>
      </body>
    </html>
  );
}
