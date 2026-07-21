"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function MotionPipeline() {
  const router = useRouter();
  useEffect(() => { router.replace("/protocol"); }, [router]);
  return null;
}
