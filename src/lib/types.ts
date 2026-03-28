export interface Issue {
  id: string;
  type: "bug" | "ux" | "accessibility" | "performance";
  description: string;
  severity: "high" | "medium" | "low";
  stepsToReproduce: string;
  element?: string;
}

export interface AgentResult {
  agent: "claude" | "codex";
  issueId: string;
  status: "success" | "failed";
  diff: string;
  filesChanged: string[];
  durationMs: number;
  previewPort: number;
}

export interface AgentActivity {
  agent: "claude" | "codex";
  issueId: string;
  action: "thinking" | "reading" | "editing" | "running" | "done";
  detail: string;
  timestamp: number;
}

export type ScanEventType =
  | "cloning"
  | "installing"
  | "server-started"
  | "tunnel-ready"
  | "browser-session-created"
  | "browser-exploring"
  | "issue-found"
  | "agents-started"
  | "agent-progress"
  | "agent-complete"
  | "preview-ready"
  | "scan-complete"
  | "error";

export interface ScanEvent {
  type: ScanEventType;
  data: Record<string, unknown>;
  timestamp: number;
}

export interface ScanRequest {
  repoUrl: string;
  goal?: string;
  liveUrl?: string; // Optional: public URL for Browser Use (skips tunnel)
}
