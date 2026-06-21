import type { Metadata } from "next";
import IdentityLayer from "./IdentityLayerClient";

export const metadata: Metadata = {
  title: "MyShape Identity Layer — Sovereign by Design",
  description: "The MyShape identity layer — local generation, selective expression, zero-knowledge verification.",
  openGraph: {
    title: "MyShape Identity Layer — Sovereign by Design",
    description: "The MyShape identity layer — local generation, selective expression, zero-knowledge verification.",
    url: "https://www.myshape.com/protocol/identity-layer",
    siteName: "MyShape Protocol",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MyShape Identity Layer — Sovereign by Design",
    description: "The MyShape identity layer — local generation, selective expression, zero-knowledge verification.",
    images: ["/og-image.png"],
  },
};

export default function Page() {
  return <IdentityLayer />;
}
