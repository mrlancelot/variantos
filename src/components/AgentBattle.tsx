"use client";

import { useEffect, useState } from "react";
import { CodeDiff } from "./CodeDiff";
import { AgentActivityFeed } from "./AgentActivityFeed";
import { AgentResult, AgentActivity, Issue } from "@/lib/types";

interface AgentBattleProps {
  issue: Issue;
  claude?: AgentResult;
  codex?: AgentResult;
  claudeActivities: AgentActivity[];
  codexActivities: AgentActivity[];
  isRunning: boolean;
}

function AgentColumn({
  result,
  agentName,
  activities,
  isRunning,
}: {
  result?: AgentResult;
  agentName: string;
  activities: AgentActivity[];
  isRunning: boolean;
}) {
  const [elapsed, setElapsed] = useState(0);
  const [startTime] = useState(Date.now());

  useEffect(() => {
    if (!isRunning && result) return;
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning, result, startTime]);

  const displayTime = result
    ? `${(result.durationMs / 1000).toFixed(1)}s`
    : `${elapsed}s`;

  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-white">{agentName}</span>
        <span className="font-mono text-xs text-neutral-500">
          {displayTime}
        </span>
      </div>

      {/* Activity feed during execution */}
      {(isRunning || (!result && activities.length > 0)) && (
        <AgentActivityFeed activities={activities} isRunning={isRunning && !result} />
      )}

      {/* Result */}
      {result && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-mono ${result.status === "success" ? "text-green-500" : "text-red-500"}`}
            >
              {result.status === "success" ? "fixed" : "failed"}
            </span>
            {result.filesChanged.length > 0 && (
              <span className="text-xs text-neutral-600">
                {result.filesChanged.length} file
                {result.filesChanged.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          {result.filesChanged.length > 0 && (
            <div className="space-y-0.5">
              {result.filesChanged.map((f, i) => (
                <div key={i} className="font-mono text-xs text-neutral-500">
                  {f}
                </div>
              ))}
            </div>
          )}

          <CodeDiff diff={result.diff} />
        </div>
      )}
    </div>
  );
}

export function AgentBattle({
  issue,
  claude,
  codex,
  claudeActivities,
  codexActivities,
  isRunning,
}: AgentBattleProps) {
  const bothDone = claude && codex;
  const winner = bothDone
    ? claude.status === "success" && codex.status !== "success"
      ? "claude"
      : codex.status === "success" && claude.status !== "success"
        ? "codex"
        : claude.status === "success" && codex.status === "success"
          ? claude.durationMs < codex.durationMs
            ? "claude"
            : codex.durationMs < claude.durationMs
              ? "codex"
              : null
          : null
    : null;

  return (
    <div className="border border-neutral-800 rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/50">
        <p className="text-sm text-neutral-300 truncate flex-1">
          {issue.description.slice(0, 100)}
          {issue.description.length > 100 ? "..." : ""}
        </p>
        {winner && (
          <span className="text-xs font-mono text-neutral-500 ml-3 shrink-0">
            {winner === "claude" ? "claude wins" : "codex wins"}
          </span>
        )}
      </div>
      <div className="p-4 flex gap-4">
        <AgentColumn
          result={claude}
          agentName="Claude Code"
          activities={claudeActivities}
          isRunning={isRunning}
        />
        <div className="w-px bg-neutral-800 shrink-0" />
        <AgentColumn
          result={codex}
          agentName="Codex"
          activities={codexActivities}
          isRunning={isRunning}
        />
      </div>
    </div>
  );
}
