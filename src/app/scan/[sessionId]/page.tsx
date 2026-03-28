"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { BrowserLiveView } from "@/components/BrowserLiveView";
import { IssueCard } from "@/components/IssueCard";
import { AgentBattle } from "@/components/AgentBattle";
import { Scoreboard } from "@/components/Scoreboard";
import { ProgressTimeline } from "@/components/ProgressTimeline";
import {
  ScanEvent,
  ScanEventType,
  Issue,
  AgentResult,
  AgentActivity,
} from "@/lib/types";

interface BattleResult {
  issue: Issue;
  claude?: AgentResult;
  codex?: AgentResult;
  isRunning: boolean;
}

export default function ScanPage() {
  const params = useParams();
  const sessionId = params.sessionId as string;

  const [issues, setIssues] = useState<Issue[]>([]);
  const [battles, setBattles] = useState<BattleResult[]>([]);
  const [activities, setActivities] = useState<Record<string, AgentActivity[]>>(
    {}
  );
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

  const markCompleted = useCallback((...types: ScanEventType[]) => {
    setCompletedEvents((prev) => [
      ...new Set<ScanEventType>([...prev, ...types]),
    ]);
  }, []);

  const processEvent = useCallback(
    (event: ScanEvent) => {
      setCurrentEvent(event.type);

      switch (event.type) {
        case "cloning":
        case "installing":
          break;

        case "server-started":
          markCompleted("cloning", "installing", "server-started");
          break;

        case "browser-session-created":
          if (event.data.liveUrl) {
            setBrowserLiveUrl(event.data.liveUrl as string);
          }
          break;

        case "browser-exploring":
          setIsExploring(true);
          markCompleted("cloning", "installing", "server-started");
          break;

        case "issue-found":
          setIsExploring(false);
          markCompleted("browser-exploring", "issue-found");
          const issue = event.data.issue as Issue;
          setIssues((prev) => [...prev, issue]);
          break;

        case "agents-started": {
          markCompleted("issue-found");
          const battleIssue = event.data.issue as Issue;
          setBattles((prev) => [
            ...prev,
            { issue: battleIssue, isRunning: true },
          ]);
          break;
        }

        case "agent-progress": {
          const activity = event.data.activity as AgentActivity;
          if (activity) {
            const key = `${activity.agent}-${activity.issueId}`;
            setActivities((prev) => ({
              ...prev,
              [key]: [...(prev[key] || []), activity],
            }));
          }
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
          markCompleted("agents-started", "scan-complete");
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
    },
    [markCompleted]
  );

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const stored = sessionStorage.getItem(`scan-${sessionId}`);
    if (!stored) {
      setError("No scan parameters found. Go back to the home page.");
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
          const lines = buffer.split("\n\n");
          buffer = lines.pop() || "";

          for (const chunk of lines) {
            const dataLine = chunk
              .split("\n")
              .find((l) => l.startsWith("data: "));
            if (dataLine) {
              try {
                const event = JSON.parse(dataLine.slice(6)) as ScanEvent;
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
    <main className="min-h-screen p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <a
          href="/"
          className="text-lg font-bold tracking-tight text-white hover:text-neutral-300 transition-colors"
        >
          variantOS
        </a>
        {!isComplete && !error && (
          <span className="font-mono text-xs text-neutral-500">
            scanning...
          </span>
        )}
        {isComplete && (
          <span className="font-mono text-xs text-neutral-400">complete</span>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-lg border border-red-500/20 bg-red-500/5 text-red-400 text-sm mb-6">
          {error}
        </div>
      )}

      <div className="grid grid-cols-12 gap-6">
        {/* Sidebar */}
        <div className="col-span-12 md:col-span-3">
          <div className="md:sticky md:top-6">
            <ProgressTimeline
              completedEvents={completedEvents}
              currentEvent={currentEvent}
            />
          </div>
        </div>

        {/* Main */}
        <div className="col-span-12 md:col-span-9 space-y-6">
          {/* Browser */}
          <section>
            <h2 className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-3">
              Browser Agent
            </h2>
            <BrowserLiveView
              liveUrl={browserLiveUrl}
              isExploring={isExploring}
            />
          </section>

          {/* Issues */}
          {issues.length > 0 && (
            <section>
              <h2 className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-3">
                Issues ({issues.length})
              </h2>
              <div className="grid grid-cols-1 gap-2">
                {issues.map((issue, i) => (
                  <IssueCard key={issue.id} issue={issue} index={i} />
                ))}
              </div>
            </section>
          )}

          {/* Battles */}
          {battles.length > 0 && (
            <section>
              <h2 className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-3">
                Agent Battle
              </h2>
              <div className="space-y-4">
                {battles.map((battle) => {
                  const claudeKey = `claude-${battle.issue.id}`;
                  const codexKey = `codex-${battle.issue.id}`;
                  return (
                    <AgentBattle
                      key={battle.issue.id}
                      issue={battle.issue}
                      claude={battle.claude}
                      codex={battle.codex}
                      claudeActivities={activities[claudeKey] || []}
                      codexActivities={activities[codexKey] || []}
                      isRunning={battle.isRunning}
                    />
                  );
                })}
              </div>
            </section>
          )}

          {/* Scoreboard */}
          {summary && <Scoreboard summary={summary} />}
        </div>
      </div>
    </main>
  );
}
