import type { Metadata } from "next";
import TechSpecClient from "./TechSpecClient";

export const metadata: Metadata = {
  title: "MyShape Technical Specification v1 — Protocol Reference",
  description: "Motion Vector format, PES engine, proof system, SST topology, and reference implementation. The engineering document behind the MyShape Protocol.",
  openGraph: {
    title: "MyShape Technical Specification v1",
    description: "Motion Vector format, PES engine, proof system, SST topology, and reference implementation.",
    url: "https://www.myshape.com/papers/technical-spec",
    siteName: "MyShape Protocol",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    locale: "en_US",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: "MyShape Technical Specification v1",
    description: "Motion Vector format, PES engine, proof system, SST topology, and reference implementation.",
    images: ["/og-image.png"],
  },
};

export default function Page() {
  return <TechSpecClient />;
}
