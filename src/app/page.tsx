"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ScanForm } from "@/components/ScanForm";
import { v4 as uuidv4 } from "uuid";

export default function HomePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (repoUrl: string, goal: string, liveUrl: string) => {
    setIsLoading(true);
    const sessionId = uuidv4();
    sessionStorage.setItem(
      `scan-${sessionId}`,
      JSON.stringify({ repoUrl, goal, liveUrl })
    );
    router.push(`/scan/${sessionId}`);
  };

  return (
    <main className="flex-1 flex flex-col items-center justify-center px-4 py-20">
      <div className="text-center space-y-4 mb-14">
        <h1 className="text-5xl font-bold tracking-tight text-white">
          variantOS
        </h1>
        <p className="text-lg text-neutral-400 max-w-md mx-auto leading-relaxed">
          Ship better code. Let AI agents compete to fix your bugs.
        </p>
      </div>

      <ScanForm onSubmit={handleSubmit} isLoading={isLoading} />

      <div className="mt-20 flex items-center gap-12 text-sm text-neutral-500">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-neutral-400" />
          <span>Find bugs</span>
        </div>
        <div className="w-8 h-px bg-neutral-800" />
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-neutral-400" />
          <span>Race to fix</span>
        </div>
        <div className="w-8 h-px bg-neutral-800" />
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-neutral-400" />
          <span>Compare & ship</span>
        </div>
      </div>
    </main>
  );
}
