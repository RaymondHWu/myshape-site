import type { Metadata } from "next";
import EvidenceClient from "./EvidenceClient";

export const metadata: Metadata = {
  title: "MyShape Evidence — Verifiable Protocol Proofs",
  description: "Empirical evidence for the MyShape Protocol: PES benchmarks, attack model verification, identity vector examples, and live verification results.",
  openGraph: {
    title: "MyShape Evidence — Verifiable Protocol Proofs",
    description: "Empirical evidence: PES benchmarks, attack model, identity vectors, and live verification results.",
    url: "https://www.myshape.com/evidence",
    siteName: "MyShape Protocol",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    locale: "en_US",
    type: "website",
  },
};

export default function EvidencePage() {
  return <EvidenceClient />;
}
