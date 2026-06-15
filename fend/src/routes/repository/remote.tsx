import { BACKEND_HTTP_BASE, backendRoutes } from "../../main/routes/apiRoutes";
import type { BackendRoute } from "../../types";

export type RouteLink = BackendRoute & {
  url: string;
};

export type OverlayRouteLink = {
  label: string;
  path: string;
  url: string;
  description: string;
};

export function getControlRoutes() {
  return backendRoutes
    .filter((route) => ["control", "api", "text", "asset"].includes(route.group))
    .map((route) => ({ ...route, url: `${BACKEND_HTTP_BASE}${route.path}` }));
}

export function getOverlayRoutes(): OverlayRouteLink[] {
  return [
    {
      label: "In-Game Notification",
      path: "/in-game-notification",
      url: "/in-game-notification",
      description: "Full-screen level-up notification overlay for vMix/browser capture."
    },
    {
      label: "Broadcast Live Levels",
      path: "/broadcast/live-levels",
      url: "/broadcast/live-levels",
      description: "Permanent live level board with hero, spell, KDA, player name, and emblem."
    },
    {
      label: "Broadcast Live Gold Ranking",
      path: "/broadcast/live-gold-ranking",
      url: "/broadcast/live-gold-ranking",
      description: "Live all-player gold ranking overlay with player picture, name, character, and gold."
    },
    {
      label: "Broadcast Team Gold Ranking",
      path: "/broadcast/team-gold-ranking",
      url: "/broadcast/team-gold-ranking",
      description: "Separate left and right team gold ranking overlay with capped 100K progress bars."
    },
    {
      label: "Broadcast Team Level Ranking",
      path: "/broadcast/team-level-ranking",
      url: "/broadcast/team-level-ranking",
      description: "Combined team level ranking overlay with player portraits and level progress bars."
    }
  ];
}
