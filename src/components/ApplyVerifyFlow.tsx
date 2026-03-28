"use client";

import { BrowserLiveView } from "./BrowserLiveView";

interface ApplyStep {
  type: string;
  data: Record<string, unknown>;
}

interface ApplyVerifyFlowProps {
  steps: ApplyStep[];
  verifyLiveUrl: string | null;
  bugFixed: boolean | null;
  evidence: string | null;
}

const stepLabels: Record<string, string> = {
  "apply-copying": "Copying fixed files",
  "apply-committing": "Committing & pushing",
  "apply-pr": "Opening PR",
  "apply-building": "Building project",
  "apply-deploying": "Deploying to GitHub Pages",
  "deploy-polling": "Waiting for deployment",
  "deploy-complete": "Deployed",
  "verify-started": "Verifying fix",
  "verify-complete": "Verification complete",
};

export function ApplyVerifyFlow({
  steps,
  verifyLiveUrl,
  bugFixed,
  evidence,
}: ApplyVerifyFlowProps) {
  const lastStep = steps[steps.length - 1];
  const isVerifying = lastStep?.type === "verify-started";
  const isDone = bugFixed !== null;

  return (
    <div className="border border-neutral-800 rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-neutral-800 bg-neutral-900/50">
        <span className="text-sm font-medium text-white">
          {isDone ? "Verification Result" : "Applying Fix"}
        </span>
      </div>

      <div className="p-4 space-y-3">
        <div className="space-y-1 font-mono text-xs">
          {steps.map((step, i) => (
            <div
              key={i}
              className={`flex items-center gap-2 ${
                i === steps.length - 1 && !isDone
                  ? "text-white"
                  : "text-neutral-500"
              }`}
            >
              <span className="w-4 text-center text-neutral-600">
                {i === steps.length - 1 && !isDone ? ">" : "#"}
              </span>
              <span>
                {stepLabels[step.type] || step.type}
                {step.data.prUrl ? (
                  <a
                    href={step.data.prUrl as string}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2 text-neutral-400 hover:text-white"
                  >
                    {" "}view PR
                  </a>
                ) : null}
                {step.type === "deploy-polling" ? (
                  <span className="text-neutral-600">
                    {" "}
                    ({String((step.data.attempt as number) || 0)}/
                    {String((step.data.maxAttempts as number) || 20)})
                  </span>
                ) : null}
              </span>
            </div>
          ))}
        </div>

        {isVerifying && verifyLiveUrl && (
          <div className="mt-3">
            <BrowserLiveView liveUrl={verifyLiveUrl} isExploring={true} />
          </div>
        )}

        {isDone && (
          <div
            className={`mt-3 p-4 rounded-lg border ${
              bugFixed
                ? "border-green-500/30 bg-green-500/5"
                : "border-red-500/30 bg-red-500/5"
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <span
                className={`font-mono text-sm font-medium ${
                  bugFixed ? "text-green-400" : "text-red-400"
                }`}
              >
                {bugFixed ? "Bug fixed" : "Bug still present"}
              </span>
            </div>
            {evidence && (
              <p className="text-xs text-neutral-400 leading-relaxed">
                {evidence}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
