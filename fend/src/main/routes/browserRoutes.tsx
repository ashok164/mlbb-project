import type { ReactElement } from "react";
import { Layout } from "../view/Layout";
import ControlPage from "../../control/view";
import InGameNotificationPage from "../../in-game-notification/view";
import NotificationPage from "../../notification/view";
import RoutesPage from "../../routes/view";

export type BrowserRoute = {
  path: string;
  label: string;
  element: ReactElement;
};

export const browserRoutes: BrowserRoute[] = [
  { path: "/", label: "In-Game Notification", element: <InGameNotificationPage /> },
  { path: "/in-game-notification", label: "In-Game Notification", element: <InGameNotificationPage /> },
  { path: "/notification", label: "Notifications", element: <NotificationPage /> },
  { path: "/notiication", label: "Notifications", element: <NotificationPage /> },
  { path: "/routes", label: "Routes", element: <RoutesPage /> },
  { path: "/control", label: "Control", element: <ControlPage /> }
];

function resolveRoute(pathname: string) {
  return browserRoutes.find((route) => route.path === pathname) || browserRoutes[0];
}

export function AppRouter() {
  const activeRoute = resolveRoute(window.location.pathname);

  if (activeRoute.path === "/" || activeRoute.path === "/in-game-notification") {
    return activeRoute.element;
  }

  return <Layout activePath={activeRoute.path}>{activeRoute.element}</Layout>;
}
