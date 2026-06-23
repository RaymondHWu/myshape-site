import type { Metadata } from "next";
import WhitepaperClient from "./WhitepaperClient";

export const metadata: Metadata = {
  title: "MyShape Whitepaper — Why AI Cannot Forge the Human Kinetic Signature",
  description:
    "Technical whitepaper explaining why DeepSeek, GPT-5, and multimodal motion AI cannot forge the human kinetic signature. Physics, information theory, and the irreducible entropy of biological control systems.",
  openGraph: {
    title: "MyShape Whitepaper — Why AI Cannot Forge Human Motion",
    description:
      "The physics of unforgeability: how MyShape detects AI-generated motion through jerk spectrum analysis, physiological tremor detection, and Hurst exponent anomaly detection.",
    url: "https://www.myshape.com/whitepaper",
    siteName: "MyShape Protocol",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    locale: "en_US",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: "MyShape Whitepaper — Why AI Cannot Forge Human Motion",
    description:
      "The physics of unforgeability: how MyShape detects AI-generated motion.",
    images: ["/og-image.png"],
  },
};

export default function WhitepaperPage() {
  return <WhitepaperClient />;
}
