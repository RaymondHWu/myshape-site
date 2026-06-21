import type { Metadata } from "next";
import CivPublication from "./CivPublicationClient";

export const metadata: Metadata = {
  title: "MyShape Publication — Media & Reports",
  description: "Official MyShape Protocol media channels, press kit, and civilizational reports.",
  openGraph: {
    title: "MyShape Publication — Media & Reports",
    description: "Official MyShape Protocol media channels, press kit, and civilizational reports.",
    url: "https://www.myshape.com/civ-layer/publication",
    siteName: "MyShape Protocol",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MyShape Publication — Media & Reports",
    description: "Official MyShape Protocol media channels, press kit, and civilizational reports.",
    images: ["/og-image.png"],
  },
};

export default function Page() {
  return <CivPublication />;
}
