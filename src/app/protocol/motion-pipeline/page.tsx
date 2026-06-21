import type { Metadata } from "next";
import MotionPipeline from "./MotionPipelineClient";

export const metadata: Metadata = {
  title: "MyShape Motion Pipeline — Capture to Proof",
  description: "The motion-to-geometry pipeline: from raw capture to zero-knowledge proof.",
  openGraph: {
    title: "MyShape Motion Pipeline — Capture to Proof",
    description: "The motion-to-geometry pipeline: from raw capture to zero-knowledge proof.",
    url: "https://www.myshape.com/protocol/motion-pipeline",
    siteName: "MyShape Protocol",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MyShape Motion Pipeline — Capture to Proof",
    description: "The motion-to-geometry pipeline: from raw capture to zero-knowledge proof.",
    images: ["/og-image.png"],
  },
};

export default function Page() {
  return <MotionPipeline />;
}
