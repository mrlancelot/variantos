import { spawn } from "child_process";
import { AgentResult, AgentActivity, ScanEvent } from "./types";
import { getDiff, getChangedFiles } from "./sandbox";
import { createEvent } from "./events";

type EventPusher = (event: ScanEvent) => void;

function parseClaudeLine(
  line: string,
  issueId: string
): AgentActivity | null {
  try {
    const msg = JSON.parse(line);

    // Assistant message with tool_use
    if (msg.type === "assistant" && msg.message?.content) {
      for (const block of msg.message.content) {
        if (block.type === "tool_use") {
          const tool = block.name;
          const input = block.input || {};

          if (tool === "Read") {
            return {
              agent: "claude",
              issueId,
              action: "reading",
              detail: `Reading ${shortenPath(input.file_path || "")}`,
              timestamp: Date.now(),
            };
          }
          if (tool === "Edit" || tool === "Write") {
            return {
              agent: "claude",
              issueId,
              action: "editing",
              detail: `Editing ${shortenPath(input.file_path || "")}`,
              timestamp: Date.now(),
            };
          }
          if (tool === "Bash") {
            return {
              agent: "claude",
              issueId,
              action: "running",
              detail: `Running command`,
              timestamp: Date.now(),
            };
          }
          if (tool === "Glob" || tool === "Grep") {
            return {
              agent: "claude",
              issueId,
              action: "reading",
              detail: `Searching codebase`,
              timestamp: Date.now(),
            };
          }
        }
        if (block.type === "text" && block.text?.length > 0) {
          return {
            agent: "claude",
            issueId,
            action: "thinking",
            detail: "Analyzing...",
            timestamp: Date.now(),
          };
        }
      }
    }
  } catch {
    // Not valid JSON, skip
  }
  return null;
}

function parseCodexLine(
  line: string,
  issueId: string
): AgentActivity | null {
  try {
    const msg = JSON.parse(line);

    if (msg.type === "item.completed" && msg.item) {
      const item = msg.item;
      if (item.type === "function_call") {
        const name = item.name || "";
        if (name === "shell" || name === "bash") {
          return {
            agent: "codex",
            issueId,
            action: "running",
            detail: `Running command`,
            timestamp: Date.now(),
          };
        }
        if (name.includes("read") || name.includes("cat")) {
          return {
            agent: "codex",
            issueId,
            action: "reading",
            detail: `Reading file`,
            timestamp: Date.now(),
          };
        }
        if (name.includes("write") || name.includes("edit") || name.includes("patch")) {
          return {
            agent: "codex",
            issueId,
            action: "editing",
            detail: `Editing file`,
            timestamp: Date.now(),
          };
        }
        return {
          agent: "codex",
          issueId,
          action: "running",
          detail: `${name}`,
          timestamp: Date.now(),
        };
      }
      if (item.type === "message" && item.role === "assistant") {
        return {
          agent: "codex",
          issueId,
          action: "thinking",
          detail: "Analyzing...",
          timestamp: Date.now(),
        };
      }
    }

    if (msg.type === "turn.started") {
      return {
        agent: "codex",
        issueId,
        action: "thinking",
        detail: "Planning next step...",
        timestamp: Date.now(),
      };
    }
  } catch {
    // Not valid JSON, skip
  }
  return null;
}

function shortenPath(fullPath: string): string {
  const parts = fullPath.split("/");
  // Return last 2 segments: "src/App.jsx"
  return parts.slice(-2).join("/");
}

