"use client";
import { motion } from "framer-motion";

interface GenesisIdentityCardProps {
  email: string;
  nodeHandle?: string | null;
  positionNumber?: number;
  entropyScore?: number;
  particleLevel?: number;
  timestamp?: string;
}

const GENESIS_RIGHTS = [
  { key: "PERMANENT_TIER", label: "Genesis Founding Entity", desc: "Permanent protocol-level status. Never revoked. Never offered again after cohort closes." },
  { key: "GOVERNANCE_VOICE", label: "Governance Voting Weight", desc: "Genesis Nodes carry 3× voting weight in future protocol governance decisions." },
  { key: "ENERGY_LEGACY", label: "Entropy Multiplier Legacy", desc: "1.5× permanent entropy multiplier on all future scans — your growth curve is steeper, forever." },
  { key: "VISUAL_SOVEREIGNTY", label: "Protocol Elder Visuals", desc: "Unique wireframe anatomy effects at higher particle levels. Your Data-Body is visually sovereign." },
  { key: "EARLY_ACCESS", label: "All Future Primitives", desc: "First access to every new protocol primitive before public release. SDK, ZK upgrades, multi-device sync." },
];

const FUTURE_ROLES = [
  "Protocol Council eligibility (≥ Level 5)",
  "Genesis-only research dataset access",
  "Node discovery priority in the Presence Network",
  "Co-author protocol improvement proposals (MIPs)",
];

