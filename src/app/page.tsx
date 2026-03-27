"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ScanForm } from "@/components/ScanForm";
import { v4 as uuidv4 } from "uuid";

export default function HomePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (repoUrl: string, goal: string) => {
    setIsLoading(true);
    const sessionId = uuidv4();
    sessionStorage.setItem(
      `scan-${sessionId}`,
      JSON.stringify({ repoUrl, goal })
    );
    router.push(`/scan/${sessionId}`);
  };

  return (
    <main className="flex-1 flex flex-col items-center justify-center px-4 py-16">
      <div className="text-center space-y-6 mb-12">
        <div className="space-y-2">
          <h1 className="text-5xl font-bold tracking-tight">
            variant
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-green-400">
              OS
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-lg mx-auto">
            A/B test your AI coding agents. Find bugs, watch Claude Code and
            Codex race to fix them.
          </p>
        </div>

        <div className="flex items-center justify-center gap-8 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-purple-500" />
            Claude Code
          </div>
          <span className="text-muted-foreground/30">vs</span>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            Codex
          </div>
        </div>
      </div>

      <ScanForm onSubmit={handleSubmit} isLoading={isLoading} />

      <div className="mt-16 grid grid-cols-3 gap-8 max-w-2xl mx-auto text-center">
        <div className="space-y-2">
          <div className="text-2xl font-mono font-bold text-purple-400">1</div>
          <p className="text-sm text-muted-foreground">
            Browser agent finds bugs in your app
          </p>
        </div>
        <div className="space-y-2">
          <div className="text-2xl font-mono font-bold text-foreground">2</div>
          <p className="text-sm text-muted-foreground">
            Two AI agents race to fix the same bug
          </p>
        </div>
        <div className="space-y-2">
          <div className="text-2xl font-mono font-bold text-green-400">3</div>
          <p className="text-sm text-muted-foreground">
            Compare fixes, pick the best one
          </p>
        </div>
      </div>
    </main>
  );
}
