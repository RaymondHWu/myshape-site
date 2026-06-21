import type { Metadata } from "next";
import CanonicalLink from "@/components/seo/CanonicalLink";
import PaperCoreProtocolClient from "./PaperCoreProtocolClient";

export const metadata: Metadata = {
  title: "MyShape PAPER_01 — A Geometric Approach to Decoupled Digital Identity",
  description: "Full whitepaper introducing MyShape Protocol, a geometric identity framework derived from biological motion geometry and zero-knowledge proofs.",
  openGraph: {
    title: "MyShape PAPER_01 — A Geometric Approach to Decoupled Digital Identity",
    description: "Full whitepaper introducing MyShape Protocol, a geometric identity framework derived from biological motion geometry and zero-knowledge proofs.",
    url: "https://www.myshape.com/papers/core-protocol",
    siteName: "MyShape Protocol",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MyShape PAPER_01 — A Geometric Approach to Decoupled Digital Identity",
    description: "Full whitepaper introducing MyShape Protocol, a geometric identity framework derived from biological motion geometry and zero-knowledge proofs.",
    images: ["/og-image.png"],
  },
};

export default function PaperCoreProtocolPage() {
  return (
    <>
      <CanonicalLink href="/papers/core-protocol" />
      <PaperCoreProtocolClient />
    </>
  );
}
