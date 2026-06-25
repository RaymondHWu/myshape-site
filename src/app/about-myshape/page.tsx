import type { Metadata } from "next";
import About from "./AboutClient";

export const metadata: Metadata = {
  title: "About MyShape — The Sovereign 3D Identity Layer for the Decentralized Human",
  description: "MyShape Protocol builds AI-native identity on motion-signature verification and zero-knowledge presence. Non-corporeal data-body architecture for sovereign, cross-platform identity.",
  openGraph: {
    title: "About MyShape — Sovereign Identity for the AI-Native Era",
    description: "Motion-signature verification, zero-knowledge presence, and ethereal data-body architecture for the decentralized human.",
    url: "https://www.myshape.com/about-myshape",
    siteName: "MyShape Protocol",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MyShape — About the Protocol",
    description: "About MyShape Protocol — the sovereign identity layer for the AI-native era.",
    images: ["/og-image.png"],
  },
};

export default function Page() {
  return <About />;
}
