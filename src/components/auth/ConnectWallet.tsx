"use client";
import React, { useState, useCallback } from "react";
import { ethers } from "ethers";

interface Props {
  onSuccess?: (data: { address: string; skip_otp: boolean; is_genesis: boolean }) => void;
  email?: string;
  className?: string;
}

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on: (event: string, cb: (...args: unknown[]) => void) => void;
      removeListener: (event: string, cb: (...args: unknown[]) => void) => void;
      selectedAddress?: string;
      chainId?: string;
      isMetaMask?: boolean;
    };
  }
}

const SIWE_STATEMENT = "MyShape Protocol — Sovereign Identity Initialization";

export default function ConnectWallet({ onSuccess, email, className = "" }: Props) {
  const [address, setAddress] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "connecting" | "signing" | "verifying" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const isMetaMask = typeof window !== "undefined" && !!window.ethereum?.isMetaMask;

  const handleConnect = useCallback(async () => {
    try {
      setStatus("connecting");
      setErrorMsg("");

      if (!window.ethereum) {
        setErrorMsg("No Web3 wallet detected. Install MetaMask or Rainbow.");
        setStatus("error");
        return;
      }

      // 请求账户
      const accounts = (await window.ethereum.request({
        method: "eth_requestAccounts",
      })) as string[];

      if (!accounts || accounts.length === 0) {
        setErrorMsg("No accounts authorized.");
        setStatus("error");
        return;
      }

      const addr = accounts[0];
      setAddress(addr);

      // 构造 SIWE 消息
      const domain = window.location.host;
      const now = new Date().toISOString();
      const message = `${domain} wants you to sign in with your Ethereum account:\n${addr}\n\n${SIWE_STATEMENT}\n\nURI: https://${domain}\nVersion: 1\nChain ID: 1\nNonce: ${Date.now()}\nIssued At: ${now}`;

      // 请求签名
      setStatus("signing");
      const provider = new ethers.BrowserProvider(window.ethereum as unknown as ethers.Eip1193Provider);
      const signer = await provider.getSigner();
      const signature = await signer.signMessage(message);

      // 验证签名
      setStatus("verifying");
      const res = await fetch("/api/auth/siwe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, signature, address: addr, email: email || undefined }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "Signature verification failed");
        setStatus("error");
        return;
      }

      setStatus("done");
      onSuccess?.({
        address: addr,
        skip_otp: data.skip_otp || false,
        is_genesis: data.is_genesis || false,
      });
    } catch (err: unknown) {
      setErrorMsg((err as Error).message?.slice(0, 100) || "Connection failed");
      setStatus("error");
    }
  }, [email, onSuccess]);

  const handleDisconnect = () => {
    setAddress(null);
    setStatus("idle");
    setErrorMsg("");
  };

  return (
    <div className={className}>
      {status === "done" && address ? (
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 border border-cyan-400/30 bg-cyan-400/[0.04]">
            <span className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.6)]" />
            <span className="text-cyan-300/70 font-mono text-[10px] tracking-[0.1em]">
              {address.slice(0, 6)}...{address.slice(-4)}
            </span>
          </div>
          <button
            onClick={handleDisconnect}
            className="text-white/20 hover:text-white/40 text-[8px] tracking-[0.2em] uppercase transition-colors"
          >
            Disconnect
          </button>
        </div>
      ) : (
        <button
          onClick={handleConnect}
          disabled={status === "connecting" || status === "signing" || status === "verifying"}
          className={`relative group px-6 py-2.5 border transition-all duration-500 overflow-hidden font-mono text-[9px] tracking-[0.3em] uppercase ${
            status === "error" ? "border-red-400/30 text-red-300/60" : "border-cyan-400/25 text-cyan-300/60 hover:text-cyan-200 hover:border-cyan-400/50"
          }`}
          style={{ background: "rgba(34,211,238,0.03)" }}
        >
          {status === "connecting" || status === "signing" || status === "verifying" ? (
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              {status === "connecting" ? "CONNECTING..." : status === "signing" ? "SIGNING..." : "VERIFYING..."}
            </span>
          ) : (
            <span>{isMetaMask ? "CONNECT_WALLET" : "INSTALL_METAMASK"}</span>
          )}
        </button>
      )}
      {errorMsg && (
        <p className="text-red-300/40 text-[7px] tracking-[0.15em] mt-1.5">{errorMsg}</p>
      )}
    </div>
  );
}
