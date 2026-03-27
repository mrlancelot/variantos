import { ScanEvent, ScanEventType } from "./types";

export function createEvent(
  type: ScanEventType,
  data: Record<string, unknown> = {}
): ScanEvent {
  return { type, data, timestamp: Date.now() };
}

export function encodeSSE(event: ScanEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}
