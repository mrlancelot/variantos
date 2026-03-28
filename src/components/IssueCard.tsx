"use client";

import { useState } from "react";
import { Issue } from "@/lib/types";

interface IssueCardProps {
  issue: Issue;
  index: number;
}

const severityBorder: Record<string, string> = {
  high: "border-l-red-500/60",
  medium: "border-l-yellow-500/60",
  low: "border-l-blue-500/60",
};

export function IssueCard({ issue, index }: IssueCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={`border-l-2 ${severityBorder[issue.severity]} bg-neutral-900/50 border border-neutral-800 border-l-2 rounded-lg p-4 cursor-pointer hover:bg-neutral-900 transition-colors`}
      onClick={() => setExpanded(!expanded)}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="flex items-start gap-3">
        <span className="font-mono text-xs text-neutral-600 mt-0.5">
          {index + 1}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-neutral-500 uppercase tracking-wider">
              {issue.severity} {issue.type}
            </span>
          </div>
          <p className={`text-sm text-neutral-300 leading-relaxed ${!expanded ? "line-clamp-2" : ""}`}>
            {issue.description}
          </p>
          {expanded && issue.stepsToReproduce && (
            <div className="mt-3 pt-3 border-t border-neutral-800">
              <p className="text-xs text-neutral-500 uppercase tracking-wider mb-2">
                Steps to reproduce
              </p>
              <pre className="text-xs text-neutral-400 whitespace-pre-wrap font-mono leading-relaxed">
                {issue.stepsToReproduce}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
