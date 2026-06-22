import type { Metadata } from "next";
import PapersClient from "./PapersHubClient";

export const metadata: Metadata = {
  title: "MyShape Papers — Technical Documentation",
  description: "Technical specification, threat model, protocol architecture, and research papers from the MyShape Protocol.",
  openGraph: {
    title: "MyShape Papers — Technical Documentation",
    description: "Technical specification, threat model, protocol architecture, and research papers.",
    url: "https://www.myshape.com/papers",
    siteName: "MyShape Protocol",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MyShape Papers — Technical Documentation",
    description: "Technical specification, threat model, protocol architecture, and research papers.",
    images: ["/og-image.png"],
  },
};

export default function Page() {
  return <PapersClient />;
}
