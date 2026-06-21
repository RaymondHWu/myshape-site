"use client";
import React from "react";
import "./IdentitySigil.css";

export default function IdentitySigil() {
  return (
    <div className="sigil-wrapper">
      <div className="sigil-container">
        <img
          src="/identity-sigil.jpg"
          alt="Identity Sigil"
          className="sigil-image"
          draggable={false}
        />
      </div>
    </div>
  );
}