export default function GenesisIdentityCard({
  email,
  nodeHandle,
  positionNumber,
  entropyScore = 0,
  particleLevel = 1,
  timestamp,
}: GenesisIdentityCardProps) {
  const timeStr = timestamp
    ? new Date(timestamp).toISOString().replace("T", " ").slice(0, 19)
    : new Date().toISOString().replace("T", " ").slice(0, 19);

  return (
    <div className="space-y-5 w-full max-w-lg">
      {/* ── 主身份卡 ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.6 }}
        className="relative">
        <div className="absolute -inset-[1px] rounded-sm genesis-card-glow" />
        <div className="relative px-5 py-4 md:px-7 md:py-5"
          style={{ border: "1px solid rgba(144,200,255,0.2)", background: "rgba(4,14,28,0.92)" }}>

          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[#90c8ff] animate-pulse"
                style={{ boxShadow: "0 0 8px rgba(144,200,255,0.6)" }} />
              <span className="text-[#90c8ff]/50 font-mono text-[7px] tracking-[0.4em] uppercase">IDENTITY_CARD</span>
            </div>
            {positionNumber && (
              <span className="text-white/20 font-mono text-[8px] tracking-[0.2em]">
                #{String(positionNumber).padStart(3, "0")} / 100
              </span>
            )}
          </div>

          {/* Title */}
          <div className="text-center mb-4">
            <div className="text-[#90c8ff]/85 font-mono text-[12px] md:text-[14px] tracking-[0.3em] uppercase"
              style={{ textShadow: "0 0 18px rgba(144,200,255,0.4)" }}>
              GENESIS_COHORT
            </div>
            <div className="text-white/30 font-mono text-[8px] tracking-[0.5em] uppercase mt-1">
              FOUNDING_ENTITY
            </div>
          </div>

          <div className="w-16 h-[1px] mx-auto mb-4 bg-gradient-to-r from-transparent via-[#90c8ff]/50 to-transparent" />

          {/* Node Info */}
          <div className="grid grid-cols-2 gap-2 mb-4 font-mono">
            <div>
              <div className="text-white/20 text-[7px] tracking-[0.2em] uppercase">NODE_HANDLE</div>
              <div className="text-[#90c8ff]/60 text-[9px] tracking-[0.1em]">{nodeHandle || "UNASSIGNED"}</div>
            </div>
            <div>
              <div className="text-white/20 text-[7px] tracking-[0.2em] uppercase">SIG_KEY</div>
              <div className="text-[#90c8ff]/60 text-[9px] tracking-[0.1em]">
                {email ? email.slice(0, 3) + "****" + email.slice(-4) : "N/A"}
              </div>
            </div>
            <div>
              <div className="text-white/20 text-[7px] tracking-[0.2em] uppercase">PARTICLE_LV</div>
              <div className="text-[#90c8ff]/60 text-[9px] tracking-[0.1em]">
                {"●".repeat(Math.min(particleLevel, 8))}
                <span className="text-white/20 ml-1">Lv.{particleLevel}</span>
              </div>
            </div>
            <div>
              <div className="text-white/20 text-[7px] tracking-[0.2em] uppercase">ENTROPY</div>
              <div className="text-[#90c8ff]/60 text-[9px] tracking-[0.1em]">{entropyScore}</div>
            </div>
            <div className="col-span-2">
              <div className="text-white/20 text-[7px] tracking-[0.2em] uppercase">GENESIS_TIMESTAMP</div>
              <div className="text-[#90c8ff]/40 text-[8px] tracking-[0.1em]">{timeStr} UTC</div>
            </div>
          </div>

          {/* Declaration */}
          <div className="border-t border-white/5 pt-3 text-center">
            <p className="text-white/40 text-[8px] tracking-[0.15em] leading-relaxed">
              This node is a <span className="text-[#90c8ff]/70">permanent founding entity</span> of MyShape Protocol.
              Its identity is cryptographically anchored in the Genesis Cohort — a finite set of 100 nodes
              that form the statistical foundation for all future presence verifications.
            </p>
          </div>

          {/* Corners */}
          <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-[#90c8ff]/60" />
          <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-[#90c8ff]/60" />
          <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-[#90c8ff]/60" />
          <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-[#90c8ff]/60" />
        </div>
      </motion.div>

      {/* ── Genesis 权益 ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.5 }}
        className="border border-[#90c8ff]/10 bg-[#90c8ff]/[0.02] px-5 py-4">
        <div className="text-[#90c8ff]/40 text-[8px] tracking-[0.3em] uppercase mb-3">// GENESIS_RIGHTS</div>
        <div className="space-y-2">
          {GENESIS_RIGHTS.map((right) => (
            <div key={right.key} className="flex items-start gap-2">
              <span className="text-[#90c8ff]/50 text-[8px] mt-0.5">◆</span>
              <div>
                <div className="text-white/50 text-[9px] tracking-[0.1em]">{right.label}</div>
                <div className="text-white/20 text-[8px] leading-relaxed">{right.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── 能量体：粒子等级可视化 ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0, duration: 0.5 }}
        className="border border-purple-400/15 bg-purple-400/[0.02] px-5 py-4 text-center">
        <div className="text-purple-400/40 text-[8px] tracking-[0.3em] uppercase mb-3">// ENERGY_BODY</div>
        <div className="flex items-center justify-center gap-1.5 mb-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <motion.div
              key={i}
              animate={i < particleLevel ? {
                scale: [1, 1.15, 1],
                opacity: [0.4, 1, 0.4],
              } : {}}
              transition={{
                duration: 2 + i * 0.3,
                repeat: Infinity,
                delay: i * 0.15,
                ease: "easeInOut",
              }}
              className="w-2 h-2 rounded-full"
              style={{
                background: i < particleLevel
                  ? `radial-gradient(circle at 35% 35%, #fff, rgba(${120 + i * 15}, ${200 - i * 5}, 255, 0.7))`
                  : "rgba(255,255,255,0.06)",
                boxShadow: i < particleLevel
                  ? `0 0 ${6 + i * 2}px rgba(144,200,255,${0.3 + i * 0.08})`
                  : "none",
              }}
            />
          ))}
        </div>
        <div className="text-white/30 font-mono text-[8px] tracking-[0.2em]">
          LEVEL_{particleLevel} — {particleLevel < 4 ? "DATA_OUTLINE_FORMING"
            : particleLevel < 6 ? "CORE_NODES_ACTIVE"
            : particleLevel < 8 ? "FIELD_SOVEREIGN"
            : "PROTOCOL_ELDER"}
        </div>
      </motion.div>

      {/* ── 未来治理角色 ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2, duration: 0.5 }}
        className="border border-white/5 px-5 py-4">
        <div className="text-white/20 text-[8px] tracking-[0.3em] uppercase mb-3">// FUTURE_GOVERNANCE</div>
        <p className="text-white/25 text-[9px] leading-relaxed mb-2">
          As a Genesis Founding Entity, your node will be eligible for:
        </p>
        <div className="space-y-1">
          {FUTURE_ROLES.map((role, i) => (
            <div key={i} className="flex items-center gap-2 text-white/20 text-[8px] tracking-[0.08em]">
              <span className="text-purple-400/30 text-[6px]">◈</span>
              {role}
            </div>
          ))}
        </div>
        <div className="mt-3 pt-3 border-t border-white/5 text-white/10 text-[7px] text-center tracking-[0.15em]">
          Governance module activation: Q4 2026 (estimated)
        </div>
      </motion.div>

      {/* ── 时间线标记 ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.4, duration: 0.5 }}
        className="flex items-center gap-3 justify-center">
        <div className="h-[1px] w-8 bg-white/5" />
        <span className="text-white/15 text-[7px] tracking-[0.3em] uppercase font-mono">
          GENESIS_TIMELINE · PHASE_0 · CIVILIZATION_SEED
        </span>
        <div className="h-[1px] w-8 bg-white/5" />
      </motion.div>
    </div>
  );
}
