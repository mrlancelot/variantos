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

export function startDevServer(
  projectPath: string,
  port: number
): ChildProcess {
  const pkgJson = path.join(projectPath, "package.json");
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
      ["-rqu", "--exclude=node_modules", "--exclude=.git", "--exclude=.next", originalPath, fixedPath],
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
  return new Promise((resolve, reject) => {
    const proc = spawn("ngrok", ["http", String(port), "--log=stdout"], {
      stdio: "pipe",
    });

    let resolved = false;
    proc.stdout.on("data", (data) => {
      const line = data.toString();
      const match = line.match(/url=(https:\/\/[^\s]+)/);
      if (match && !resolved) {
        resolved = true;
        resolve(match[1]);
      }
    });

    // Also try the ngrok API as fallback
    setTimeout(async () => {
      if (resolved) return;
      try {
        const res = await fetch("http://127.0.0.1:4040/api/tunnels");
        const json = await res.json();
        const tunnel = json.tunnels?.[0]?.public_url;
        if (tunnel) {
          resolved = true;
          resolve(tunnel);
        }
      } catch {
        // ngrok API not ready yet
      }
    }, 3000);

    setTimeout(() => {
      if (!resolved) reject(new Error("ngrok tunnel timeout"));
    }, 15000);

    proc.on("error", (err) => {
      if (!resolved) reject(err);
    });
  });
}

export async function cleanup(sessionId: string): Promise<void> {
  const sessionDir = getSessionDir(sessionId);
  if (existsSync(sessionDir)) {
    await rm(sessionDir, { recursive: true, force: true });
  }
}
