"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { BrowserLiveView } from "@/components/BrowserLiveView";
import { IssueCard } from "@/components/IssueCard";
import { AgentBattle } from "@/components/AgentBattle";
import { Scoreboard } from "@/components/Scoreboard";
import { ProgressTimeline } from "@/components/ProgressTimeline";
import { ApplyVerifyFlow } from "@/components/ApplyVerifyFlow";
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

interface ApplyState {
  issueId: string;
  agent: "claude" | "codex";
  steps: { type: string; data: Record<string, unknown> }[];
  verifyLiveUrl: string | null;
  bugFixed: boolean | null;
  evidence: string | null;
}

export default function ScanPage() {
  const params = useParams();
  const sessionId = params.sessionId as string;

  const [issues, setIssues] = useState<Issue[]>([]);
  const [battles, setBattles] = useState<BattleResult[]>([]);
  const [activities, setActivities] = useState<Record<string, AgentActivity[]>>({});
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
  const [applyStates, setApplyStates] = useState<Record<string, ApplyState>>({});
  const [scanData, setScanData] = useState<{ repoUrl: string; liveUrl: string }>({ repoUrl: "", liveUrl: "" });
  const startedRef = useRef(false);

  const markCompleted = useCallback((...types: ScanEventType[]) => {
    setCompletedEvents((prev) => [...new Set<ScanEventType>([...prev, ...types])]);
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
          if (event.data.liveUrl) setBrowserLiveUrl(event.data.liveUrl as string);
          break;
        case "browser-exploring":
          setIsExploring(true);
          markCompleted("cloning", "installing", "server-started");
          break;
        case "issue-found":
          setIsExploring(false);
          markCompleted("browser-exploring", "issue-found");
          setIssues((prev) => [...prev, event.data.issue as Issue]);
          break;
        case "agents-started":
          markCompleted("issue-found");
          setBattles((prev) => [...prev, { issue: event.data.issue as Issue, isRunning: true }]);
          break;
        case "agent-progress": {
          const activity = event.data.activity as AgentActivity;
          if (activity) {
            const key = `${activity.agent}-${activity.issueId}`;
            setActivities((prev) => ({ ...prev, [key]: [...(prev[key] || []), activity] }));
          }
          break;
        }
        case "agent-complete": {
          const issueId = event.data.issueId as string;
          setBattles((prev) =>
            prev.map((b) =>
              b.issue.id === issueId
                ? { ...b, claude: event.data.claude as AgentResult, codex: event.data.codex as AgentResult, isRunning: false }
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
            setSummary(event.data.summary as typeof summary);
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
    setScanData({ repoUrl, liveUrl });

    const startScan = async () => {
      try {
        const res = await fetch("/api/scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ repoUrl, goal, liveUrl }),
        });

        if (!res.ok || !res.body) { setError("Failed to start scan"); return; }

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
            const dataLine = chunk.split("\n").find((l) => l.startsWith("data: "));
            if (dataLine) {
              try { processEvent(JSON.parse(dataLine.slice(6)) as ScanEvent); } catch {}
            }
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Scan failed");
      }
    };

    startScan();
  }, [sessionId, processEvent]);

  const handleSelectFix = async (issueId: string, agent: "claude" | "codex") => {
    const battle = battles.find((b) => b.issue.id === issueId);
    if (!battle) return;

    const result = agent === "claude" ? battle.claude : battle.codex;
    if (!result) return;

    const method = window.confirm("Push directly to main?\n\nOK = Push to main\nCancel = Open PR") ? "main" : "pr";

    setApplyStates((prev) => ({
      ...prev,
      [issueId]: { issueId, agent, steps: [], verifyLiveUrl: null, bugFixed: null, evidence: null },
    }));

    try {
      const res = await fetch("/api/apply-fix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          issueId,
          agent,
          repoUrl: scanData.repoUrl,
          method,
          issueDescription: battle.issue.description,
          filesChanged: result.filesChanged,
          issue: battle.issue,
          liveUrl: scanData.liveUrl,
        }),
      });

      if (!res.ok || !res.body) return;

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
          const dataLine = chunk.split("\n").find((l) => l.startsWith("data: "));
          if (dataLine) {
            try {
              const event = JSON.parse(dataLine.slice(6)) as ScanEvent;
              setApplyStates((prev) => {
                const current = prev[issueId];
                if (!current) return prev;

                const updated = { ...current };
                updated.steps = [...updated.steps, { type: event.type, data: event.data }];

                if (event.type === "verify-started" && event.data.liveUrl) {
                  updated.verifyLiveUrl = event.data.liveUrl as string;
                }
                if (event.type === "verify-complete") {
                  updated.bugFixed = event.data.bugFixed as boolean;
                  updated.evidence = event.data.evidence as string;
                }
                return { ...prev, [issueId]: updated };
              });
            } catch {}
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Apply failed");
    }
  };

  return (
    <main className="min-h-screen p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <a href="/" className="text-lg font-bold tracking-tight text-white hover:text-neutral-300 transition-colors">
          variantOS
        </a>
        {!isComplete && !error && <span className="font-mono text-xs text-neutral-500">scanning...</span>}
        {isComplete && <span className="font-mono text-xs text-neutral-400">complete</span>}
      </div>

      {error && (
        <div className="p-4 rounded-lg border border-red-500/20 bg-red-500/5 text-red-400 text-sm mb-6">{error}</div>
      )}

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 md:col-span-3">
          <div className="md:sticky md:top-6">
            <ProgressTimeline completedEvents={completedEvents} currentEvent={currentEvent} />
          </div>
        </div>

        <div className="col-span-12 md:col-span-9 space-y-6">
          <section>
            <h2 className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-3">Browser Agent</h2>
            <BrowserLiveView liveUrl={browserLiveUrl} isExploring={isExploring} />
          </section>

          {issues.length > 0 && (
            <section>
              <h2 className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-3">Issues ({issues.length})</h2>
              <div className="grid grid-cols-1 gap-2">
                {issues.map((issue, i) => (
                  <IssueCard key={issue.id} issue={issue} index={i} />
                ))}
              </div>
            </section>
          )}

          {battles.length > 0 && (
            <section>
              <h2 className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-3">Agent Battle</h2>
              <div className="space-y-4">
                {battles.map((battle) => {
                  const claudeKey = `claude-${battle.issue.id}`;
                  const codexKey = `codex-${battle.issue.id}`;
                  const applyState = applyStates[battle.issue.id];
                  return (
                    <div key={battle.issue.id} className="space-y-3">
                      <AgentBattle
                        issue={battle.issue}
                        claude={battle.claude}
                        codex={battle.codex}
                        claudeActivities={activities[claudeKey] || []}
                        codexActivities={activities[codexKey] || []}
                        isRunning={battle.isRunning}
                        onSelectFix={!applyState ? handleSelectFix : undefined}
                        applied={!!applyState}
                      />
                      {applyState && (
                        <ApplyVerifyFlow
                          steps={applyState.steps}
                          verifyLiveUrl={applyState.verifyLiveUrl}
                          bugFixed={applyState.bugFixed}
                          evidence={applyState.evidence}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {summary && <Scoreboard summary={summary} />}
        </div>
      </div>
    </main>
  );
}
