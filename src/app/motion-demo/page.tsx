import type { Metadata } from "next";
import MotionDemoClient from "./MotionDemoClient";

export const metadata: Metadata = {
  title: "MyShape Motion Demo — Live Motion-Signature Verification",
  description:
    "Real-time Presence Entropy Score engine via webcam. Watch your motion become a cryptographic identity — AI cannot forge the human kinetic signature. Motion Vector → SST 18-pt → 4D Entropy → ZK-Presence Proof.",
  openGraph: {
    title: "MyShape Motion Demo — Live Motion-Signature Verification",
    description: "Watch your motion become a cryptographic identity. Real-time PES engine — AI cannot forge human kinetics.",
    url: "https://www.myshape.com/motion-demo",
    siteName: "MyShape Protocol",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MyShape Motion Demo — Live Presence Entropy Score",
    description: "Real-time PES engine via webcam. Firefox recommended.",
    images: ["/og-image.png"],
  },
};

export default function MotionDemoPage() {
  return <MotionDemoClient />;
}
