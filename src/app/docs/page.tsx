import type { Metadata } from "next";
import DocsClient from "./DocsClient";
import BreadcrumbList from "@/components/seo/BreadcrumbList";
import FaqJsonLd from "@/components/seo/FaqJsonLd";

export const metadata: Metadata = {
  title: "MyShape SDK Documentation — Integrate Motion-Signature Identity",
  description:
    "Complete SDK documentation for the MyShape Protocol. Integrate sovereign identity verification in 5 lines of code. REST API, WASM engine, ZK-Presence proof validation, and protocol node queries.",
  keywords: [
    "MyShape SDK",
    "identity API documentation",
    "motion-signature integration",
    "ZK-presence API",
    "protocol node API",
    "sovereign identity SDK",
    "developer docs",
  ],
  alternates: { canonical: "https://www.myshape.com/docs" },
  openGraph: {
    title: "MyShape SDK Documentation — Integrate Motion-Signature Identity",
    description: "5 lines of code. Zero data stored. Real human presence. Complete SDK reference.",
    url: "https://www.myshape.com/docs",
    siteName: "MyShape Protocol",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MyShape SDK Documentation",
    description: "Integrate sovereign identity verification in 5 lines of code.",
    images: ["/og-image.png"],
  },
};

export default function DocsPage() {
  return (
    <>
      <BreadcrumbList items={[{ name: "Home", href: "/" }, { name: "Documentation" }]} />
      <FaqJsonLd
        mainEntityUrl="https://www.myshape.com/docs"
        questions={[
          { question: "How do I install the MyShape SDK?", answer: "Install via npm: `npm install @myshapeprotocol/sdk`. The SDK targets TypeScript/JavaScript with WASM core. CDN, Python, and Rust bindings are in development." },
          { question: "How does the ZK-Presence proof work?", answer: "The proof (~250 bytes, <10ms verification) asserts three things: (1) PES > threshold — the motion contained biological entropy, (2) the motion was captured within the last 5 seconds, and (3) the entropy characteristics are consistent with a human neuromuscular control loop. Your backend verifies the proof using the published verification key — receiving a binary valid/invalid with zero access to raw motion data." },
          { question: "What are the API rate limits?", answer: "Lookup endpoints: 10 requests/minute. Node creation: 3 requests/hour. OTP operations: 3 send/5min, 5 verify/5min. Motion recording: 3 scans/day. Research upload: 5/day. All limits are per IP." },
        ]}
      />
      <DocsClient />
    </>
  );
}
