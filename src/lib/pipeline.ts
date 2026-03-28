import { v4 as uuidv4 } from "uuid";
import { ScanEvent, Issue, AgentResult } from "./types";
import { createEvent } from "./events";
import {
  cloneRepo,
  installDeps,
  forkSandbox,
  startDevServer,
} from "./sandbox";
import {
  createBrowserSession,
  findIssues,
  getHardcodedIssues,
} from "./browser-agent";
import { runClaudeCode, runCodex } from "./coding-agents";
import { ChildProcess } from "child_process";

const MAX_ISSUES = 2;
const BASE_PORT = 3001;

const childProcesses: ChildProcess[] = [];

export async function* runScan(
  repoUrl: string,
  goal?: string,
  liveUrl?: string
): AsyncGenerator<ScanEvent> {
  const sessionId = uuidv4();
  let originalPath = "";
  let portCounter = BASE_PORT;

  try {
    // Step 1: Clone repo
    yield createEvent("cloning", { repoUrl, sessionId });
    originalPath = await cloneRepo(repoUrl, sessionId);
    yield createEvent("installing", { sessionId });

    // Step 2: Install dependencies
    await installDeps(originalPath);
    yield createEvent("server-started", {
      url: liveUrl || "local clone ready",
    });

    // Step 3: Browser agent explores the app
    const appUrl = liveUrl || "";
    let issues: Issue[] = [];

    if (appUrl && process.env.BROWSER_USE_API_KEY) {
      try {
        const browserSession = await createBrowserSession();
        yield createEvent("browser-session-created", {
          liveUrl: browserSession.liveUrl,
        });

        yield createEvent("browser-exploring", { url: appUrl });
        issues = await findIssues(browserSession.sessionId, appUrl, goal);
      } catch (err) {
        console.error("[variantOS] Browser Use findIssues failed:", err);
        issues = getHardcodedIssues();
        yield createEvent("browser-exploring", {
          url: appUrl,
          fallback: true,
          error: err instanceof Error ? err.message : "Browser Use failed",
        });
      }
    } else {
      issues = getHardcodedIssues();
      yield createEvent("browser-exploring", { fallback: true });
    }

    // Emit issues
    const issuesToFix = issues.slice(0, MAX_ISSUES);
    for (const issue of issuesToFix) {
      yield createEvent("issue-found", { issue });
    }

    // Step 4: For each issue, run both agents with real-time streaming
    const allResults: {
      issue: Issue;
      claude?: AgentResult;
      codex?: AgentResult;
    }[] = [];

    for (const issue of issuesToFix) {
      yield createEvent("agents-started", { issueId: issue.id, issue });

      const claudePort = portCounter++;
      const codexPort = portCounter++;

      const claudePath = await forkSandbox(
        originalPath,
        sessionId,
        `claude-${issue.id.slice(0, 8)}`
      );
      const codexPath = await forkSandbox(
        originalPath,
        sessionId,
        `codex-${issue.id.slice(0, 8)}`
      );

      // Event queue — agents push events, generator drains them
      const eventQueue: ScanEvent[] = [];
      let agentsDone = false;

      const pushEvent = (event: ScanEvent) => {
        eventQueue.push(event);
      };

      // Start both agents (non-blocking)
      const agentsPromise = Promise.all([
        runClaudeCode(
          claudePath,
          originalPath,
          issue.id,
          issue.description,
          claudePort,
          pushEvent
        ),
        runCodex(
          codexPath,
          originalPath,
          issue.id,
          issue.description,
          codexPort,
          pushEvent
        ),
      ]).then((results) => {
        agentsDone = true;
        return results;
      });

      // Poll queue and yield events while agents work
      while (!agentsDone) {
        while (eventQueue.length > 0) {
          yield eventQueue.shift()!;
        }
        await new Promise((r) => setTimeout(r, 200));
      }
      // Drain remaining events
      while (eventQueue.length > 0) {
        yield eventQueue.shift()!;
      }

      const [claudeResult, codexResult] = await agentsPromise;

      // Start preview servers for successful fixes
      if (claudeResult.status === "success") {
        const server = startDevServer(claudePath, claudePort);
        childProcesses.push(server);
      }
      if (codexResult.status === "success") {
        const server = startDevServer(codexPath, codexPort);
        childProcesses.push(server);
      }

      allResults.push({ issue, claude: claudeResult, codex: codexResult });

      yield createEvent("agent-complete", {
        issueId: issue.id,
        claude: claudeResult,
        codex: codexResult,
      });
    }

    // Step 5: Summary
    const claudeSuccesses = allResults.filter(
      (r) => r.claude?.status === "success"
    ).length;
    const codexSuccesses = allResults.filter(
      (r) => r.codex?.status === "success"
    ).length;
    const claudeAvgTime =
      allResults.reduce((sum, r) => sum + (r.claude?.durationMs || 0), 0) /
        allResults.length || 0;
    const codexAvgTime =
      allResults.reduce((sum, r) => sum + (r.codex?.durationMs || 0), 0) /
        allResults.length || 0;

    yield createEvent("scan-complete", {
      sessionId,
      totalIssues: issuesToFix.length,
      results: allResults,
      summary: {
        claude: {
          fixed: claudeSuccesses,
          total: issuesToFix.length,
          avgTimeMs: Math.round(claudeAvgTime),
        },
        codex: {
          fixed: codexSuccesses,
          total: issuesToFix.length,
          avgTimeMs: Math.round(codexAvgTime),
        },
      },
    });
  } catch (err) {
    yield createEvent("error", {
      message: err instanceof Error ? err.message : "Unknown error",
    });
  }
}
