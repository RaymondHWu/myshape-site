"use client";

import IdentityAnchorBody from "./IdentityAnchorBody";

export default function IdentityAnchor() {
  return (
    <section
      style={{
        position: "relative",
        width: "100%",
        padding: "12rem 6%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        background: "transparent",
        zIndex: 20, // ⭐ 整个模块在背景层之上
      }}
    >
      {/* 标题组 */}
      <div style={{ textAlign: "center", marginBottom: "6rem" }}>
        <span
          style={{
            fontSize: "0.7rem",
            letterSpacing: "0.8em",
            color: "rgba(144,200,255,0.5)",
            display: "block",
            marginBottom: "1.2rem",
          }}
        >
          IDENTITY ANCHOR
        </span>

        <h2
          style={{
            fontSize: "3.2rem",
            fontWeight: 200,
            color: "#fff",
            margin: 0,
            letterSpacing: "-0.02em",
          }}
        >
          Your protocol presence is the sovereign root of your digital existence.
        </h2>
      </div>

      {/* 粒子人容器 */}
      <div
        style={{
          width: "420px",
          height: "520px",
          position: "relative", // ⭐ Canvas 绝对定位的锚点
          overflow: "visible",
        }}
      >
        <IdentityAnchorBody />
      </div>

      {/* 文案 */}
      <div
        style={{
          marginTop: "4rem",
          textAlign: "center",
          maxWidth: "600px",
          color: "rgba(255,255,255,0.6)",
          fontSize: "0.9rem",
          lineHeight: "1.8",
        }}
      >
        <p>Your geometry is your identity.</p>
        <p>Your identity is your sovereignty.</p>
        <p>Your sovereignty is encoded as protocol.</p>
      </div>

      {/* 状态栏 */}
      <div
        style={{
          marginTop: "3rem",
          fontFamily: "monospace",
          fontSize: "0.65rem",
          color: "rgba(144,200,255,0.35)",
          textAlign: "center",
        }}
      >
        BODY_STATE: ACTIVE
        <br />
        GEOMETRY: VERIFIED
        <br />
        ENTROPY: STABLE
      </div>
    </section>
  );
}
