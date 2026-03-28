"use client";

interface BrowserLiveViewProps {
  liveUrl: string | null;
  isExploring: boolean;
}

export function BrowserLiveView({ liveUrl, isExploring }: BrowserLiveViewProps) {
  if (!liveUrl) {
    return (
      <div className="w-full h-[400px] rounded-lg border border-border bg-card flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          {isExploring ? (
            <div className="space-y-3">
              <div className="animate-spin inline-block w-8 h-8 border-2 border-muted-foreground border-t-transparent rounded-full" />
              <p className="text-sm">Browser agent is exploring the app...</p>
            </div>
          ) : (
            <p className="text-sm">Browser agent will appear here</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full rounded-lg border border-border overflow-hidden">
      <div className="bg-card px-3 py-2 border-b border-border flex items-center gap-2">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500/70" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
          <div className="w-3 h-3 rounded-full bg-green-500/70" />
        </div>
        <span className="text-xs text-muted-foreground ml-2 font-mono">
          Browser Use — Live View
        </span>
        {isExploring && (
          <span className="ml-auto flex items-center gap-1.5 text-xs text-green-400">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            LIVE
          </span>
        )}
        <a
          href={liveUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Open in new tab
        </a>
      </div>
      <iframe
        src={liveUrl}
        className="w-full h-[400px] bg-black"
        allow="clipboard-read; clipboard-write"
        title="Browser Use Live View"
      />
    </div>
  );
}
