"use client";

import { ScanEventType } from "@/lib/types";

interface Step {
  type: ScanEventType;
  label: string;
  status: "pending" | "active" | "done";
}

interface ProgressTimelineProps {
  completedEvents: ScanEventType[];
  currentEvent: ScanEventType | null;
}

const STEPS: { type: ScanEventType; label: string }[] = [
  { type: "cloning", label: "Clone Repository" },
  { type: "installing", label: "Install Dependencies" },
  { type: "server-started", label: "Start Dev Server" },
  { type: "browser-exploring", label: "Browser Agent Exploring" },
  { type: "issue-found", label: "Issues Identified" },
  { type: "agents-started", label: "AI Agents Racing" },
  { type: "scan-complete", label: "Scan Complete" },
];

export function ProgressTimeline({
  completedEvents,
  currentEvent,
}: ProgressTimelineProps) {
  const steps: Step[] = STEPS.map((step) => {
    const isDone = completedEvents.includes(step.type);
    const isActive = currentEvent === step.type;
    return {
      ...step,
      status: isDone ? "done" : isActive ? "active" : "pending",
    };
  });

  return (
    <div className="space-y-1">
      {steps.map((step, i) => (
        <div key={step.type} className="flex items-center gap-3">
          <div className="flex flex-col items-center">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono border ${
                step.status === "done"
                  ? "bg-primary text-primary-foreground border-primary"
                  : step.status === "active"
                    ? "border-primary text-primary animate-pulse"
                    : "border-border text-muted-foreground"
              }`}
            >
              {step.status === "done" ? (
                <svg
                  className="w-3 h-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              ) : (
                i + 1
              )}
            </div>
            {i < steps.length - 1 && (
              <div
                className={`w-px h-4 ${step.status === "done" ? "bg-primary" : "bg-border"}`}
              />
            )}
          </div>
          <span
            className={`text-sm ${
              step.status === "done"
                ? "text-foreground"
                : step.status === "active"
                  ? "text-foreground font-medium"
                  : "text-muted-foreground"
            }`}
          >
            {step.label}
            {step.status === "active" && (
              <span className="ml-2 text-xs text-muted-foreground animate-pulse">
                in progress...
              </span>
            )}
          </span>
        </div>
      ))}
    </div>
  );
}
