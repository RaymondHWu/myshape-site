import type { Metadata } from "next";
import BlogClient from "./BlogClient";

export const metadata: Metadata = {
  title: "We Built an Engine That Detects AI-Generated Human Motion — MyShape Blog",
  description:
    "GPT-5 and DeepSeek both failed. We built a Rust engine that detects AI-generated human motion. 0.3960 Human—AI gap. Open source CLI demo.",
  openGraph: {
    title: "We Built an Engine That Detects AI-Generated Human Motion",
    description:
      "AI can generate faces, voices, fingerprints. But it cannot generate human motion. Our engine proves it — with a 0.3960 gap.",
    url: "https://www.myshape.com/blog",
    siteName: "MyShape Protocol",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    locale: "en_US",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: "We Built an Engine That Detects AI-Generated Human Motion",
    description: "GPT-5 and DeepSeek both failed. 0.3960 Human—AI gap.",
    images: ["/og-image.png"],
  },
};

export default function BlogPage() {
  return <BlogClient />;
}
