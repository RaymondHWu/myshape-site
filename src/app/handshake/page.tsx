import type { Metadata } from "next";
import HandshakeClient from "./HandshakeClient";

export const metadata: Metadata = {
  title: "Node Handshake — MyShape Protocol",
  description:
    "Initialize your sovereign protocol node. Generate your node_token and node_handle through the MyShape Protocol handshake ritual. AI-native identity, zero-knowledge presence, motion-signature verification.",
  openGraph: {
    title: "Node Handshake — MyShape Protocol",
    description:
      "Initialize your sovereign protocol node. AI-native identity layer for the decentralized human.",
    images: ["/og-image.png"],
  },
};

export default function HandshakePage() {
  return <HandshakeClient />;
}
