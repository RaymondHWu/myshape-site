import type { Metadata } from "next";
import DashboardClient from "./DashboardClient";

export const metadata: Metadata = {
  title: "MyShape — Evolutionary Dashboard",
  description: "Your personal evolutionary trajectory. Track Presence Receipts, continuity sessions, entropy score, and your Genesis identity number.",
  openGraph: {
    title: "MyShape — Evolutionary Dashboard",
    description: "Your personal evolutionary trajectory — verified continuity across time.",
    url: "https://www.myshape.com/dashboard",
    siteName: "MyShape Protocol",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MyShape — Evolutionary Dashboard",
    description: "Your personal evolutionary trajectory — verified continuity across time.",
    images: ["/og-image.png"],
  },
};

export default function DashboardPage() {
  return <DashboardClient />;
}