export function runClaudeCode(
  cwd: string,
  originalPath: string,
  issueId: string,
  issueDescription: string,
  previewPort: number,
  pushEvent: EventPusher
): Promise<AgentResult> {
  return new Promise((resolve) => {
    const startTime = Date.now();

    pushEvent(
      createEvent("agent-progress", {
        activity: {
          agent: "claude",
          issueId,
          action: "thinking",
          detail: "Starting Claude Code...",
          timestamp: Date.now(),
        },
      })
    );

    const prompt = `You are fixing a bug in a web application. Here is the issue:

${issueDescription}

Fix this issue by modifying the appropriate source files. Make minimal, targeted changes. Do not refactor unrelated code. Do not add comments explaining your changes.`;

    const proc = spawn(
      "claude",
      [
        "-p",
        prompt,
        "--output-format",
        "stream-json",
        "--verbose",
        "--max-turns",
        "15",
        "--dangerously-skip-permissions",
        "--allowedTools",
        "Read",
        "Write",
        "Edit",
        "Bash",
        "Glob",
        "Grep",
      ],
      {
        cwd,
        stdio: "pipe",
        env: { ...process.env },
      }
    );

    let buffer = "";

    proc.stdout.on("data", (data) => {
      buffer += data.toString();
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (!line.trim()) continue;
        const activity = parseClaudeLine(line, issueId);
        if (activity) {
          pushEvent(createEvent("agent-progress", { activity }));
        }
      }
    });

    proc.on("close", async (code) => {
      const durationMs = Date.now() - startTime;

      try {
        const diff = await getDiff(originalPath, cwd);
        const filesChanged = await getChangedFiles(originalPath, cwd);

        const result: AgentResult = {
          agent: "claude",
          issueId,
          status: code === 0 && diff.length > 0 ? "success" : "failed",
          diff,
          filesChanged,
          durationMs,
          previewPort,
        };

        pushEvent(
          createEvent("agent-progress", {
            activity: {
              agent: "claude",
              issueId,
              action: "done",
              detail: result.status === "success" ? `Fixed in ${(durationMs / 1000).toFixed(1)}s` : "Failed",
              timestamp: Date.now(),
            },
          })
        );

        resolve(result);
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
  pushEvent: EventPusher
): Promise<AgentResult> {
  return new Promise((resolve) => {
    const startTime = Date.now();

    pushEvent(
      createEvent("agent-progress", {
        activity: {
          agent: "codex",
          issueId,
          action: "thinking",
          detail: "Starting Codex...",
          timestamp: Date.now(),
        },
      })
    );

    const prompt = `Fix this issue in the codebase: ${issueDescription}. Make minimal, targeted changes. Do not refactor unrelated code.`;

    const proc = spawn(
      "codex",
      ["exec", "--json", "--full-auto", "--sandbox", "workspace-write", "--skip-git-repo-check", prompt],
      {
        cwd,
        stdio: "pipe",
        env: { ...process.env },
      }
    );

    let stdoutBuffer = "";
    let stderrBuffer = "";

    proc.stdout.on("data", (data) => {
      stdoutBuffer += data.toString();
      const lines = stdoutBuffer.split("\n");
      stdoutBuffer = lines.pop() || "";

      for (const line of lines) {
        if (!line.trim()) continue;
        const activity = parseCodexLine(line, issueId);
        if (activity) {
          pushEvent(createEvent("agent-progress", { activity }));
        }
      }
    });

    proc.stderr.on("data", (data) => {
      stderrBuffer += data.toString();
      // Codex writes progress to stderr — parse for activity hints
      const text = data.toString().toLowerCase();
      if (text.includes("reading") || text.includes("searching")) {
        pushEvent(
          createEvent("agent-progress", {
            activity: {
              agent: "codex",
              issueId,
              action: "reading",
              detail: "Scanning codebase...",
              timestamp: Date.now(),
            },
          })
        );
      }
    });

    proc.on("close", async (code) => {
      const durationMs = Date.now() - startTime;

      try {
        const diff = await getDiff(originalPath, cwd);
        const filesChanged = await getChangedFiles(originalPath, cwd);

        const result: AgentResult = {
          agent: "codex",
          issueId,
          status: code === 0 && diff.length > 0 ? "success" : "failed",
          diff,
          filesChanged,
          durationMs,
          previewPort,
        };

        pushEvent(
          createEvent("agent-progress", {
            activity: {
              agent: "codex",
              issueId,
              action: "done",
              detail: result.status === "success" ? `Fixed in ${(durationMs / 1000).toFixed(1)}s` : "Failed",
              timestamp: Date.now(),
            },
          })
        );

        resolve(result);
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
