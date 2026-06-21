import type { Metadata } from "next";
import PipelineDocs from "./PipelineDocsClient";

export const metadata: Metadata = {
  title: "MyShape Pipeline — Technical Specification",
  description: "Technical specification for the MyShape motion pipeline and geometry engine.",
  openGraph: {
    title: "MyShape Pipeline — Technical Specification",
    description: "Technical specification for the MyShape motion pipeline and geometry engine.",
    url: "https://www.myshape.com/protocol/motion-pipeline/documentation",
    siteName: "MyShape Protocol",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MyShape Pipeline — Technical Specification",
    description: "Technical specification for the MyShape motion pipeline and geometry engine.",
    images: ["/og-image.png"],
  },
};

export default function Page() {
  return <PipelineDocs />;
}
