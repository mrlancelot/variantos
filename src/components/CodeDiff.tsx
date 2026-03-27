"use client";

import { useState } from "react";

interface CodeDiffProps {
  diff: string;
  maxHeight?: number;
}

export function CodeDiff({ diff, maxHeight = 300 }: CodeDiffProps) {
  const [expanded, setExpanded] = useState(false);

  if (!diff) {
    return (
      <div className="text-xs text-muted-foreground italic p-3 bg-muted/30 rounded">
        No changes
      </div>
    );
  }

  const lines = diff.split("\n");

  return (
    <div className="rounded border border-border overflow-hidden">
      <div
        className={`overflow-auto font-mono text-xs ${!expanded ? `max-h-[${maxHeight}px]` : ""}`}
        style={!expanded ? { maxHeight } : undefined}
      >
        <pre className="p-3 leading-relaxed">
          {lines.map((line, i) => {
            let className = "text-muted-foreground";
            if (line.startsWith("+") && !line.startsWith("+++")) {
              className = "text-green-400 bg-green-400/10";
            } else if (line.startsWith("-") && !line.startsWith("---")) {
              className = "text-red-400 bg-red-400/10";
            } else if (line.startsWith("@@")) {
              className = "text-blue-400";
            } else if (line.startsWith("diff") || line.startsWith("Only")) {
              className = "text-purple-400 font-semibold";
            }
            return (
              <div key={i} className={className}>
                {line}
              </div>
            );
          })}
        </pre>
      </div>
      {lines.length > 15 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground border-t border-border bg-muted/30 transition-colors"
        >
          {expanded ? "Collapse" : `Show all ${lines.length} lines`}
        </button>
      )}
    </div>
  );
}
