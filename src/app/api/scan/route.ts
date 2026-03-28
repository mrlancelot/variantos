import { NextRequest } from "next/server";
import { runScan } from "@/lib/pipeline";
import { encodeSSE } from "@/lib/events";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { repoUrl, goal, liveUrl } = body;

  if (!repoUrl) {
    return new Response(JSON.stringify({ error: "repoUrl is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      try {
        for await (const event of runScan(repoUrl, goal, liveUrl)) {
          const sseData = encodeSSE(event);
          controller.enqueue(encoder.encode(sseData));
        }
      } catch (err) {
        const errorEvent = encodeSSE({
          type: "error",
          data: {
            message: err instanceof Error ? err.message : "Pipeline failed",
          },
          timestamp: Date.now(),
        });
        controller.enqueue(encoder.encode(errorEvent));
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
