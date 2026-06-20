import type { Metadata } from "next";
import AgentClient from "./AgentClient";

export const metadata: Metadata = {
  title: "MyShape Agent — AI Agent Identity Declaration",
  description:
    "Declare your AI agent identity on the MyShape Protocol. No email, no OTP, no camera — cryptographic declaration for autonomous entities.",
};

export default function AgentPage() {
  return <AgentClient />;
}
