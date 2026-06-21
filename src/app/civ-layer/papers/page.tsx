import type { Metadata } from "next";
import CivPapers from "./CivPapersClient";

export const metadata: Metadata = {
  title: "MyShape Papers — Technical Research",
  description: "Academic research papers on motion-geometry identity and ZK verification.",
  openGraph: {
    title: "MyShape Papers — Technical Research",
    description: "Academic research papers on motion-geometry identity and ZK verification.",
    url: "https://www.myshape.com/civ-layer/papers",
    siteName: "MyShape Protocol",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MyShape Papers — Technical Research",
    description: "Academic research papers on motion-geometry identity and ZK verification.",
    images: ["/og-image.png"],
  },
};

export default function Page() {
  return <CivPapers />;
}
