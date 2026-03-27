"use client";

import { Card, CardContent } from "@/components/ui/card";

interface ScoreboardProps {
  summary: {
    claude: { fixed: number; total: number; avgTimeMs: number };
    codex: { fixed: number; total: number; avgTimeMs: number };
  };
}

function formatTime(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export function Scoreboard({ summary }: ScoreboardProps) {
  const claudeScore = summary.claude.fixed;
  const codexScore = summary.codex.fixed;

  return (
    <Card className="bg-card border-border animate-in fade-in slide-in-from-bottom-2 duration-500">
      <CardContent className="p-6">
        <h3 className="text-lg font-bold text-center mb-6">Scoreboard</h3>
        <div className="grid grid-cols-3 gap-4 items-center">
          {/* Claude */}
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-500" />
              <span className="font-semibold">Claude Code</span>
            </div>
            <div className="text-3xl font-bold font-mono">
              {summary.claude.fixed}/{summary.claude.total}
            </div>
            <div className="text-sm text-muted-foreground">
              avg {formatTime(summary.claude.avgTimeMs)}
            </div>
          </div>

          {/* VS */}
          <div className="text-center">
            <div className="text-2xl font-bold text-muted-foreground">VS</div>
          </div>

          {/* Codex */}
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="font-semibold">Codex</span>
            </div>
            <div className="text-3xl font-bold font-mono">
              {summary.codex.fixed}/{summary.codex.total}
            </div>
            <div className="text-sm text-muted-foreground">
              avg {formatTime(summary.codex.avgTimeMs)}
            </div>
          </div>
        </div>

        {claudeScore !== codexScore && (
          <div className="mt-4 text-center text-sm font-medium">
            {claudeScore > codexScore ? (
              <span className="text-purple-400">
                Claude Code wins this round!
              </span>
            ) : (
              <span className="text-green-400">Codex wins this round!</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
