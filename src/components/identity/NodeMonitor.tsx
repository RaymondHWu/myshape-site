"use client";

import React, { useState, useEffect } from 'react';

export default function NodeMonitor({ nodeHandle = "RODDOG03" }) {
  const [hash, setHash] = useState("0X1A2B3C...");

  // 模拟数据流跳动
  useEffect(() => {
    const interval = setInterval(() => {
      setHash(Math.random().toString(16).substring(2, 10).toUpperCase());
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-end font-mono group">
      {/* 顶部状态 */}
      <div className="flex items-center gap-2 mb-1">
        <span className="text-[7px] tracking-[0.4em] text-cyan-500/40 uppercase">E&C: Active</span>
        <div className="w-1 h-1 bg-cyan-400 rounded-full shadow-[0_0_8px_rgba(34,211,238,0.8)] animate-pulse" />
      </div>

      {/* 核心 ID：移除背景，强化间距 */}
      <h2 className="text-xl font-light text-white tracking-[0.2em] mb-1">
        {nodeHandle}
      </h2>

      {/* 动态数据流 */}
      <div className="text-right border-r border-cyan-500/30 pr-3 py-1">
        <div className="text-[8px] text-cyan-400/60 leading-tight">
          <p>LOC: 128.42 // -9.10 // 4.5</p>
          <p className="animate-pulse">HASH: {hash}_GENESIS</p>
          <p className="opacity-30 uppercase tracking-tighter">Identity_Layer_Sync: 100%</p>
        </div>
      </div>

      {/* 底部装饰线 */}
      <div className="w-12 h-[1px] bg-gradient-to-l from-cyan-500/50 to-transparent mt-2" />
    </div>
  );
}