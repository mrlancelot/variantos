export interface Issue {
  id: string;
  type: "bug" | "ux" | "accessibility" | "performance";
  description: string;
  severity: "high" | "medium" | "low";
  stepsToReproduce: string;
  element?: string | null;
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

export interface ApplyResult {
  branch: string;
  prUrl?: string;
  commitSha: string;
}

export interface VerificationResult {
  bugFixed: boolean;
  evidence: string;
  liveUrl: string;
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
  | "apply-copying"
  | "apply-committing"
  | "apply-pr"
  | "apply-building"
  | "apply-deploying"
  | "deploy-polling"
  | "deploy-complete"
  | "verify-started"
  | "verify-complete"
  | "error";

export interface ScanEvent {
  type: ScanEventType;
  data: Record<string, unknown>;
  timestamp: number;
}

export interface ScanRequest {
  repoUrl: string;
  goal?: string;
  liveUrl?: string;
}
