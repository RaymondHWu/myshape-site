import type { Metadata } from "next";
import CanonicalLink from "@/components/seo/CanonicalLink";
import Client from "./Client";
export const metadata: Metadata = {
  title: "MyShape PAPER_10 — Civilization Roadmap",
  description: "The four-epoch civilization roadmap for the MyShape Protocol — from genesis to full protocol adoption.",
  openGraph: {
    title: "MyShape PAPER_10 — Civilization Roadmap",
    description: "The four-epoch civilization roadmap for the MyShape Protocol — from genesis to full protocol adoption.",
    url: "https://www.myshape.com/papers/civilization-roadmap",
    siteName: "MyShape Protocol",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MyShape PAPER_10 — Civilization Roadmap",
    description: "The four-epoch civilization roadmap for the MyShape Protocol — from genesis to full protocol adoption.",
    images: ["/og-image.png"],
  },
};
export default function Page() {
  return (
    <>
      <CanonicalLink href="/papers/civilization-roadmap" />
      <Client />
    </>
  );
}
