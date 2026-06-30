import type { Metadata } from "next";
import CohortClient from "./CohortClient";

export const metadata: Metadata = {
  title: "MyShape Genesis Cohort — The First 100",
  description: "Join the inaugural group of sovereign identity nodes. Genesis Cohort founding entities form the cryptographic trust anchor of the MyShape Protocol — permanent tier, never offered again.",
  openGraph: {
    title: "MyShape Genesis Cohort — The First 100",
    description: "Founding entities of the sovereign identity layer. Permanent tier. Never offered again.",
    url: "https://www.myshape.com/genesis/cohort",
    siteName: "MyShape Protocol",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MyShape Genesis Cohort — The First 100",
    description: "Founding entities of the sovereign identity layer. Permanent tier. Never offered again.",
    images: ["/og-image.png"],
  },
};

export default function CohortPage() {
  return <CohortClient />;
}
