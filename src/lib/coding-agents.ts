import { spawn } from "child_process";
import { AgentResult } from "./types";
import { getDiff, getChangedFiles } from "./sandbox";

export interface AgentProgressCallback {
  (agent: "claude" | "codex", message: string): void;
}

export function runClaudeCode(
  cwd: string,
  originalPath: string,
  issueId: string,
  issueDescription: string,
  previewPort: number,
  onProgress?: AgentProgressCallback
): Promise<AgentResult> {
  return new Promise((resolve) => {
    const startTime = Date.now();

    onProgress?.("claude", "Starting Claude Code...");

    const prompt = `You are fixing a bug in a web application. Here is the issue:

${issueDescription}

Fix this issue by modifying the appropriate source files. Make minimal, targeted changes. Do not refactor unrelated code. Do not add comments explaining your changes.`;

    const proc = spawn(
      "claude",
      [
        "-p", prompt,
        "--output-format", "json",
        "--max-turns", "15",
        "--dangerously-skip-permissions",
        "--allowedTools", "Read", "Write", "Edit", "Bash", "Glob", "Grep",
      ],
      {
        cwd,
        stdio: "pipe",
        env: { ...process.env },
      }
    );

    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (data) => {
      stdout += data.toString();
      onProgress?.("claude", "Working on fix...");
    });

    proc.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    proc.on("close", async (code) => {
      const durationMs = Date.now() - startTime;

      try {
        const diff = await getDiff(originalPath, cwd);
        const filesChanged = await getChangedFiles(originalPath, cwd);

        resolve({
          agent: "claude",
          issueId,
          status: code === 0 && diff.length > 0 ? "success" : "failed",
          diff,
          filesChanged,
          durationMs,
          previewPort,
        });
      } catch {
        resolve({
          agent: "claude",
          issueId,
          status: "failed",
          diff: "",
          filesChanged: [],
          durationMs,
          previewPort,
        });
      }
    });

    proc.on("error", () => {
      resolve({
        agent: "claude",
        issueId,
        status: "failed",
        diff: "",
        filesChanged: [],
        durationMs: Date.now() - startTime,
        previewPort,
      });
    });
  });
}

export function runCodex(
  cwd: string,
  originalPath: string,
  issueId: string,
  issueDescription: string,
  previewPort: number,
  onProgress?: AgentProgressCallback
): Promise<AgentResult> {
  return new Promise((resolve) => {
    const startTime = Date.now();

    onProgress?.("codex", "Starting Codex...");

    const prompt = `Fix this issue in the codebase: ${issueDescription}. Make minimal, targeted changes. Do not refactor unrelated code.`;

    const proc = spawn(
      "codex",
      ["exec", "--full-auto", "--sandbox", "workspace-write", prompt],
      {
        cwd,
        stdio: "pipe",
        env: { ...process.env },
      }
    );

    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (data) => {
      stdout += data.toString();
      onProgress?.("codex", "Working on fix...");
    });

    proc.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    proc.on("close", async (code) => {
      const durationMs = Date.now() - startTime;

      try {
        const diff = await getDiff(originalPath, cwd);
        const filesChanged = await getChangedFiles(originalPath, cwd);

        resolve({
          agent: "codex",
          issueId,
          status: code === 0 && diff.length > 0 ? "success" : "failed",
          diff,
          filesChanged,
          durationMs,
          previewPort,
        });
      } catch {
        resolve({
          agent: "codex",
          issueId,
          status: "failed",
          diff: "",
          filesChanged: [],
          durationMs,
          previewPort,
        });
      }
    });

    proc.on("error", () => {
      resolve({
        agent: "codex",
        issueId,
        status: "failed",
        diff: "",
        filesChanged: [],
        durationMs: Date.now() - startTime,
        previewPort,
      });
    });
  });
}
