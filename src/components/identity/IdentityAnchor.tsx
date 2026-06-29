"use client";
import IdentityAnchorBody from "./IdentityAnchorBody";

export default function IdentityAnchor() {
  return (
    <section className="relative w-full py-48 px-[6%] flex flex-col items-center bg-transparent z-20">
      {/* 标题组 */}
      <div className="text-center mb-24">
        <span className="block text-[0.7rem] tracking-[0.8em] text-cyan-400/50 mb-5">
          IDENTITY ANCHOR
        </span>
        <h2 className="text-[3.2rem] font-extralight text-white m-0 -tracking-[0.02em]">
          Your protocol presence is the sovereign root of your digital existence.
        </h2>
      </div>

      {/* 粒子人容器 */}
      <div className="w-[420px] h-[520px] relative overflow-visible">
        <IdentityAnchorBody />
      </div>

      {/* 文案 */}
      <div className="mt-16 text-center max-w-[600px] text-white/60 text-[0.9rem] leading-[1.8]">
        <p>Your geometry is your identity.</p>
        <p>Your identity is your sovereignty.</p>
        <p>Your sovereignty is encoded as protocol.</p>
      </div>

      {/* 状态栏 */}
      <div className="mt-12 font-mono text-[0.65rem] text-cyan-400/35 text-center">
        BODY_STATE: ACTIVE
        <br />
        GEOMETRY: VERIFIED
        <br />
        ENTROPY: STABLE
      </div>
    </section>
  );
}
