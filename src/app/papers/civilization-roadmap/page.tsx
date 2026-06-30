import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "MyShape PAPER_10 — Civilization Roadmap",
  description: "Four-epoch, 20-year roadmap from geometry to civilization. The long-term vision for a world where human and AI identities coexist in one verifiable protocol.",
  openGraph: {
    title: "MyShape PAPER_10 — Civilization Roadmap",
    description: "Four-epoch, 20-year roadmap from geometry to civilization. The long-term vision for a world where human and AI identities coexist in one verifiable protocol.",
    url: "https://www.myshape.com/papers/civilization-roadmap",
    siteName: "MyShape Protocol",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    locale: "en_US",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: "MyShape PAPER_10 — Civilization Roadmap",
    description: "Four-epoch, 20-year roadmap from geometry to civilization. The long-term vision for a world where human and AI identities coexist in one verifiable protocol.",
    images: ["/og-image.png"],
  },
};

export default function Page() { redirect("/civ-layer/papers/civilization-roadmap"); }
