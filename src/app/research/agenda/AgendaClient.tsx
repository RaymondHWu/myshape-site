"use client";
import Link from "next/link";
import ProtocolHeader from "@/components/header/header";
import ProtocolFooter from "@/components/footer/footer";
import { playTick } from "@/utils/useAudioTick";
import "./agenda.css";

const STATUS_COLOR: Record<string, string> = {
  "Active Research": "#4ade80",
  Investigating: "#facc15",
  Conceptual: "#60a5fa",
};

const QUESTIONS = [
  {
    num: "Q1",
    question: "Can biological continuity be measured?",
    status: "Investigating",
    detail:
      "Is there a statistically separable signal in human motion that persists across sessions, hardware, and environments — and can it be quantified as a continuity score?",
    note: "Dependent on PES Benchmark stability validation. Current evidence: Cohen's d = 2.1, AUC = 0.94 (54 samples).",
  },
  {
    num: "Q2",
    question: "Can continuity survive replay attacks?",
    status: "Investigating",
    detail:
      "Under what conditions can a continuity proof be replayed, simulated, or adversarially synthesized? What is the minimum signal dimension that resists attack?",
    note: "Requires quantification of anti-replay thresholds in a controlled Replay Benchmark.",
  },
  {
    num: "Q3",
    question: "Can continuity transfer to autonomous agents?",
    status: "Conceptual",
    detail:
      "If a human delegates agency to an AI, does continuity transfer? How do we define 'entropy of presence' for an agent with no biological substrate?",
    note: "Core challenge: defining existence entropy for non-biological entities. This may become the defining question of the post-agent era.",
  },
  {
    num: "Q4",
    question: "Can continuity become a protocol primitive?",
    status: "Active Research",
    detail:
      "If continuity is measurable and verifiable, can it be encoded as a cryptographic primitive — alongside identity, encryption, and consensus — in decentralized protocols?",
    note: "Active prototype: Continuity Receipt format. Exploring ZK-friendly encoding of motion-derived continuity proofs.",
  },
];

export default function AgendaClient() {
  return (
    <div className="min-h-screen bg-[#02040a] text-[#f8feff] font-mono selection:bg-[#90c8ff]/30">
      <ProtocolHeader />

      <div className="relative z-10 max-w-3xl mx-auto px-4 md:px-6 pt-28 pb-16">
        {/* ── Hero ── */}
        <section className="agenda-hero">
          <div className="agenda-label">The Continuity Lab</div>
          <h1 className="agenda-tagline">
            Researching <span>verifiable continuity</span> in the digital world.
          </h1>
        </section>

        {/* ── Three Numbers ── */}
        <section className="agenda-numbers">
          <div
            className="agenda-number-card"
            onMouseEnter={() => playTick(600, "sine", 0.04, 0.01)}
          >
            <div className="agenda-number">1</div>
            <div className="agenda-number-label">Research Note</div>
          </div>
          <div className="agenda-number-divider" />
          <div
            className="agenda-number-card"
            onMouseEnter={() => playTick(600, "sine", 0.04, 0.01)}
          >
            <div className="agenda-number">1</div>
            <div className="agenda-number-label">Benchmark</div>
          </div>
          <div className="agenda-number-divider" />
          <div
            className="agenda-number-card"
            onMouseEnter={() => playTick(600, "sine", 0.04, 0.01)}
          >
            <div className="agenda-number agenda-number-gold">12</div>
            <div className="agenda-number-label">Open Questions</div>
          </div>
        </section>

        {/* ── What this is ── */}
        <section className="agenda-section">
          <p className="agenda-primer">
            This is not a product roadmap. It is a{" "}
            <strong>research agenda</strong> — a living document that defines
            the questions we are investigating, the status of each
            investigation, and the experiments that could falsify our current
            hypotheses.
          </p>
        </section>

        {/* ── Manifesto ── */}
        <section className="agenda-manifesto">
          <blockquote className="agenda-blockquote">
            <p className="agenda-blockquote-text">
              We do not defend hypotheses.
              <br />
              We design experiments that can falsify them.
            </p>
            <cite className="agenda-blockquote-cite">
              — The Continuity Lab Manifesto, Article I
            </cite>
          </blockquote>
        </section>

        {/* ── Research Questions ── */}
        <section className="agenda-section">
          <h2 className="agenda-section-heading">The Research Agenda</h2>

          <div className="agenda-questions">
            {QUESTIONS.map((q) => (
              <div
                key={q.num}
                className="agenda-question-card"
                onMouseEnter={() => playTick(400, "sine", 0.03, 0.008)}
              >
                <div className="agenda-question-header">
                  <span className="agenda-question-num">{q.num}</span>
                  <span
                    className="agenda-question-status"
                    style={{ color: STATUS_COLOR[q.status] }}
                  >
                    {q.status}
                  </span>
                </div>
                <h3 className="agenda-question-title">{q.question}</h3>
                <p className="agenda-question-detail">{q.detail}</p>
                <p className="agenda-question-note">{q.note}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Methodology ── */}
        <section className="agenda-section">
          <h2 className="agenda-section-heading">How We Work</h2>
          <div className="agenda-methods">
            <div
              className="agenda-method-card"
              onMouseEnter={() => playTick(400, "sine", 0.03, 0.008)}
            >
              <div className="agenda-method-num">01</div>
              <div className="agenda-method-title">State the hypothesis</div>
              <div className="agenda-method-desc">
                Every Research Note begins with a falsifiable claim — not a
                position we are committed to defending.
              </div>
            </div>
            <div
              className="agenda-method-card"
              onMouseEnter={() => playTick(400, "sine", 0.03, 0.008)}
            >
              <div className="agenda-method-num">02</div>
              <div className="agenda-method-title">Design the experiment</div>
              <div className="agenda-method-desc">
                What evidence would prove the hypothesis wrong? We build the
                benchmark before we write the conclusion.
              </div>
            </div>
            <div
              className="agenda-method-card"
              onMouseEnter={() => playTick(400, "sine", 0.03, 0.008)}
            >
              <div className="agenda-method-num">03</div>
              <div className="agenda-method-title">Publish the evidence</div>
              <div className="agenda-method-desc">
                Results, data, and threats to validity are published together.
                Negative results are results.
              </div>
            </div>
            <div
              className="agenda-method-card"
              onMouseEnter={() => playTick(400, "sine", 0.03, 0.008)}
            >
              <div className="agenda-method-num">04</div>
              <div className="agenda-method-title">Update the agenda</div>
              <div className="agenda-method-desc">
                Every experiment closes some questions and opens others. This
                page reflects our current best understanding — not our final
                answers.
              </div>
            </div>
          </div>
        </section>

        {/* ── Footer ── */}
        <div className="agenda-footer">
          <p className="agenda-footer-text">
            Last updated: 2026-07-08 ·{" "}
            <Link href="/research">← Research Hub</Link>
            {" · "}
            <Link href="/">Home</Link>
          </p>
          <p className="agenda-footer-credits">
            The Continuity Lab is a research program investigating whether
            continuity can become a verifiable property of the digital world.
            We are not building a product. We are investigating a question.
          </p>
        </div>
      </div>

      <ProtocolFooter />
    </div>
  );
}
