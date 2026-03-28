import { NextRequest } from "next/server";
import { encodeSSE, createEvent } from "@/lib/events";
import { applyFixToRepo, buildAndDeploy, pollDeployment } from "@/lib/sandbox";
import { verifyFix } from "@/lib/browser-agent";
import { Issue } from "@/lib/types";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { sessionId, issueId, agent, repoUrl, method, issueDescription, filesChanged, issue, liveUrl } = body;

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const emit = (type: string, data: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(encodeSSE(createEvent(type as never, data))));
      };

      try {
        const result = await applyFixToRepo({
          sessionId,
          issueId,
          agent,
          repoUrl,
          method,
          issueDescription,
          filesChanged,
          emit,
        });

        emit("apply-committing", { ...result });

        await buildAndDeploy(repoUrl, sessionId, issueId, emit);
        await pollDeployment(repoUrl, emit);

        emit("verify-started", {});

        const pageUrl = liveUrl || `https://${repoUrl.split("/")[3]}.github.io/${repoUrl.split("/")[4]}/`;
        const verification = await verifyFix(pageUrl, issue as Issue);

        emit("verify-started", { liveUrl: verification.liveUrl });
        emit("verify-complete", {
          bugFixed: verification.bugFixed,
          evidence: verification.evidence,
          liveUrl: verification.liveUrl,
        });
      } catch (err) {
        emit("error", { message: err instanceof Error ? err.message : "Apply failed" });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
