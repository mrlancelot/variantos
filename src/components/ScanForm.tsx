"use client";

import { useState } from "react";

interface ScanFormProps {
  onSubmit: (repoUrl: string, goal: string, liveUrl: string) => void;
  isLoading: boolean;
}

export function ScanForm({ onSubmit, isLoading }: ScanFormProps) {
  const [repoUrl, setRepoUrl] = useState("");
  const [goal, setGoal] = useState("");
  const [liveUrl, setLiveUrl] = useState("");

  const isValidUrl = repoUrl.startsWith("https://github.com/");

  return (
    <div className="w-full max-w-lg mx-auto space-y-3">
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
          Repository
        </label>
        <input
          placeholder="https://github.com/owner/repo"
          value={repoUrl}
          onChange={(e) => setRepoUrl(e.target.value)}
          disabled={isLoading}
          className="w-full h-11 px-3 text-sm bg-neutral-900 border border-neutral-800 rounded-lg text-white placeholder:text-neutral-600 focus:outline-none focus:border-neutral-600 transition-colors disabled:opacity-40"
        />
        {repoUrl && !isValidUrl && (
          <p className="text-xs text-red-400/70">
            Enter a GitHub URL (https://github.com/...)
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
          Live URL{" "}
          <span className="text-neutral-600 normal-case">(deployed app for testing)</span>
        </label>
        <input
          placeholder="https://user.github.io/repo"
          value={liveUrl}
          onChange={(e) => setLiveUrl(e.target.value)}
          disabled={isLoading}
          className="w-full h-11 px-3 text-sm bg-neutral-900 border border-neutral-800 rounded-lg text-white placeholder:text-neutral-600 focus:outline-none focus:border-neutral-600 transition-colors disabled:opacity-40"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
          Focus <span className="text-neutral-600 normal-case">(optional)</span>
        </label>
        <input
          placeholder="e.g., test the checkout flow"
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          disabled={isLoading}
          className="w-full h-11 px-3 text-sm bg-neutral-900 border border-neutral-800 rounded-lg text-white placeholder:text-neutral-600 focus:outline-none focus:border-neutral-600 transition-colors disabled:opacity-40"
        />
      </div>

      <button
        onClick={() => onSubmit(repoUrl, goal, liveUrl)}
        disabled={!isValidUrl || isLoading}
        className="w-full h-11 text-sm font-medium bg-white text-black rounded-lg hover:bg-neutral-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed mt-2"
      >
        {isLoading ? "Starting..." : "Launch Scan"}
      </button>

      <p className="text-xs text-neutral-600 text-center pt-1">
        Usually takes 2-3 minutes
      </p>
    </div>
  );
}
