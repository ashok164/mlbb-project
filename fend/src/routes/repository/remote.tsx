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
    }
  ];
}
