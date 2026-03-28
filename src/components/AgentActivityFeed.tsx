"use client";

import { useEffect, useRef } from "react";
import { AgentActivity } from "@/lib/types";

interface AgentActivityFeedProps {
  activities: AgentActivity[];
  isRunning: boolean;
}

const actionIcons: Record<string, string> = {
  thinking: "~",
  reading: ">",
  editing: "*",
  running: "$",
  done: "#",
};

const actionColors: Record<string, string> = {
  thinking: "text-neutral-500",
  reading: "text-neutral-400",
  editing: "text-white",
  running: "text-neutral-400",
  done: "text-white",
};

export function AgentActivityFeed({
  activities,
  isRunning,
}: AgentActivityFeedProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activities]);

  if (activities.length === 0 && isRunning) {
    return (
      <div className="font-mono text-xs text-neutral-600 py-3">
        <span className="animate-pulse">Initializing...</span>
      </div>
    );
  }

  return (
    <div
      ref={scrollRef}
      className="max-h-[160px] overflow-y-auto font-mono text-xs leading-relaxed"
    >
      {activities.map((activity, i) => (
        <div
          key={i}
          className={`flex items-start gap-2 py-0.5 ${actionColors[activity.action]}`}
          style={{ animationDelay: `${i * 50}ms` }}
        >
          <span className="text-neutral-600 shrink-0 w-4 text-right">
            {actionIcons[activity.action]}
          </span>
          <span className="truncate">{activity.detail}</span>
        </div>
      ))}
      {isRunning && activities.length > 0 && (
        <div className="flex items-start gap-2 py-0.5 text-neutral-600">
          <span className="shrink-0 w-4 text-right animate-pulse">_</span>
        </div>
      )}
    </div>
  );
}
