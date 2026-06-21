import type { Metadata } from "next";
import VisionManifesto from "./VisionManifesto";

export const metadata: Metadata = {
  title: "MyShape Vision Manifesto — Strategy Perspectives",
  description: "The MyShape vision: distributed intelligence, platform collapse, and the rise of sovereign identity.",
  openGraph: {
    title: "MyShape Vision Manifesto — Strategy Perspectives",
    description: "The MyShape vision: distributed intelligence, platform collapse, and the rise of sovereign identity.",
    url: "https://www.myshape.com/vision/manifesto",
    siteName: "MyShape Protocol",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MyShape Vision Manifesto — Strategy Perspectives",
    description: "The MyShape vision: distributed intelligence, platform collapse, and the rise of sovereign identity.",
    images: ["/og-image.png"],
  },
};

export default function Page() { return <VisionManifesto />; }
