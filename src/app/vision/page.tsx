import type { Metadata } from "next";
import VisionClient from "./VisionClient";

export const metadata: Metadata = {
  title: "Vision — MyShape Protocol",
  description: "MyShape defines a new primitive: verifiable digital continuity. When AI can generate your face, voice, and behavior — what proves that you continue to be you?",
  alternates: { canonical: "https://www.myshape.com/vision" },
  openGraph: {
    title: "Vision — MyShape Protocol",
    description: "Verifiable digital continuity. Motion-signature verification, zero-knowledge presence, and sovereign data-body architecture for the Agent Economy.",
    url: "https://www.myshape.com/vision",
    siteName: "MyShape Protocol",
    type: "website",
  },
  twitter: { card: "summary_large_image", title: "MyShape Protocol — Vision", description: "Verifiable digital continuity for the Simulation Age.", images: ["/og-image.png"] },
};

export default function VisionPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org", "@type": "WebPage",
        "@id": "https://www.myshape.com/vision/#webpage",
        url: "https://www.myshape.com/vision",
        name: "Vision — MyShape Protocol",
        description: "Verifiable digital continuity. Motion-signature verification, zero-knowledge presence, and sovereign data-body architecture for the Agent Economy.",
        isPartOf: { "@type": "WebSite", "@id": "https://www.myshape.com/#website", name: "MyShape Protocol", url: "https://www.myshape.com" },
      }) }} />
      <VisionClient />
    </>
  );
}
