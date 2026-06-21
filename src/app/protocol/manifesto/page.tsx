import type { Metadata } from "next";
import ProtocolManifesto from "./ProtocolManifestoClient";

export const metadata: Metadata = {
  title: "MyShape Protocol Manifesto — The Human Stance",
  description: "The MyShape Protocol manifesto — identity as a local construct, proof without exposure.",
  openGraph: {
    title: "MyShape Protocol Manifesto — The Human Stance",
    description: "The MyShape Protocol manifesto — identity as a local construct, proof without exposure.",
    url: "https://www.myshape.com/protocol/manifesto",
    siteName: "MyShape Protocol",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MyShape Protocol Manifesto — The Human Stance",
    description: "The MyShape Protocol manifesto — identity as a local construct, proof without exposure.",
    images: ["/og-image.png"],
  },
};

export default function Page() {
  return <ProtocolManifesto />;
}
