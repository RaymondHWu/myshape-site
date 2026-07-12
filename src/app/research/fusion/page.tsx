import type { Metadata } from "next";
import FusionClient from "./FusionClient";

export const metadata: Metadata = {
  title: "Fusion Verification — MyShape Protocol",
  description:
    "Dual-channel identity verification: camera (MediaPipe pose) + IMU (accelerometer/gyroscope). One motion, two independent proofs.",
};

export default function FusionPage() {
  return <FusionClient />;
}
