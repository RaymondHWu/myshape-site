import type { Metadata } from "next";
import DevelopersClient from "./DevelopersClient";

export const metadata: Metadata = {
  title: "MyShape Developers — Build with Motion-Signature Identity",
  description: "Integrate sovereign identity verification into any application. Five lines of code. Zero data stored. Real human presence — AI-native identity protocol SDK and API reference.",
  openGraph: {
    title: "MyShape Developers — Build with Motion-Signature Identity",
    description: "Integrate sovereign identity verification. Five lines of code. Zero data stored. Real human presence.",
    url: "https://www.myshape.com/developers",
    siteName: "MyShape Protocol",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MyShape Developers — API Reference",
    description: "Read-only API for querying MyShape Protocol node identity and network statistics.",
    images: ["/og-image.png"],
  },
};

export default function DevelopersPage() {
  return <DevelopersClient />;
}
