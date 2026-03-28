import { spawn, ChildProcess } from "child_process";
import { existsSync } from "fs";
import { mkdir, rm, cp } from "fs/promises";
import path from "path";

const BASE_DIR = "/tmp/variantos";

export function getSessionDir(sessionId: string): string {
  return path.join(BASE_DIR, sessionId);
}

export async function cloneRepo(
  repoUrl: string,
  sessionId: string
): Promise<string> {
  const sessionDir = getSessionDir(sessionId);
  const destPath = path.join(sessionDir, "original");
  await mkdir(destPath, { recursive: true });

  return new Promise((resolve, reject) => {
    const proc = spawn("git", ["clone", "--depth", "1", repoUrl, destPath], {
      stdio: "pipe",
    });
    let stderr = "";
    proc.stderr.on("data", (d) => (stderr += d.toString()));
    proc.on("close", (code) => {
      if (code === 0) resolve(destPath);
      else reject(new Error(`git clone failed: ${stderr}`));
    });
  });
}

export async function installDeps(projectPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // Try bun first, fall back to npm
    const pkgLock = existsSync(path.join(projectPath, "bun.lockb")) ||
      existsSync(path.join(projectPath, "bun.lock"));
    const cmd = pkgLock ? "bun" : "npm";
    const args = ["install"];

    const proc = spawn(cmd, args, { cwd: projectPath, stdio: "pipe" });
    let stderr = "";
    proc.stderr.on("data", (d) => (stderr += d.toString()));
    proc.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${cmd} install failed: ${stderr}`));
    });
  });
}

export async function forkSandbox(
  originalPath: string,
  sessionId: string,
  name: string
): Promise<string> {
  const destPath = path.join(getSessionDir(sessionId), name);
  await cp(originalPath, destPath, { recursive: true });
  return destPath;
}

export async function buildProject(projectPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const cmd = existsSync(path.join(projectPath, "bun.lockb")) ||
      existsSync(path.join(projectPath, "bun.lock"))
      ? "bun" : "npm";
    const proc = spawn(cmd, ["run", "build"], { cwd: projectPath, stdio: "pipe" });
    let stderr = "";
    proc.stderr.on("data", (d) => (stderr += d.toString()));
    proc.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`build failed: ${stderr}`));
    });
  });
}

export function startStaticServer(
  projectPath: string,
  port: number
): ChildProcess {
  const isVite = existsSync(path.join(projectPath, "vite.config.ts")) ||
    existsSync(path.join(projectPath, "vite.config.js"));

  if (isVite) {
    // Use vite preview for built Vite projects — most reliable
    const proc = spawn("npx", ["vite", "preview", "--port", String(port), "--host", "--strictPort"], {
      cwd: projectPath,
      stdio: "pipe",
      env: { ...process.env },
    });
    return proc;
  }

  // Fallback: python3 simple HTTP server
  const distPath = path.join(projectPath, "dist");
  const servePath = existsSync(distPath) ? distPath : projectPath;
  const proc = spawn("python3", ["-m", "http.server", String(port), "--bind", "0.0.0.0"], {
    cwd: servePath,
    stdio: "pipe",
    env: { ...process.env },
  });
  return proc;
}

export function startDevServer(
  projectPath: string,
  port: number
): ChildProcess {
  let cmd = "npm";
  let args = ["run", "dev", "--", "--port", String(port)];

  if (existsSync(path.join(projectPath, "bun.lockb")) || existsSync(path.join(projectPath, "bun.lock"))) {
    cmd = "bun";
    args = ["run", "dev", "--port", String(port)];
  }

  // Check if it's a Vite project
  if (existsSync(path.join(projectPath, "vite.config.ts")) || existsSync(path.join(projectPath, "vite.config.js"))) {
    args = ["run", "dev", "--", "--port", String(port), "--host"];
  }

  const proc = spawn(cmd, args, {
    cwd: projectPath,
    stdio: "pipe",
    env: { ...process.env, PORT: String(port) },
  });

  return proc;
}

export async function getDiff(
  originalPath: string,
  fixedPath: string
): Promise<string> {
  return new Promise((resolve) => {
    const proc = spawn(
      "diff",
      ["-ru", "--exclude=node_modules", "--exclude=.git", "--exclude=.next", "--exclude=bun.lock", "--exclude=dist", originalPath, fixedPath],
      { stdio: "pipe" }
    );
    let output = "";
    proc.stdout.on("data", (d) => (output += d.toString()));
    proc.on("close", () => resolve(output));
  });
}

export async function getChangedFiles(
  originalPath: string,
  fixedPath: string
): Promise<string[]> {
  return new Promise((resolve) => {
    const proc = spawn(
      "diff",
      ["-rq", "--exclude=node_modules", "--exclude=.git", "--exclude=.next", originalPath, fixedPath],
      { stdio: "pipe" }
    );
    let output = "";
    proc.stdout.on("data", (d) => (output += d.toString()));
    proc.on("close", () => {
      const files = output
        .split("\n")
        .filter((l) => l.startsWith("Files"))
        .map((l) => {
          const match = l.match(/Files .* and (.*) differ/);
          return match ? match[1].replace(fixedPath + "/", "") : "";
        })
        .filter(Boolean);
      resolve(files);
    });
  });
}

export async function startTunnel(port: number): Promise<string> {
  // Use localtunnel — no interstitial warning page like ngrok free tier
  const localtunnel = (await import("localtunnel")).default;
  const tunnel = await localtunnel({ port });
  return tunnel.url;
}

export async function cleanup(sessionId: string): Promise<void> {
  const sessionDir = getSessionDir(sessionId);
  if (existsSync(sessionDir)) {
    await rm(sessionDir, { recursive: true, force: true });
  }
}

function exec(cmd: string, args: string[], cwd: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args, { cwd, stdio: "pipe" });
    let stdout = "";
    let stderr = "";
    proc.stdout.on("data", (d) => (stdout += d.toString()));
    proc.stderr.on("data", (d) => (stderr += d.toString()));
    proc.on("close", (code) => {
      if (code === 0) resolve(stdout.trim());
      else reject(new Error(`${cmd} ${args[0]} failed: ${stderr}`));
    });
  });
}

type EventEmitter = (type: string, data: Record<string, unknown>) => void;

export async function applyFixToRepo(params: {
  sessionId: string;
  issueId: string;
  agent: "claude" | "codex";
  repoUrl: string;
  method: "main" | "pr";
  issueDescription: string;
  filesChanged: string[];
  emit: EventEmitter;
}): Promise<{ branch: string; prUrl?: string; commitSha: string }> {
  const { sessionId, issueId, agent, repoUrl, method, issueDescription, filesChanged, emit } = params;

  const fixDir = path.join(getSessionDir(sessionId), `${agent}-${issueId.slice(0, 8)}`);
  const workDir = path.join(getSessionDir(sessionId), "apply-work");
  await mkdir(workDir, { recursive: true });

  emit("apply-copying", { agent, issueId });

  await exec("git", ["clone", "--depth", "10", repoUrl, workDir], getSessionDir(sessionId));

  for (const file of filesChanged) {
    const src = path.join(fixDir, file);
    const dest = path.join(workDir, file);
    await mkdir(path.dirname(dest), { recursive: true });
    await cp(src, dest);
  }

  const branch = method === "pr" ? `fix/${issueId.slice(0, 8)}-${agent}` : "master";

  if (method === "pr") {
    await exec("git", ["checkout", "-b", branch], workDir);
  }

  emit("apply-committing", { branch });

  await exec("git", ["add", "-A"], workDir);
  const shortDesc = issueDescription.slice(0, 60);
  await exec("git", ["commit", "-m", `fix: ${shortDesc} (${agent})`], workDir);
  await exec("git", ["push", "origin", branch], workDir);

  const commitSha = await exec("git", ["rev-parse", "HEAD"], workDir);

  let prUrl: string | undefined;
  if (method === "pr") {
    emit("apply-pr", { branch });
    prUrl = await exec("gh", ["pr", "create", "--title", `fix: ${shortDesc}`, "--body", `Fixed by ${agent} via variantOS`, "--head", branch], workDir);
  }

  return { branch, prUrl, commitSha };
}

export async function buildAndDeploy(
  repoUrl: string,
  sessionId: string,
  emit: EventEmitter
): Promise<void> {
  const workDir = path.join(getSessionDir(sessionId), "apply-work");

  emit("apply-building", {});
  await exec("bun", ["install"], workDir);
  await exec("bun", ["run", "build"], workDir);

  emit("apply-deploying", {});

  const distDir = path.join(workDir, "dist");
  await exec("git", ["init"], distDir);
  await exec("git", ["checkout", "-b", "gh-pages"], distDir);
  await exec("git", ["add", "-A"], distDir);
  await exec("git", ["commit", "-m", "deploy"], distDir);
  await exec("git", ["push", "-f", repoUrl, "gh-pages"], distDir);

  await rm(path.join(distDir, ".git"), { recursive: true, force: true });
}

function parseRepoUrl(repoUrl: string): { owner: string; repo: string } {
  const match = repoUrl.match(/github\.com\/([^/]+)\/([^/.]+)/);
  if (!match) throw new Error("Invalid GitHub URL");
  return { owner: match[1], repo: match[2] };
}

export async function pollDeployment(
  repoUrl: string,
  emit: EventEmitter
): Promise<void> {
  const { owner, repo } = parseRepoUrl(repoUrl);
  const maxAttempts = 20;

  for (let i = 0; i < maxAttempts; i++) {
    emit("deploy-polling", { attempt: i + 1, maxAttempts });
    try {
      const result = await exec("gh", ["api", `repos/${owner}/${repo}/pages/builds/latest`, "--jq", ".status"], "/tmp");
      if (result === "built") {
        emit("deploy-complete", {});
        return;
      }
    } catch {
      // Pages API may not be ready yet
    }
    await new Promise((r) => setTimeout(r, 3000));
  }
  emit("deploy-complete", { timeout: true });
}
