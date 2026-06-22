import type { Metadata } from "next";
import ThreatModelClient from "./ThreatModelClient";

export const metadata: Metadata = {
  title: "MyShape Threat Model — Security Analysis",
  description: "8 attack signatures, entropy gap theorem, defense-in-depth architecture. How MyShape resists AI-generated motion, replay, imitation, and sensor attacks.",
  openGraph: {
    title: "MyShape Threat Model — Security Analysis",
    description: "8 attack signatures, entropy gap theorem, defense-in-depth architecture.",
    url: "https://www.myshape.com/papers/threat-model",
    siteName: "MyShape Protocol",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    locale: "en_US",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: "MyShape Threat Model — Security Analysis",
    description: "8 attack signatures, entropy gap theorem, defense-in-depth architecture.",
    images: ["/og-image.png"],
  },
};

export default function Page() {
  return <ThreatModelClient />;
}
