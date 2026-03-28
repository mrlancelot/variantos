"use client";

import { useEffect, useState } from "react";
import { ScanEventType } from "@/lib/types";

interface ProgressTimelineProps {
  completedEvents: ScanEventType[];
  currentEvent: ScanEventType | null;
}

const STEPS: { type: ScanEventType; label: string }[] = [
  { type: "cloning", label: "Clone repo" },
  { type: "installing", label: "Install deps" },
  { type: "server-started", label: "Setup" },
  { type: "browser-exploring", label: "Find bugs" },
  { type: "issue-found", label: "Issues found" },
  { type: "agents-started", label: "Agents racing" },
  { type: "scan-complete", label: "Complete" },
];

export function ProgressTimeline({
  completedEvents,
  currentEvent,
}: ProgressTimelineProps) {
  const [elapsed, setElapsed] = useState(0);
  const [startTime] = useState(Date.now());
  const isComplete = completedEvents.includes("scan-complete");

  useEffect(() => {
    if (isComplete) return;
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [isComplete, startTime]);

  const formatElapsed = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
  };

  return (
    <div className="space-y-3">
      <div className="font-mono text-xs text-neutral-500">
        {isComplete ? "done" : formatElapsed(elapsed)}
      </div>
      <div className="space-y-0.5">
        {STEPS.map((step) => {
          const isDone = completedEvents.includes(step.type);
          const isActive = currentEvent === step.type;
          // Hide future steps
          if (!isDone && !isActive) return null;

          return (
            <div
              key={step.type}
              className={`flex items-center gap-2 py-1 text-xs font-mono ${
                isDone
                  ? "text-neutral-400"
                  : isActive
                    ? "text-white"
                    : "text-neutral-700"
              }`}
            >
              <span className="w-4 text-center text-neutral-600">
                {isDone ? "#" : isActive ? ">" : " "}
              </span>
              <span>{step.label}</span>
              {isActive && !isDone && (
                <span className="animate-pulse text-neutral-600">...</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
