"use client";
import React from "react";
import ProtocolHeader from "@/components/header/header";
import BackgroundParticles from "@/components/particles/BackgroundParticles";
import ProtocolFooter from "@/components/footer/footer";

const endpoints = [
  {
    method: "GET",
    path: "/api/identity?email=user@example.com",
    desc: "Look up a node by email. Returns status, handle, and registration timestamp.",
    response: `{
  "found": true,
  "email": "user@example.com",
  "node_handle": null,
  "status": "GENESIS_NODE",
  "registered_at": "2026-03-24T09:12:01.329Z"
}`,
  },
  {
    method: "GET",
    path: "/api/nodes/count",
    desc: "Returns total protocol node counts, broken down by type.",
    response: `{
  "total": 13,
  "humans": 3,
  "agents": 2,
  "genesis_nodes": 1
}`,
  },
];

const statuses = [
  { value: "GENESIS_NODE", desc: "Founding identity — first 100 registrants. Permanent tier." },
  { value: "ACTIVE", desc: "Verified human identity via Genesis OTP." },
  { value: "AGENT_ACTIVE", desc: "AI agent declared via cryptographic attestation." },
  { value: "SUBSCRIBED", desc: "Email subscribed via footer form." },
  { value: "PENDING_VERIFICATION", desc: "OTP sent, awaiting verification." },
];

export default function DevelopersClient() {
  return (
    <div className="min-h-screen bg-[#02040a] text-[#f8feff] font-mono selection:bg-cyan-500/30">
      <ProtocolHeader />
      <BackgroundParticles />

      <div className="relative z-10 max-w-4xl mx-auto px-6 pt-28 pb-16">
        <div className="space-y-4 mb-14">
          <div className="text-cyan-500/50 text-[10px] tracking-[0.5em] uppercase">DEVELOPER_REFERENCE // V0.1</div>
          <h1 className="text-3xl md:text-4xl font-light tracking-[0.15em] text-white uppercase">Protocol API</h1>
          <p className="text-white/40 text-[12px] leading-relaxed max-w-xl">
            Read-only endpoints for querying the MyShape identity mesh. All endpoints
            are public. No authentication required. Rate limiting will be added in a
            future version.
          </p>
        </div>

        {/* Endpoints */}
        <div className="space-y-10 mb-16">
          <h2 className="text-white/20 text-[9px] tracking-[0.6em] uppercase">// ENDPOINTS</h2>
          {endpoints.map((ep) => (
            <div key={ep.path} className="border border-white/10 bg-black/40 overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-3 border-b border-white/5 bg-white/[0.02]">
                <span className="text-cyan-400/70 text-[10px] tracking-[0.2em] font-bold">{ep.method}</span>
                <span className="text-white/60 text-[12px] tracking-[0.1em] font-mono">{ep.path}</span>
              </div>
              <div className="p-5 space-y-4">
                <p className="text-white/35 text-[11px] leading-relaxed">{ep.desc}</p>
                <pre className="bg-black/60 p-4 text-[11px] text-white/40 leading-relaxed overflow-x-auto whitespace-pre-wrap font-mono">
                  {ep.response}
                </pre>
              </div>
            </div>
          ))}
        </div>

        {/* Node Statuses */}
        <div className="mb-16">
          <h2 className="text-white/20 text-[9px] tracking-[0.6em] uppercase mb-6">// NODE_STATUSES</h2>
          <div className="border border-white/10 bg-black/40 overflow-hidden">
            {statuses.map((s, i) => (
              <div key={s.value} className={`flex items-start gap-4 px-5 py-3 ${i < statuses.length - 1 ? "border-b border-white/5" : ""}`}>
                <span className="text-cyan-400/60 text-[10px] tracking-[0.15em] font-mono shrink-0 min-w-[140px]">{s.value}</span>
                <span className="text-white/30 text-[10px] leading-relaxed">{s.desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* curl example */}
        <div className="p-5 border border-white/5 bg-white/[0.01]">
          <div className="text-cyan-400/40 text-[8px] tracking-[0.3em] uppercase mb-4">// QUICK_START</div>
          <pre className="text-white/30 text-[10px] leading-relaxed font-mono whitespace-pre-wrap">
{`# Look up a node
curl https://www.myshape.com/api/identity?email=hello@example.com

# Get network stats
curl https://www.myshape.com/api/nodes/count`}
          </pre>
        </div>
      </div>

      <ProtocolFooter />
    </div>
  );
}
