import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "MyShape PAPER_06 — Protocol Architecture",
  description: "Five-layer protocol architecture from on-device capture to sovereign identity mesh. Design principles, modular structure, and the protocol lifecycle.",
  openGraph: {
    title: "MyShape PAPER_06 — Protocol Architecture",
    description: "Five-layer protocol architecture from on-device capture to sovereign identity mesh. Design principles, modular structure, and the protocol lifecycle.",
    url: "https://www.myshape.com/papers/protocol-architecture",
    siteName: "MyShape Protocol",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    locale: "en_US",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: "MyShape PAPER_06 — Protocol Architecture",
    description: "Five-layer protocol architecture from on-device capture to sovereign identity mesh. Design principles, modular structure, and the protocol lifecycle.",
    images: ["/og-image.png"],
  },
};

export default function Page() { redirect("/civ-layer/papers/protocol-architecture"); }
