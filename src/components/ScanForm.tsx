"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ScanFormProps {
  onSubmit: (repoUrl: string, goal: string) => void;
  isLoading: boolean;
}

export function ScanForm({ onSubmit, isLoading }: ScanFormProps) {
  const [repoUrl, setRepoUrl] = useState("");
  const [goal, setGoal] = useState("");

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium text-muted-foreground">
          GitHub Repository URL
        </label>
        <Input
          placeholder="https://github.com/user/repo"
          value={repoUrl}
          onChange={(e) => setRepoUrl(e.target.value)}
          disabled={isLoading}
          className="h-12 text-base bg-card border-border"
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-muted-foreground">
          Focus Area{" "}
          <span className="text-muted-foreground/50">(optional)</span>
        </label>
        <Input
          placeholder="e.g., test the checkout flow, find accessibility issues..."
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          disabled={isLoading}
          className="h-12 text-base bg-card border-border"
        />
      </div>
      <Button
        onClick={() => onSubmit(repoUrl, goal)}
        disabled={!repoUrl || isLoading}
        className="w-full h-12 text-base font-semibold"
        size="lg"
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <span className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
            Running Scan...
          </span>
        ) : (
          "Launch Scan"
        )}
      </Button>
    </div>
  );
}
