import type { BackendRoute } from "../../types";

export const BACKEND_HTTP_BASE =
  import.meta.env.VITE_BACKEND_HTTP_BASE || "http://localhost:3000";

export const BACKEND_WS_BASE =
  import.meta.env.VITE_BACKEND_WS_BASE || "ws://localhost:3000/ws";

export const backendRoutes: BackendRoute[] = [
  { label: "Current Data", path: "/data", method: "GET", group: "api", description: "Current ingame or postgame snapshot." },
  { label: "Ingame", path: "/ingame", method: "GET", group: "api", description: "Full ingame snapshot." },
  { label: "Postgame", path: "/postgame", method: "GET", group: "api", description: "Full postgame snapshot." },
  { label: "Players", path: "/players", method: "GET", group: "api", description: "All players, with postgame fallback." },
  { label: "Left Players", path: "/players/left", method: "GET", group: "api", description: "Left team players." },
  { label: "Right Players", path: "/players/right", method: "GET", group: "api", description: "Right team players." },
  { label: "Postgame Players", path: "/postgame/players", method: "GET", group: "api", description: "All postgame players." },
  { label: "Gold Diff", path: "/golddiff", method: "GET", group: "api", description: "Per-role current gold difference." },
  { label: "Postgame Gold Diff", path: "/postgame/golddiff", method: "GET", group: "api", description: "Per-role postgame gold difference." },
  { label: "Role Assign", path: "/assign", method: "POST", group: "control", description: "Save role assignments." },
  { label: "Timer Text", path: "/txt/timer.txt", method: "GET", group: "text", description: "vMix timer text source." },
  { label: "Hero Image", path: "/hero-image/:heroid", method: "GET", group: "asset", description: "Ingame hero image." },
  { label: "Draft Hero Image", path: "/drafthero-image/:heroid.png", method: "GET", group: "asset", description: "Draft hero image." }
];

export async function requestBackend<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${BACKEND_HTTP_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    ...init
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed with ${response.status}`);
  }

  return response.json() as Promise<T>;
}
