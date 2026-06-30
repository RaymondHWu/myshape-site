import type { Metadata } from "next";
import ContinuityClient from "./ContinuityClient";

export const metadata: Metadata = {
  title: "MyShape — Global Continuity Network",
  description: "The State Chain of Subject Evolution. Live network of verified trajectories, evolutionary entropy, and presence receipts across the protocol.",
  openGraph: {
    title: "MyShape — Global Continuity Network",
    description: "Live network of verified trajectories across the MyShape Protocol. Evolutionary entropy in real-time.",
    url: "https://www.myshape.com/continuity",
    siteName: "MyShape Protocol",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MyShape — Global Continuity Network",
    description: "Live network of verified trajectories across the MyShape Protocol.",
    images: ["/og-image.png"],
  },
};

export default function ContinuityPage() {
  return <ContinuityClient />;
}
