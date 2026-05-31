import type { WsEnvelope } from "../types";

export function mapSocketMessage(raw: string): WsEnvelope {
  try {
    const parsed = JSON.parse(raw) as WsEnvelope;
    return {
      type: parsed.type || "data",
      state: parsed.state || "unknown",
      battle_id: parsed.battle_id || "",
      updated_at: parsed.updated_at || new Date().toISOString(),
      ok: Boolean(parsed.ok),
      data: parsed.data,
      error: parsed.error
    };
  } catch {
    return {
      type: "invalid",
      state: "unknown",
      battle_id: "",
      updated_at: new Date().toISOString(),
      ok: false,
      error: "Invalid websocket message"
    };
  }
}
