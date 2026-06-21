import type { Metadata } from "next";
import About from "./AboutClient";

export const metadata: Metadata = {
  title: "MyShape — About the Protocol",
  description: "About MyShape Protocol — the sovereign identity layer for the AI-native era.",
  openGraph: {
    title: "MyShape — About the Protocol",
    description: "About MyShape Protocol — the sovereign identity layer for the AI-native era.",
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
