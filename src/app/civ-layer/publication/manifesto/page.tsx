import type { Metadata } from "next";
import PubManifesto from "./PubManifesto";

export const metadata: Metadata = {
  title: "MyShape Publication — Protocol Doctrine",
  description: "The MyShape doctrine: a human is a sovereign entity whose existence cannot be reduced to information.",
  openGraph: {
    title: "MyShape Publication — Protocol Doctrine",
    description: "The MyShape doctrine: a human is a sovereign entity whose existence cannot be reduced to information.",
    url: "https://www.myshape.com/publication/manifesto",
    siteName: "MyShape Protocol",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MyShape Publication — Protocol Doctrine",
    description: "The MyShape doctrine: a human is a sovereign entity whose existence cannot be reduced to information.",
    images: ["/og-image.png"],
  },
};

export default function Page() { return <PubManifesto />; }
