"use client";

import { useEffect, useState } from "react";

interface ScoreboardProps {
  summary: {
    claude: { fixed: number; total: number; avgTimeMs: number };
    codex: { fixed: number; total: number; avgTimeMs: number };
  };
}

function AnimatedNumber({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const duration = 800;
    const steps = 20;
    const increment = value / steps;
    let current = 0;
    const interval = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplay(value);
        clearInterval(interval);
      } else {
        setDisplay(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(interval);
  }, [value]);

  return (
    <span>
      {display}
      {suffix}
    </span>
  );
}

function formatTime(ms: number): string {
  return `${(ms / 1000).toFixed(1)}s`;
}

export function Scoreboard({ summary }: ScoreboardProps) {
  const claudeWins =
    summary.claude.fixed > summary.codex.fixed ||
    (summary.claude.fixed === summary.codex.fixed &&
      summary.claude.avgTimeMs < summary.codex.avgTimeMs);
  const codexWins =
    summary.codex.fixed > summary.claude.fixed ||
    (summary.codex.fixed === summary.claude.fixed &&
      summary.codex.avgTimeMs < summary.claude.avgTimeMs);

  const speedDiff =
    summary.claude.avgTimeMs && summary.codex.avgTimeMs
      ? Math.abs(
          Math.round(
            ((summary.claude.avgTimeMs - summary.codex.avgTimeMs) /
              Math.max(summary.claude.avgTimeMs, summary.codex.avgTimeMs)) *
              100
          )
        )
      : 0;

  return (
    <div className="border border-neutral-800 rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-neutral-800 bg-neutral-900/50">
        <h3 className="text-sm font-medium text-white">Results</h3>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-3 gap-6 items-center">
          {/* Claude */}
          <div className="text-center space-y-2">
            <div className="text-sm font-medium text-neutral-300">
              Claude Code
            </div>
            <div className="text-3xl font-bold font-mono text-white">
              <AnimatedNumber value={summary.claude.fixed} />/
              {summary.claude.total}
            </div>
            <div className="text-xs text-neutral-500 font-mono">
              avg {formatTime(summary.claude.avgTimeMs)}
            </div>
            {claudeWins && (
              <div className="text-xs font-mono text-white">winner</div>
            )}
          </div>

          {/* VS */}
          <div className="text-center">
            <div className="text-sm font-mono text-neutral-700">vs</div>
            {speedDiff > 0 && (
              <div className="text-xs text-neutral-600 mt-1">
                {claudeWins ? "Claude" : "Codex"} was {speedDiff}% faster
              </div>
            )}
          </div>

          {/* Codex */}
          <div className="text-center space-y-2">
            <div className="text-sm font-medium text-neutral-300">Codex</div>
            <div className="text-3xl font-bold font-mono text-white">
              <AnimatedNumber value={summary.codex.fixed} />/
              {summary.codex.total}
            </div>
            <div className="text-xs text-neutral-500 font-mono">
              avg {formatTime(summary.codex.avgTimeMs)}
            </div>
            {codexWins && (
              <div className="text-xs font-mono text-white">winner</div>
            )}
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-neutral-800 flex gap-3 justify-center">
          <a
            href="/"
            className="px-4 py-2 text-xs font-medium text-neutral-400 border border-neutral-800 rounded-lg hover:text-white hover:border-neutral-600 transition-colors"
          >
            Try another repo
          </a>
        </div>
      </div>
    </div>
  );
}
