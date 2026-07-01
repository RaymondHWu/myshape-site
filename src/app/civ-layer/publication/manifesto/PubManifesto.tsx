"use client";
import React from 'react';
import Link from 'next/link'; // 增加 Link 用於返回
import ProtocolLayout from "@/components/layout/ProtocolLayout";

export default function PubManifesto() {
  const manifestoSegments = [
    {
      id: "SIG_01",
      title: "THE HUMAN STANCE",
      desc: "WE BEGIN FROM A SIMPLE TRUTH: A HUMAN IS NOT A DATASET. NOT A PROFILE, NOT A CREDENTIAL, NOT A COLLECTION OF SIGNALS SCATTERED ACROSS SYSTEMS. A HUMAN IS A SOVEREIGN ENTITY WHOSE EXISTENCE CANNOT BE REDUCED TO THE INFORMATION THEY GENERATE.",
      meta: "UPLINK: CORE"
    },
    {
      id: "SIG_02",
      title: "THE RIGHT TO A SOVEREIGN SELF",
      desc: "EVERY HUMAN HAS THE RIGHT TO EXIST WITHOUT BEING COPIED, MODELED, OR OWNED. THIS RIGHT DOES NOT COME FROM INSTITUTIONS, PLATFORMS, OR LAWS. IT COMES FROM THE SIMPLE FACT THAT A PERSON IS MORE THAN THE DATA THEY GENERATE.",
      meta: "ACCESS: INHERENT"
    },
    {
      id: "SIG_03",
      title: "THE REFUSAL",
      desc: "WE REFUSE TO ACCEPT A WORLD WHERE A HUMAN MUST TRADE THEIR IDENTITY FOR PARTICIPATION. WE REFUSE SYSTEMS THAT RECONSTRUCT PEOPLE FROM FRAGMENTS, PREDICT THEM FROM TRACES, OR REPLICATE THEM WITHOUT CONSENT.",
      meta: "SIGNAL: BOUNDARY"
    },
    {
      id: "SIG_04",
      title: "THE COMMITMENT",
      desc: "WE COMMIT TO BUILDING A WORLD WHERE A HUMAN CAN EXIST WITHOUT BEING CONSUMED BY THE SYSTEMS AROUND THEM. A WORLD WHERE IDENTITY IS GENERATED LOCALLY, EXPRESSED SELECTIVELY, AND PROTECTED BY A BOUNDARY.",
      meta: "REF: FOUNDATION"
    },
    {
      id: "SIG_05",
      title: "THE FUTURE WE CHOOSE",
      desc: "WE CHOOSE A FUTURE WHERE HUMANS REMAIN SOVEREIGN IN A WORLD SHAPED BY INTELLIGENCE. WHERE THE DIGITAL SELF IS WHOLE, UNCOPYABLE, AND INSEPARABLE FROM THE PERSON IT REPRESENTS.",
      meta: "STATUS: DECREE"
    }
  ];

  return (
    <ProtocolLayout 
      refId="001-PUB" 
      category="CIV_LAYER" 
      title="MANIFESTO" 
      secLevel="CLASS_OMEGA" 
      systemStatus="ARCHIVE_CORE"
    >
      <div className="space-y-32 pb-32">
        {/* --- Back Link --- */}
        <Link href="/civ-layer/publication" className="text-[#90c8ff]/40 hover:text-[#90c8ff] text-[10px] tracking-[0.4em] transition-colors uppercase flex items-center gap-2">
          <span>← Back_to_Publication</span>
        </Link>

        {/* --- 1. 引言區塊 --- */}
        <section className="max-w-4xl relative">
          <div className="absolute -left-10 top-0 w-1 h-full bg-gradient-to-b from-[#90c8ff] to-transparent opacity-30" />
          <h2 className="text-2xl md:text-3xl font-extralight tracking-[0.4em] text-white leading-tight uppercase mb-8">
            The <span className="text-[#90c8ff]">Sovereign Presence</span> is the irreducible baseline of the new civilization.
          </h2>
          <p className="text-white/50 text-base tracking-[0.2em] leading-relaxed font-light">
            In the age of distributed intelligence, the truth of human existence must be defended, not assumed. 
            This document outlines the non-negotiable boundaries of the MyShape protocol.
          </p>
        </section>

        {/* --- 2. 核心立場 --- */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-16 items-start">
          <div className="space-y-6">
            <h3 className="text-[#90c8ff]/80 text-[10px] tracking-[0.6em] font-bold uppercase">// THE_REJECTION</h3>
            <p className="text-white/40 text-xs tracking-widest leading-loose uppercase">
              We reject the structures that treat the individual as a resource to be extracted, analyzed, and replicated. 
              A human must remain whole—even when intelligence surrounds them and acts on their behalf.
            </p>
          </div>
          <div className="p-8 border border-white/10 bg-white/[0.01] relative overflow-hidden">
             <div className="absolute top-0 right-0 p-2 text-[8px] text-white/10 font-mono italic">PUB_STAMP_001</div>
             <p className="text-white/70 text-[11px] tracking-[0.2em] leading-relaxed uppercase italic">
                "A human is a sovereign entity whose existence cannot be reduced to information."
             </p>
          </div>
        </section>

        {/* --- 3. 宣言章節 --- */}
        <section className="space-y-12">
          <h3 className="text-white/20 text-[9px] tracking-[0.6em] uppercase text-center">// MANIFESTO_SEGMENTS</h3>
          <div className="space-y-px bg-white/5 border border-white/5">
            {manifestoSegments.map((segment) => (
              <div key={segment.id} className="grid grid-cols-1 md:grid-cols-12 bg-[#02040a] p-12 group hover:bg-[#90c8ff]/[0.03] transition-all duration-500">
                <div className="md:col-span-3 space-y-2 mb-6 md:mb-0">
                  <div className="text-[#90c8ff] text-[10px] tracking-[0.4em] font-bold">
                    {segment.id}
                  </div>
                  <div className="text-white/20 text-[8px] tracking-[0.2em]">
                    {segment.meta}
                  </div>
                </div>
                <div className="md:col-span-9 space-y-4">
                  <h4 className="text-white text-lg tracking-[0.3em] font-light uppercase group-hover:text-[#90c8ff] transition-colors">
                    {segment.title}
                  </h4>
                  <p className="text-white/40 text-[11px] tracking-[0.2em] leading-relaxed uppercase group-hover:text-white transition-colors duration-500 text-justify">
                    {segment.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* --- 4. 底部標誌 --- */}
        <div className="flex justify-center opacity-20 pt-20">
          <div className="text-[8px] tracking-[1em] uppercase border-y border-white/20 py-4 px-12">
            Civilizational_Foundation_Confirmed
          </div>
        </div>
      </div>
    </ProtocolLayout>
  );
}