"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CodeDiff } from "./CodeDiff";
import { AgentResult, Issue } from "@/lib/types";

interface AgentBattleProps {
  issue: Issue;
  claude?: AgentResult;
  codex?: AgentResult;
  isRunning: boolean;
}

function AgentColumn({
  result,
  agentName,
  color,
  isRunning,
}: {
  result?: AgentResult;
  agentName: string;
  color: string;
  isRunning: boolean;
}) {
  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <div className="flex-1 space-y-3">
      <div className="flex items-center gap-2">
        <div className={`w-3 h-3 rounded-full ${color}`} />
        <span className="font-semibold text-sm">{agentName}</span>
      </div>

      {isRunning && !result && (
        <div className="space-y-2 p-4 rounded bg-muted/30 border border-border">
          <div className="flex items-center gap-2">
            <span className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
            <span className="text-sm text-muted-foreground">Working...</span>
          </div>
          <div className="h-1.5 bg-muted rounded overflow-hidden">
            <div className="h-full bg-primary/50 rounded animate-pulse w-2/3" />
          </div>
        </div>
      )}

      {result && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge
              variant={result.status === "success" ? "default" : "destructive"}
            >
              {result.status === "success" ? "Fixed" : "Failed"}
            </Badge>
            <span className="text-xs text-muted-foreground font-mono">
              {formatTime(result.durationMs)}
            </span>
            {result.filesChanged.length > 0 && (
              <span className="text-xs text-muted-foreground">
                {result.filesChanged.length} file
                {result.filesChanged.length !== 1 ? "s" : ""} changed
              </span>
            )}
          </div>

          {result.filesChanged.length > 0 && (
            <div className="text-xs space-y-0.5">
              {result.filesChanged.map((f, i) => (
                <div key={i} className="font-mono text-muted-foreground">
                  {f}
                </div>
              ))}
            </div>
          )}

          <CodeDiff diff={result.diff} />

          {result.status === "success" && result.previewPort > 0 && (
            <a
              href={`http://localhost:${result.previewPort}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              Open Live Preview (:{result.previewPort})
            </a>
          )}
        </div>
      )}
    </div>
  );
}

export function AgentBattle({
  issue,
  claude,
  codex,
  isRunning,
}: AgentBattleProps) {
  // Determine winner
  const bothDone = claude && codex;
  const claudeWins =
    bothDone &&
    claude.status === "success" &&
    (codex.status === "failed" || claude.durationMs < codex.durationMs);
  const codexWins =
    bothDone &&
    codex.status === "success" &&
    (claude.status === "failed" || codex.durationMs < claude.durationMs);

  return (
    <Card className="bg-card border-border animate-in fade-in slide-in-from-bottom-2 duration-500">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">
            <span className="text-muted-foreground font-mono text-sm mr-2">
              Issue:
            </span>
            {issue.description.slice(0, 80)}
            {issue.description.length > 80 ? "..." : ""}
          </CardTitle>
          {bothDone && (
            <Badge variant="outline" className="text-xs">
              {claudeWins
                ? "Claude wins"
                : codexWins
                  ? "Codex wins"
                  : "Tie"}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4">
          <AgentColumn
            result={claude}
            agentName="Claude Code"
            color="bg-purple-500"
            isRunning={isRunning}
          />
          <div className="w-px bg-border shrink-0" />
          <AgentColumn
            result={codex}
            agentName="Codex"
            color="bg-green-500"
            isRunning={isRunning}
          />
        </div>
      </CardContent>
    </Card>
  );
}
