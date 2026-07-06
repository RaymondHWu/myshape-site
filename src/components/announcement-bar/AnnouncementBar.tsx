"use client";
import { useState, useEffect } from "react";
import { playTick } from "@/utils/useAudioTick";
import "./announcement-bar.css";

const STORAGE_KEY = "myshape_announcement_dev_nodes_20260706";

export default function AnnouncementBar() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissed = sessionStorage.getItem(STORAGE_KEY);
    if (!dismissed) setVisible(true);
  }, []);

  const dismiss = () => {
    sessionStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
    playTick(600, "sine", 0.06, 0.015);
  };

  if (!visible) return null;

  return (
    <div className="ann-bar">
      <div className="ann-bar-inner">
        <span className="ann-dot" />
        <span className="ann-text">
          Dev Nodes are live. Deploy a protocol anchor in 60 seconds. No wallet. No invite.{" "}
          <a href="/developers" className="ann-link">
            Get Started →
          </a>
        </span>
        <button
          onClick={dismiss}
          onMouseEnter={() => playTick(500, "sine", 0.04, 0.01)}
          className="ann-close"
          aria-label="Dismiss announcement"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
