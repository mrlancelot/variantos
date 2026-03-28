"use client";

import { useState } from "react";

interface CodeDiffProps {
  diff: string;
}

export function CodeDiff({ diff }: CodeDiffProps) {
  const [expanded, setExpanded] = useState(false);

  if (!diff) {
    return (
      <div className="text-xs text-neutral-600 font-mono py-2">
        no changes
      </div>
    );
  }

  const lines = diff.split("\n");
  const additions = lines.filter(
    (l) => l.startsWith("+") && !l.startsWith("+++")
  ).length;
  const deletions = lines.filter(
    (l) => l.startsWith("-") && !l.startsWith("---")
  ).length;

  // Extract file paths from diff headers
  const fileHeaders = lines
    .filter((l) => l.startsWith("diff ") || l.startsWith("--- ") || l.startsWith("+++ "))
    .filter((l) => l.startsWith("+++ "))
    .map((l) => {
      const parts = l.replace("+++ ", "").split("/");
      return parts.slice(-2).join("/");
    });

  return (
    <div className="rounded border border-neutral-800 overflow-hidden">
      {/* Header */}
      <div className="px-3 py-1.5 bg-neutral-900/80 border-b border-neutral-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {fileHeaders[0] && (
            <span className="font-mono text-xs text-neutral-400">
              {fileHeaders[0]}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-green-600">+{additions}</span>
          <span className="font-mono text-xs text-red-600">-{deletions}</span>
        </div>
      </div>

      {/* Diff content */}
      <div
        className="overflow-auto font-mono text-xs"
        style={!expanded ? { maxHeight: 200 } : undefined}
      >
        <div className="p-2 leading-relaxed">
          {lines.map((line, i) => {
            let className = "text-neutral-600";
            if (line.startsWith("+") && !line.startsWith("+++")) {
              className = "text-green-500/80 bg-green-500/5";
            } else if (line.startsWith("-") && !line.startsWith("---")) {
              className = "text-red-500/80 bg-red-500/5";
            } else if (line.startsWith("@@")) {
              className = "text-neutral-500";
            } else if (
              line.startsWith("diff") ||
              line.startsWith("---") ||
              line.startsWith("+++")
            ) {
              className = "text-neutral-500 font-medium";
            }
            return (
              <div key={i} className={`px-1 ${className}`}>
                <span className="inline-block w-8 text-right text-neutral-700 mr-2 select-none">
                  {i + 1}
                </span>
                {line}
              </div>
            );
          })}
        </div>
      </div>

      {lines.length > 12 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full px-3 py-1.5 text-xs text-neutral-600 hover:text-neutral-400 border-t border-neutral-800 bg-neutral-900/50 transition-colors"
        >
          {expanded ? "collapse" : `show all ${lines.length} lines`}
        </button>
      )}
    </div>
  );
}
