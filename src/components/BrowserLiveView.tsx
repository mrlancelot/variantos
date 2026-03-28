"use client";

import { useState } from "react";

interface BrowserLiveViewProps {
  liveUrl: string | null;
  isExploring: boolean;
}

export function BrowserLiveView({
  liveUrl,
  isExploring,
}: BrowserLiveViewProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  if (!liveUrl) {
    return (
      <div className="w-full h-[360px] rounded-lg border border-neutral-800 bg-neutral-900/50 flex items-center justify-center">
        <div className="text-center text-neutral-600">
          {isExploring ? (
            <div className="space-y-2">
              <div className="font-mono text-xs animate-pulse">
                browsing...
              </div>
            </div>
          ) : (
            <div className="font-mono text-xs">waiting for browser agent</div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`w-full rounded-lg border border-neutral-800 overflow-hidden ${isFullscreen ? "fixed inset-4 z-50" : ""}`}
    >
      <div className="bg-neutral-900 px-3 py-2 border-b border-neutral-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-neutral-500">
            browser-use
          </span>
          {isExploring && (
            <span className="flex items-center gap-1.5 text-xs text-green-500">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              live
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <a
            href={liveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-neutral-600 hover:text-neutral-400 transition-colors"
          >
            open
          </a>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="text-xs text-neutral-600 hover:text-neutral-400 transition-colors"
          >
            {isFullscreen ? "exit" : "expand"}
          </button>
        </div>
      </div>
      <iframe
        src={liveUrl}
        className={`w-full bg-neutral-950 ${isFullscreen ? "h-[calc(100%-36px)]" : "h-[360px]"}`}
        allow="clipboard-read; clipboard-write"
        title="Browser Use Live View"
      />
      {isFullscreen && (
        <div
          className="fixed inset-0 bg-black/60 -z-10"
          onClick={() => setIsFullscreen(false)}
        />
      )}
    </div>
  );
}
