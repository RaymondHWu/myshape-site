import type { Metadata } from "next";
import GenesisManifesto from "./GenesisManifesto";

export const metadata: Metadata = {
  title: "MyShape Genesis Manifesto — Data Sequence",
  description: "The Genesis Manifesto: identity as a local construct, the boundary of the data-body, proof without exposure.",
  openGraph: {
    title: "MyShape Genesis Manifesto — Data Sequence",
    description: "The Genesis Manifesto: identity as a local construct, the boundary of the data-body, proof without exposure.",
    url: "https://www.myshape.com/genesis/manifesto",
    siteName: "MyShape Protocol",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MyShape Genesis Manifesto — Data Sequence",
    description: "The Genesis Manifesto: identity as a local construct, the boundary of the data-body, proof without exposure.",
    images: ["/og-image.png"],
  },
};

export default function Page() { return <GenesisManifesto />; }
