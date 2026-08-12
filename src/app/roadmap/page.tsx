import type { Metadata } from "next";
import RoadmapClient from "./RoadmapClient";

export const metadata: Metadata = {
  title: "MyShape Roadmap — Protocol Evolution Timeline",
  description: "The three-phase development roadmap for the open continuity protocol.",
  openGraph: {
    title: "MyShape Roadmap — Protocol Evolution Timeline",
    description: "The three-phase development roadmap for the open continuity protocol.",
    url: "https://www.myshape.com/roadmap",
    siteName: "MyShape Protocol",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MyShape Roadmap — Protocol Evolution Timeline",
    description: "The three-phase development roadmap for the open continuity protocol.",
    images: ["/og-image.png"],
  },
};

export default function RoadmapPage() {
  return <RoadmapClient />;
}
