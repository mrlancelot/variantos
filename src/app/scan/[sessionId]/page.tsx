"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { BrowserLiveView } from "@/components/BrowserLiveView";
import { IssueCard } from "@/components/IssueCard";
import { AgentBattle } from "@/components/AgentBattle";
import { Scoreboard } from "@/components/Scoreboard";
import { ProgressTimeline } from "@/components/ProgressTimeline";
import { ScanEvent, ScanEventType, Issue, AgentResult } from "@/lib/types";

interface BattleResult {
  issue: Issue;
  claude?: AgentResult;
  codex?: AgentResult;
  isRunning: boolean;
}

export default function ScanPage() {
  const params = useParams();
  const sessionId = params.sessionId as string;

  const [events, setEvents] = useState<ScanEvent[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [battles, setBattles] = useState<BattleResult[]>([]);
  const [browserLiveUrl, setBrowserLiveUrl] = useState<string | null>(null);
  const [isExploring, setIsExploring] = useState(false);
  const [completedEvents, setCompletedEvents] = useState<ScanEventType[]>([]);
  const [currentEvent, setCurrentEvent] = useState<ScanEventType | null>(null);
  const [summary, setSummary] = useState<{
    claude: { fixed: number; total: number; avgTimeMs: number };
    codex: { fixed: number; total: number; avgTimeMs: number };
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const startedRef = useRef(false);

  const processEvent = useCallback((event: ScanEvent) => {
    setEvents((prev) => [...prev, event]);
    setCurrentEvent(event.type);

    switch (event.type) {
      case "cloning":
      case "installing":
      case "server-started":
      case "tunnel-ready":
        setCompletedEvents((prev) => {
          // Mark previous steps as done
          const allTypes: ScanEventType[] = [
            "cloning",
            "installing",
            "server-started",
            "tunnel-ready",
          ];
          const idx = allTypes.indexOf(event.type);
          const toAdd = allTypes.slice(0, idx);
          return [...new Set<ScanEventType>([...prev, ...toAdd])];
        });
        break;

      case "browser-session-created":
        if (event.data.liveUrl) {
          setBrowserLiveUrl(event.data.liveUrl as string);
        }
        break;

      case "browser-exploring":
        setIsExploring(true);
        setCompletedEvents((prev) => [
          ...new Set<ScanEventType>([
            ...prev,
            "cloning",
            "installing",
            "server-started",
            "tunnel-ready",
          ]),
        ]);
        break;

      case "issue-found":
        setIsExploring(false);
        setCompletedEvents((prev) => [
          ...new Set<ScanEventType>([...prev, "browser-exploring", "issue-found"]),
        ]);
        const issue = event.data.issue as Issue;
        setIssues((prev) => [...prev, issue]);
        break;

      case "agents-started": {
        setCompletedEvents((prev) => [
          ...new Set<ScanEventType>([...prev, "issue-found"]),
        ]);
        const battleIssue = event.data.issue as Issue;
        setBattles((prev) => [
          ...prev,
          { issue: battleIssue, isRunning: true },
        ]);
        break;
      }

      case "agent-complete": {
        const issueId = event.data.issueId as string;
        const claude = event.data.claude as AgentResult | undefined;
        const codex = event.data.codex as AgentResult | undefined;
        setBattles((prev) =>
          prev.map((b) =>
            b.issue.id === issueId
              ? { ...b, claude, codex, isRunning: false }
              : b
          )
        );
        break;
      }

      case "scan-complete":
        setIsComplete(true);
        setCompletedEvents((prev) => [
          ...new Set<ScanEventType>([...prev, "agents-started", "scan-complete"]),
        ]);
        setCurrentEvent(null);
        if (event.data.summary) {
          setSummary(
            event.data.summary as {
              claude: { fixed: number; total: number; avgTimeMs: number };
              codex: { fixed: number; total: number; avgTimeMs: number };
            }
          );
        }
        break;

      case "error":
        setError(event.data.message as string);
        break;
    }
  }, []);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const stored = sessionStorage.getItem(`scan-${sessionId}`);
    if (!stored) {
      setError("No scan parameters found. Please start from the home page.");
      return;
    }

    const { repoUrl, goal, liveUrl } = JSON.parse(stored);

    const startScan = async () => {
      try {
        const res = await fetch("/api/scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ repoUrl, goal, liveUrl }),
        });

        if (!res.ok || !res.body) {
          setError("Failed to start scan");
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // Parse SSE events from buffer
          const lines = buffer.split("\n\n");
          buffer = lines.pop() || "";

          for (const chunk of lines) {
            const dataLine = chunk
              .split("\n")
              .find((l) => l.startsWith("data: "));
            if (dataLine) {
              try {
                const event = JSON.parse(
                  dataLine.slice(6)
                ) as ScanEvent;
                processEvent(event);
              } catch {
                // Skip invalid JSON
              }
            }
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Scan failed");
      }
    };

    startScan();
  }, [sessionId, processEvent]);

  return (
    <main className="min-h-screen p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <a href="/" className="text-2xl font-bold tracking-tight">
            variant
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-green-400">
              OS
            </span>
          </a>
          {!isComplete && !error && (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
              <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
              Scanning...
            </span>
          )}
          {isComplete && (
            <span className="flex items-center gap-1.5 text-xs text-green-400 bg-green-400/10 px-2 py-1 rounded">
              <span className="w-2 h-2 rounded-full bg-green-400" />
              Complete
            </span>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 mb-6">
          {error}
        </div>
      )}

      <div className="grid grid-cols-12 gap-6">
        {/* Left sidebar — Progress */}
        <div className="col-span-3">
          <div className="sticky top-6 space-y-6">
            <div>
              <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
                Progress
              </h2>
              <ProgressTimeline
                completedEvents={completedEvents}
                currentEvent={currentEvent}
              />
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="col-span-9 space-y-6">
          {/* Browser Live View */}
          <div>
            <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
              Browser Agent
            </h2>
            <BrowserLiveView
              liveUrl={browserLiveUrl}
              isExploring={isExploring}
            />
          </div>

          {/* Issues */}
          {issues.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
                Issues Found ({issues.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {issues.map((issue, i) => (
                  <IssueCard key={issue.id} issue={issue} index={i} />
                ))}
              </div>
            </div>
          )}

          {/* Agent Battles */}
          {battles.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
                Agent Battle
              </h2>
              <div className="space-y-4">
                {battles.map((battle) => (
                  <AgentBattle
                    key={battle.issue.id}
                    issue={battle.issue}
                    claude={battle.claude}
                    codex={battle.codex}
                    isRunning={battle.isRunning}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Scoreboard */}
          {summary && <Scoreboard summary={summary} />}
        </div>
      </div>
    </main>
  );
}
