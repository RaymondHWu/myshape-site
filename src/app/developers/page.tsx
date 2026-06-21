import type { Metadata } from "next";
import DevelopersClient from "./DevelopersClient";

export const metadata: Metadata = {
  title: "MyShape Developers — API Reference",
  description: "Read-only API for querying MyShape Protocol node identity and network statistics.",
  openGraph: {
    title: "MyShape Developers — API Reference",
    description: "Read-only API for querying MyShape Protocol node identity and network statistics.",
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
