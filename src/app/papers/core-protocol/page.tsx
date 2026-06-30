import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "MyShape PAPER_01 — A Geometric Approach to Decoupled Digital Identity",
  description: "The foundational whitepaper introducing motion-geometry identity framework, ZK verification architecture, and the six-stage motion-to-proof pipeline.",
  openGraph: {
    title: "MyShape PAPER_01 — A Geometric Approach to Decoupled Digital Identity",
    description: "The foundational whitepaper introducing motion-geometry identity framework, ZK verification architecture, and the six-stage motion-to-proof pipeline.",
    url: "https://www.myshape.com/papers/core-protocol",
    siteName: "MyShape Protocol",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    locale: "en_US",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: "MyShape PAPER_01 — A Geometric Approach to Decoupled Digital Identity",
    description: "The foundational whitepaper introducing motion-geometry identity framework, ZK verification architecture, and the six-stage motion-to-proof pipeline.",
    images: ["/og-image.png"],
  },
};

export default function Page() { redirect("/civ-layer/papers/core-protocol"); }
