"use client";
import "./globals.css";
import React from "react";
import { GeistSans, GeistMono } from "geist/font";
import HeroVisual from "@/components/hero/HeroVisual"; // ⭐ 確保這一行存在

export default function RootLayout({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body
        style={{
          margin: 0,
          padding: 0,
          background: "#02040a",
          overflowX: "hidden",
          width: "100%",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* ⭐ 全站背景視覺組件 */}
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

        {/* ⭐ 頁面內容容器 */}
        <div style={{ position: "relative", zIndex: 1, width: "100%", flex: 1 }}>
          {children}
        </div>

        {/* 這裡不再放 Footer，因為你的 ProtocolLayout 裡面已經有一個了 */}
      </body>
    </html>
  );
}