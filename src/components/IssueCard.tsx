"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Issue } from "@/lib/types";

interface IssueCardProps {
  issue: Issue;
  index: number;
}

const severityColors: Record<string, string> = {
  high: "bg-red-500/20 text-red-400 border-red-500/30",
  medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  low: "bg-blue-500/20 text-blue-400 border-blue-500/30",
};

const typeLabels: Record<string, string> = {
  bug: "Bug",
  ux: "UX Issue",
  accessibility: "A11y",
  performance: "Perf",
};

export function IssueCard({ issue, index }: IssueCardProps) {
  return (
    <Card className="bg-card border-border animate-in fade-in slide-in-from-bottom-2 duration-300">
      <CardContent className="p-4 space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-muted-foreground">
            #{index + 1}
          </span>
          <Badge
            variant="outline"
            className={severityColors[issue.severity] || ""}
          >
            {issue.severity}
          </Badge>
          <Badge variant="secondary" className="text-xs">
            {typeLabels[issue.type] || issue.type}
          </Badge>
        </div>
        <p className="text-sm font-medium leading-snug">{issue.description}</p>
        {issue.element && (
          <p className="text-xs text-muted-foreground font-mono">
            Element: {issue.element}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
